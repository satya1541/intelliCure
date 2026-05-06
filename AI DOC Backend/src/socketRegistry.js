const socketRegistry = new Map();

function makeKey(role, id) {
  return `${role}:${id}`;
}

function getSocketId(role, id) {
  return socketRegistry.get(makeKey(role, id));
}

function storeSocket(role, id, socketId) {
  socketRegistry.set(makeKey(role, id), socketId);
}

function removeSocket(role, id, socketId) {
  const key = makeKey(role, id);
  if (!socketRegistry.has(key)) {
    return;
  }

  // Guard against reconnect races: only clear if this disconnect is still the active mapping.
  if (socketId && socketRegistry.get(key) !== socketId) {
    return;
  }

  socketRegistry.delete(key);
}

function removeSocketById(socketId) {
  for (const [key, storedSocketId] of socketRegistry.entries()) {
    if (storedSocketId === socketId) {
      socketRegistry.delete(key);
      break;
    }
  }
}

module.exports = {
  makeKey,
  getSocketId,
  storeSocket,
  removeSocket,
  removeSocketById,
};
