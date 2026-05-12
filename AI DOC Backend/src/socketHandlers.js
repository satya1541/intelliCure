const { allowedIds, allowedRoles } = require("./config");
const {
  makeKey,
  getSocketId,
  storeSocket,
  removeSocket,
  removeSocketById,
} = require("./socketRegistry");
const { createWherebyRoom } = require("./whereby");

const latestVitalsByPair = new Map();

function makeVitalsKey(wardId, doctorId) {
  return `${wardId}:${doctorId}`;
}

function storeVitalsSnapshot(payload) {
  const { wardId, doctorId, vitals, patient, updatedAt, source } = payload || {};

  if (!wardId || !doctorId || !vitals) {
    return null;
  }

  const snapshot = {
    wardId,
    doctorId,
    vitals,
    patient,
    updatedAt: typeof updatedAt === "number" ? updatedAt : Date.now(),
    source: source || "intelli-icu",
  };

  latestVitalsByPair.set(makeVitalsKey(wardId, doctorId), snapshot);
  return snapshot;
}

function getVitalsSnapshot(wardId, doctorId) {
  if (!wardId || !doctorId) {
    return null;
  }

  return latestVitalsByPair.get(makeVitalsKey(wardId, doctorId)) || null;
}

function isValidRoleId(role, id) {
  return Boolean(role && id && allowedRoles.has(role) && allowedIds[role].has(id));
}

function emitError(socket, message, details) {
  socket.emit("call:error", { message, ...details });
}

function logEvent(event, payload) {
  console.log(`[${event}]`, payload || {});
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[connect] ${socket.id}`);

    socket.on("register", (payload) => {
      logEvent("register", payload);
      const { role, id } = payload || {};

      if (!isValidRoleId(role, id)) {
        console.log("[register] invalid role/id", { role, id });
        emitError(socket, "Invalid role or id", { role, id });
        return;
      }

      socket.data.role = role;
      socket.data.id = id;
      storeSocket(role, id, socket.id);
      console.log("[register] stored", {
        key: makeKey(role, id),
        socketId: socket.id,
      });
    });

    socket.on("call:request", (payload) => {
      logEvent("call:request", payload);
      const { toRole, toId } = payload || {};
      const targetSocketId = getSocketId(toRole, toId);

      if (!targetSocketId) {
        console.log("[call:request] target not found", { toRole, toId });
        emitError(socket, "Target not connected", { toRole, toId });
        return;
      }

      console.log("[call:request] target found", {
        toRole,
        toId,
        targetSocketId,
      });

      io.to(targetSocketId).emit("call:incoming", payload);
      console.log("[call:incoming] emitted", { toRole, toId });
    });

    socket.on("call:cancel", (payload) => {
      logEvent("call:cancel", payload);
      const { toRole, toId } = payload || {};
      const targetSocketId = getSocketId(toRole, toId);

      if (!targetSocketId) {
        emitError(socket, "Target not connected", { toRole, toId });
        return;
      }

      io.to(targetSocketId).emit("call:cancelled", payload);
    });

    socket.on("call:accept", async (payload) => {
      logEvent("call:accept", payload);
      const { toRole, toId } = payload || {};
      const targetSocketId = getSocketId(toRole, toId);

      if (!targetSocketId) {
        emitError(socket, "Caller not connected", { toRole, toId });
        return;
      }

      io.to(targetSocketId).emit("call:accepted", payload);
      socket.emit("call:accepted", payload);

      const accepter = { role: socket.data?.role, id: socket.data?.id };
      const caller = { role: toRole, id: toId };
      const roles = new Set([accepter.role, caller.role]);
      const isDoctorWardPair = roles.has("doctor") && roles.has("ward");

      if (!isDoctorWardPair) {
        return;
      }

      const wardId = accepter.role === "ward" ? accepter.id : caller.id;
      const doctorId = accepter.role === "doctor" ? accepter.id : caller.id;

      try {
        const room = await createWherebyRoom({ wardId, doctorId });
        const latestVitals = getVitalsSnapshot(wardId, doctorId);
        const roomPayload = {
          ...room,
          toRole,
          toId,
          vitals: latestVitals?.vitals || null,
          patient: latestVitals?.patient || null,
          updatedAt: latestVitals?.updatedAt || null,
          source: latestVitals?.source || null,
        };

        io.to(targetSocketId).emit("call:room", roomPayload);
        socket.emit("call:room", roomPayload);
      } catch (error) {
        console.log("[call:room] failed", { message: error?.message });
        emitError(socket, "Failed to create video room", {
          toRole,
          toId,
        });
        io.to(targetSocketId).emit("call:error", {
          message: "Failed to create video room",
          toRole,
          toId,
        });
      }
    });

    socket.on("icu:vitals:update", (payload) => {
      logEvent("icu:vitals:update", payload);

      const snapshot = storeVitalsSnapshot(payload);

      if (!snapshot) {
        return;
      }

      const targetSocketId = getSocketId("doctor", snapshot.doctorId);

      if (!targetSocketId) {
        return;
      }

      io.to(targetSocketId).emit("icu:vitals:update", snapshot);
    });

    socket.on("call:reject", (payload) => {
      logEvent("call:reject", payload);
      const { toRole, toId } = payload || {};
      const targetSocketId = getSocketId(toRole, toId);

      if (!targetSocketId) {
        emitError(socket, "Caller not connected", { toRole, toId });
        return;
      }

      io.to(targetSocketId).emit("call:rejected", payload);
    });

    socket.on("disconnect", () => {
      logEvent("disconnect", { socketId: socket.id });
      const { role, id } = socket.data || {};

      if (role && id) {
        removeSocket(role, id, socket.id);
        return;
      }

      removeSocketById(socket.id);
    });
  });
}

module.exports = { registerSocketHandlers };
