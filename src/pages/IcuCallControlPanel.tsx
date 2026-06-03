import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { connectSocket } from "@/lib/consultationSocket"
import type { IcuPatientContext, IcuVitalsBroadcast, LiveVitalsSnapshot } from "./liveVitals"
import { defaultDoctorId, defaultWardId, doctorById, doctors, wardById, wards } from "./consultation/shared"

type ConsultationRole = "doctor" | "ward"

type CallPacket = {
  fromRole: ConsultationRole
  fromId: string
  toRole: ConsultationRole
  toId: string
}

type RoomPacket = Partial<CallPacket> & {
  meetingId?: string
  roomUrl?: string
  hostRoomUrl?: string
  wardId?: string
  doctorId?: string
}

const ringtoneFile = "vc audio.mpeg"
const ringtoneUrl = `/audio/${encodeURIComponent(ringtoneFile)}`
const currentRole: ConsultationRole = "ward"
const currentId = defaultWardId
const wardTargets = wards.filter((ward) => ward.id !== currentId)

type IcuCallControlPanelProps = {
  liveVitals?: LiveVitalsSnapshot
  patientContext?: IcuPatientContext
}

function getContactName(role: ConsultationRole, peerId: string) {
  if (role === "doctor") {
    const doc = doctors.find((d) => d.id === peerId)
    return doc ? doc.name : peerId
  }
  const wrd = wards.find((w) => w.id === peerId)
  return wrd ? wrd.name : peerId
}

export default function IcuCallControlPanel({ liveVitals, patientContext }: IcuCallControlPanelProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(defaultDoctorId)
  const [selectedWardId, setSelectedWardId] = useState(wardTargets[0]?.id || defaultWardId)
  const [incomingCall, setIncomingCall] = useState<CallPacket | null>(null)
  const [outgoingCall, setOutgoingCall] = useState<CallPacket | null>(null)
  const [connectingCall, setConnectingCall] = useState(false)
  const [roomDetails, setRoomDetails] = useState<(RoomPacket & { joinUrl: string }) | null>(null)
  const [roomTargetRole, setRoomTargetRole] = useState<ConsultationRole | null>(null)
  const [activeDoctorCallId, setActiveDoctorCallId] = useState<string | null>(null)
  const [socketStatus, setSocketStatus] = useState("connecting")
  const [toast, setToast] = useState("")
  const [lastEvent, setLastEvent] = useState("Waiting")
  const [roomFrameKey, setRoomFrameKey] = useState(0)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const doctorVideoRef = useRef<HTMLDivElement | null>(null)
  const wardVideoRef = useRef<HTMLDivElement | null>(null)

  const currentName = wardById[currentId] || currentId
  const selectedDoctorName = getContactName("doctor", selectedDoctorId)
  const selectedWardName = getContactName("ward", selectedWardId)
  const outgoingName = outgoingCall ? getContactName(outgoingCall.toRole, outgoingCall.toId) : ""

  useEffect(() => {
    if (!liveVitals || !activeDoctorCallId) {
      return
    }

    const socket = connectSocket()
    const broadcastPacket: IcuVitalsBroadcast = {
      source: "intelli-icu",
      wardId: currentId,
      doctorId: activeDoctorCallId,
      vitals: liveVitals,
      patient: patientContext,
      updatedAt: Date.now(),
    }

    socket.emit("icu:vitals:update", broadcastPacket)
  }, [
    activeDoctorCallId,
    currentId,
    liveVitals?.diastolic,
    liveVitals?.heartRate,
    liveVitals?.oxygen,
    liveVitals?.respiratoryRate,
    liveVitals?.systolic,
    liveVitals?.temperature,
    patientContext?.ambRegNo,
    patientContext?.bed,
    patientContext?.diagnosis,
    patientContext?.patientAge,
    patientContext?.patientName,
    patientContext?.shift,
  ])

  useEffect(() => {
    if (roomDetails?.joinUrl && roomTargetRole) {
      const ref = roomTargetRole === "doctor" ? doctorVideoRef : wardVideoRef
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 200)
    }
  }, [roomDetails, roomTargetRole])

  useEffect(() => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio(ringtoneUrl)
      ringtoneRef.current.loop = true
      ringtoneRef.current.preload = "auto"
      ringtoneRef.current.volume = 0.8
    }

    const audio = ringtoneRef.current

    if (incomingCall) {
      audio.play().catch(() => {
        setToast("Tap to enable sound")
      })
    } else {
      audio.pause()
      audio.currentTime = 0
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [incomingCall])

  useEffect(() => {
    const socket = connectSocket()

    const handleConnect = () => {
      setSocketStatus("connected")
      socket.emit("register", { role: currentRole, id: currentId })
    }

    const handleIncoming = (payload: CallPacket) => {
      if (payload.toRole !== currentRole || payload.toId !== currentId) {
        return
      }

      setIncomingCall(payload)
      setToast(`Incoming call from ${getContactName(payload.fromRole, payload.fromId)}`)
    }

    const handleAccepted = (payload: CallPacket) => {
      setOutgoingCall(null)
      setConnectingCall(true)
      setToast(`Call accepted by ${getContactName(payload.fromRole, payload.fromId)}`)
    }

    const handleRoom = (payload: RoomPacket) => {
      const isCurrentPair = payload.wardId === currentId

      if (!isCurrentPair || !payload.roomUrl) {
        return
      }

      setRoomDetails({ ...payload, joinUrl: payload.roomUrl })
      setIncomingCall(null)
      setOutgoingCall(null)
      setConnectingCall(false)
      setRoomTargetRole(payload.fromRole === "doctor" ? "doctor" : "ward")
      if (payload.doctorId) {
        setActiveDoctorCallId(payload.doctorId)
      }
      setRoomFrameKey((value) => value + 1)
      setToast("Room ready. Joining now...")
    }

    const handleRejected = (payload: CallPacket) => {
      setOutgoingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      if (payload.fromRole === "doctor") {
        setActiveDoctorCallId(null)
      }
      setToast(`Call rejected by ${getContactName(payload.fromRole, payload.fromId)}`)
    }

    const handleCancelled = (payload: CallPacket) => {
      setOutgoingCall(null)
      setIncomingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      if (payload.fromRole === "doctor") {
        setActiveDoctorCallId(null)
      }
      setToast(`Call cancelled by ${getContactName(payload.fromRole, payload.fromId)}`)
    }

    const handleError = (payload: { message?: string }) => {
      setOutgoingCall(null)
      setIncomingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      setActiveDoctorCallId(null)
      setToast(payload?.message || "Target is offline")
    }

    const handleConnectError = () => {
      setSocketStatus("error")
      setToast("Socket connection failed")
    }

    const handleDisconnect = () => {
      setSocketStatus("disconnected")
      setIncomingCall(null)
      setOutgoingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      setActiveDoctorCallId(null)
    }

    const handleAny = (event: string) => {
      setLastEvent(event)
    }

    socket.on("connect", handleConnect)
    socket.on("call:incoming", handleIncoming)
    socket.on("call:accepted", handleAccepted)
    socket.on("call:room", handleRoom)
    socket.on("call:rejected", handleRejected)
    socket.on("call:cancelled", handleCancelled)
    socket.on("call:error", handleError)
    socket.on("connect_error", handleConnectError)
    socket.on("disconnect", handleDisconnect)
    socket.onAny(handleAny)

    if (socket.connected) {
      handleConnect()
    }

    return () => {
      socket.off("connect", handleConnect)
      socket.off("call:incoming", handleIncoming)
      socket.off("call:accepted", handleAccepted)
      socket.off("call:room", handleRoom)
      socket.off("call:rejected", handleRejected)
      socket.off("call:cancelled", handleCancelled)
      socket.off("call:error", handleError)
      socket.off("connect_error", handleConnectError)
      socket.off("disconnect", handleDisconnect)
      socket.offAny(handleAny)
    }
  }, [])

  useEffect(() => {
    if (!outgoingCall) {
      return undefined
    }

    const socket = connectSocket()
    const timeout = window.setTimeout(() => {
      socket.emit("call:cancel", outgoingCall)
      setOutgoingCall(null)
      setToast("No response in 30s, call ended")
    }, 30000)

    return () => window.clearTimeout(timeout)
  }, [outgoingCall])

  const handlePlaceCall = (targetRole: ConsultationRole, targetId: string) => {
    const socket = connectSocket()
    const packet: CallPacket = {
      fromRole: currentRole,
      fromId: currentId,
      toRole: targetRole,
      toId: targetId,
    }

    setOutgoingCall(packet)
    setConnectingCall(false)
    setRoomDetails(null)
    setRoomTargetRole(targetRole)
    setActiveDoctorCallId(targetRole === "doctor" ? targetId : null)
    socket.emit("call:request", packet)
  }

  const handleCancelCall = () => {
    if (!outgoingCall) {
      return
    }

    const socket = connectSocket()
    socket.emit("call:cancel", outgoingCall)
    setOutgoingCall(null)
    if (outgoingCall.toRole === "doctor") {
      setActiveDoctorCallId(null)
    }
  }

  const handleAccept = () => {
    if (!incomingCall) {
      return
    }

    const socket = connectSocket()
    socket.emit("call:accept", {
      fromRole: currentRole,
      fromId: currentId,
      toRole: incomingCall.fromRole,
      toId: incomingCall.fromId,
    })
    setRoomTargetRole(incomingCall.fromRole)
    if (incomingCall.fromRole === "doctor") {
      setActiveDoctorCallId(incomingCall.fromId)
    }
    setIncomingCall(null)
  }

  const handleReject = () => {
    if (!incomingCall) {
      return
    }

    const socket = connectSocket()
    socket.emit("call:reject", {
      fromRole: currentRole,
      fromId: currentId,
      toRole: incomingCall.fromRole,
      toId: incomingCall.fromId,
    })
    setIncomingCall(null)
  }

  const handleEndSession = () => {
    setRoomDetails(null)
    setRoomTargetRole(null)
    setConnectingCall(false)
    setOutgoingCall(null)
    setIncomingCall(null)
    setActiveDoctorCallId(null)
    setToast("Session ended")
    window.location.reload()
  }

  const incomingCallerName = incomingCall ? getContactName(incomingCall.fromRole, incomingCall.fromId) : ""

  return (
    <div style={{ position: "relative" }}>
      {/* ── Inline Incoming Call Banner ── */}
      {incomingCall ? (
        <div
          style={{
            marginBottom: 16,
            padding: "20px 22px",
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(46,163,209,0.10))",
            border: "1.5px solid rgba(16,185,129,0.45)",
            boxShadow: "0 0 28px rgba(16,185,129,0.18), 0 12px 40px rgba(0,0,0,0.3)",
            animation: "icu-incoming-pulse 2s ease-in-out infinite",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 10px rgba(16,185,129,0.7)",
                animation: "icu-dot-blink 1s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase" as const,
                letterSpacing: "0.25em",
                color: "#6ee7b7",
              }}
            >
              Incoming {incomingCall.fromRole === "doctor" ? "Doctor" : "Ward"} Call
            </span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#fff" }}>
            {incomingCallerName}
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
            is requesting a live consultation. Accept to join the video room.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              onClick={handleAccept}
              style={{
                padding: "11px 0",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.45)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16,185,129,0.35)" }}
            >
              ✓ Accept
            </button>
            <button
              type="button"
              onClick={handleReject}
              style={{
                padding: "11px 0",
                borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.15)",
                color: "#fca5a5",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                transition: "transform 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.background = "rgba(239,68,68,0.25)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "rgba(239,68,68,0.15)" }}
            >
              ✕ Reject
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Inline Outgoing Call Banner ── */}
      {outgoingCall ? (
        <div
          style={{
            marginBottom: 16,
            padding: "20px 22px",
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.10))",
            border: "1.5px solid rgba(124,58,237,0.4)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            textAlign: "center" as const,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#c4b5fd" }} aria-hidden="true" />
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.25em", color: "#c4b5fd" }}>
              Calling
            </span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#fff" }}>
            {outgoingName}...
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            Awaiting response from the other side.
          </p>
          <button
            type="button"
            onClick={handleCancelCall}
            style={{
              padding: "10px 28px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
          >
            Cancel Call
          </button>
        </div>
      ) : null}

      {/* ── Inline Connecting Banner ── */}
      {connectingCall ? (
        <div
          style={{
            marginBottom: 16,
            padding: "20px 22px",
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))",
            border: "1.5px solid rgba(59,130,246,0.35)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            textAlign: "center" as const,
          }}
        >
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#93c5fd", margin: "0 auto 10px" }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Connecting...</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Preparing the video room link.</p>
        </div>
      ) : null}

      {/* ── Call Controls (Doctor / Ward selectors) ── */}
      <div className="grid gap-4">
        {/* Doctor Card */}
        <section className="glass-card relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/15 text-[11px] font-black text-cyan-300">MD</span>
              <div>
                <h3 className="text-sm font-black text-foreground">Doctor</h3>
                <p className="text-[10px] text-muted-foreground">Start a live consultation from the ICU desk</p>
              </div>
            </div>
            <div className="grid gap-2 mb-3">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => setSelectedDoctorId(doctor.id)}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                    selectedDoctorId === doctor.id
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.12)]"
                      : "border-white/8 bg-white/[0.03] text-foreground/80 hover:border-white/15 hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{doctor.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                    selectedDoctorId === doctor.id
                      ? "bg-cyan-400/20 text-cyan-300"
                      : "bg-white/5 text-muted-foreground"
                  }`}>
                    {selectedDoctorId === doctor.id ? "Selected" : "Doctor"}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handlePlaceCall("doctor", selectedDoctorId)}
              disabled={socketStatus === "connecting"}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold shadow-[0_8px_24px_rgba(34,211,238,0.25)] hover:shadow-[0_12px_32px_rgba(34,211,238,0.35)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Call Doctor
            </button>
            {activeDoctorCallId ? (
              <p className="mt-2 text-[10px] font-semibold text-cyan-200">
                Realtime vitals are being shared with {selectedDoctorName}.
              </p>
            ) : null}
            <p className="mt-2 text-[10px] text-muted-foreground">Current: {selectedDoctorName}</p>

            {/* Video inside Doctor card */}
            {roomDetails?.joinUrl && roomTargetRole === "doctor" ? (
              <div ref={doctorVideoRef} className="mt-4">
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/30">
                  <iframe
                    key={`${roomDetails.joinUrl}-${roomFrameKey}`}
                    className="w-full border-none"
                    style={{ minHeight: 280 }}
                    title="Doctor Video Call"
                    src={roomDetails.joinUrl}
                    allow="camera; microphone; fullscreen"
                    allowFullScreen
                  />
                </div>
                <button
                  type="button"
                  onClick={handleEndSession}
                  className="mt-2.5 w-full py-2 rounded-xl border border-red-400/25 bg-red-500/10 text-red-300 text-sm font-bold hover:bg-red-500/20 transition-colors"
                >
                  End Session
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* Ward Card */}
        <section className="glass-card relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-orange-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/15 text-[9px] font-black text-amber-300">WARD</span>
              <div>
                <h3 className="text-sm font-black text-foreground">Ward</h3>
                <p className="text-[10px] text-muted-foreground">Connect with the nursing team</p>
              </div>
            </div>
            <div className="grid gap-2 mb-3">
              {wardTargets.map((ward) => (
                <button
                  key={ward.id}
                  type="button"
                  onClick={() => setSelectedWardId(ward.id)}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                    selectedWardId === ward.id
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.12)]"
                      : "border-white/8 bg-white/[0.03] text-foreground/80 hover:border-white/15 hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{ward.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                    selectedWardId === ward.id
                      ? "bg-amber-400/20 text-amber-300"
                      : "bg-white/5 text-muted-foreground"
                  }`}>
                    {selectedWardId === ward.id ? "Selected" : "Ward"}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handlePlaceCall("ward", selectedWardId)}
              disabled={socketStatus === "connecting"}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-[0_8px_24px_rgba(251,191,36,0.25)] hover:shadow-[0_12px_32px_rgba(251,191,36,0.35)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Call Ward
            </button>
            <p className="mt-2 text-[10px] text-muted-foreground">Current: {selectedWardName}</p>

            {/* Video inside Ward card */}
            {roomDetails?.joinUrl && roomTargetRole === "ward" ? (
              <div ref={wardVideoRef} className="mt-4">
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/30">
                  <iframe
                    key={`${roomDetails.joinUrl}-${roomFrameKey}`}
                    className="w-full border-none"
                    style={{ minHeight: 280 }}
                    title="Ward Video Call"
                    src={roomDetails.joinUrl}
                    allow="camera; microphone; fullscreen"
                    allowFullScreen
                  />
                </div>
                <button
                  type="button"
                  onClick={handleEndSession}
                  className="mt-2.5 w-full py-2 rounded-xl border border-red-400/25 bg-red-500/10 text-red-300 text-sm font-bold hover:bg-red-500/20 transition-colors"
                >
                  End Session
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Status chips */}
      {toast ? (
        <div className="mt-3 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200">
          {toast}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">Ward: {currentName}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Socket: {socketStatus}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Event: {lastEvent}</span>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes icu-incoming-pulse {
          0%, 100% { box-shadow: 0 0 28px rgba(16,185,129,0.18), 0 12px 40px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 42px rgba(16,185,129,0.30), 0 16px 48px rgba(0,0,0,0.35); }
        }
        @keyframes icu-dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}