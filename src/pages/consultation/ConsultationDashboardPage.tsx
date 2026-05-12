import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { connectSocket } from "@/lib/consultationSocket"
import { formatVitalsTimestamp, type IcuPatientContext, type LiveVitalsSnapshot } from "../liveVitals"
import type { ConsultationRole } from "./shared"
import {
  doctorById,
  defaultDoctorId,
  defaultWardId,
  getCurrentLabel,
  getDefaultPeerId,
  getIncomingDescription,
  getIncomingLabel,
  getPeerLabel,
  getPeerOptions,
  getPeerPanelDescription,
  getPeerPanelTitle,
  getRoleEyebrow,
  getRoleSubtitle,
  getRoleThemeClass,
  getRoleTitle,
  wardById,
} from "./shared"

type ConsultationDashboardPageProps = {
  role: ConsultationRole
}

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
  vitals?: LiveVitalsSnapshot | null
  patient?: IcuPatientContext | null
  updatedAt?: number | null
  source?: string | null
}

type LiveVitalsPacket = {
  wardId?: string
  doctorId?: string
  vitals?: LiveVitalsSnapshot | null
  patient?: IcuPatientContext | null
  updatedAt?: number | null
  source?: string | null
}

const ringtoneFile = "vc audio.mpeg"
const ringtoneUrl = `/audio/${encodeURIComponent(ringtoneFile)}`

export default function ConsultationDashboardPage({ role }: ConsultationDashboardPageProps) {
  const navigate = useNavigate()
  const params = useParams()
  const currentIdParam = role === "doctor" ? params.doctorId : params.wardId
  const currentId = role === "doctor"
    ? (currentIdParam && doctorById[currentIdParam] ? currentIdParam : defaultDoctorId)
    : (currentIdParam && wardById[currentIdParam] ? currentIdParam : defaultWardId)

  const [activePeerId, setActivePeerId] = useState(() => getDefaultPeerId(role))
  const [incomingCall, setIncomingCall] = useState<CallPacket | null>(null)
  const [outgoingCall, setOutgoingCall] = useState<CallPacket | null>(null)
  const [connectingCall, setConnectingCall] = useState(false)
  const [roomDetails, setRoomDetails] = useState<(RoomPacket & { joinUrl: string }) | null>(null)
  const [roomVitals, setRoomVitals] = useState<LiveVitalsSnapshot | null>(null)
  const [roomPatient, setRoomPatient] = useState<IcuPatientContext | null>(null)
  const [roomVitalsUpdatedAt, setRoomVitalsUpdatedAt] = useState<number | null>(null)
  const [toast, setToast] = useState("")
  const [socketStatus, setSocketStatus] = useState("connecting")
  const [lastEvent, setLastEvent] = useState("")
  const [roomFrameKey, setRoomFrameKey] = useState(0)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)

  const peers = getPeerOptions(role)
  const activePeerName = getPeerLabel(role, activePeerId)
  const currentName = getCurrentLabel(role, currentId)
  const oppositeRole = role === "doctor" ? "ward" : "doctor"
  const outgoingName = outgoingCall ? getPeerLabel(role, outgoingCall.toId) : activePeerName
  const patientSummary = roomPatient?.patientName
    ? `${roomPatient.patientName}${roomPatient.patientAge ? ` • ${roomPatient.patientAge} yrs` : ""}`
    : "ICU patient"

  useEffect(() => {
    setActivePeerId(getDefaultPeerId(role))
    setIncomingCall(null)
    setOutgoingCall(null)
    setConnectingCall(false)
    setRoomDetails(null)
    setToast("")
    setRoomFrameKey(0)
  }, [role, currentId])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(""), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

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
      socket.emit("register", { role, id: currentId })
    }

    const handleIncoming = (payload: CallPacket) => {
      if (payload.toRole !== role || payload.toId !== currentId) {
        return
      }

      setIncomingCall(payload)
      setToast(`Incoming call from ${getPeerLabel(role, payload.fromId)}`)
    }

    const handleAccepted = (payload: CallPacket) => {
      setOutgoingCall(null)
      setConnectingCall(true)
      setToast(`Call accepted by ${getPeerLabel(role, payload.fromId)}`)
    }

    const handleRoom = (payload: RoomPacket) => {
      const isCurrentPair =
        role === "doctor"
          ? payload.doctorId === currentId
          : payload.wardId === currentId

      if (!isCurrentPair || !payload.roomUrl) {
        return
      }

      setRoomDetails({ ...payload, joinUrl: payload.roomUrl })
      if (role === "doctor") {
        setRoomVitals(payload.vitals || null)
        setRoomPatient(payload.patient || null)
        setRoomVitalsUpdatedAt(typeof payload.updatedAt === "number" ? payload.updatedAt : null)
      }
      setIncomingCall(null)
      setOutgoingCall(null)
      setConnectingCall(false)
      setRoomFrameKey((value) => value + 1)
      setToast("Room ready. Joining now...")
    }

    const handleVitals = (payload: LiveVitalsPacket) => {
      console.log("RX vitals:", payload, "room details:", roomDetails, "currentId:", currentId, "role:", role)
      if (role !== "doctor") {
        console.log("Reject vitals: not doctor")
        return
      }

      if (payload.doctorId !== currentId) {
        console.log("Reject vitals: doctorId mismatch")
        return
      }

      if (roomDetails?.wardId && payload.wardId && payload.wardId !== roomDetails.wardId) {
        console.log("Reject vitals: wardId mismatch")
        return
      }

      if (!payload.vitals) {
        console.log("Reject vitals: no vitals")
        return
      }

      console.log("Accepting vitals", payload.vitals)
      setRoomVitals(payload.vitals)
      setRoomPatient(payload.patient || null)
      setRoomVitalsUpdatedAt(typeof payload.updatedAt === "number" ? payload.updatedAt : Date.now())
    }

    const handleRejected = (payload: CallPacket) => {
      setOutgoingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      setRoomVitals(null)
      setRoomPatient(null)
      setRoomVitalsUpdatedAt(null)
      setToast(`Call rejected by ${getPeerLabel(role, payload.fromId)}`)
    }

    const handleCancelled = (payload: CallPacket) => {
      setOutgoingCall(null)
      setIncomingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      setRoomVitals(null)
      setRoomPatient(null)
      setRoomVitalsUpdatedAt(null)
      setToast(`Call cancelled by ${getPeerLabel(role, payload.fromId)}`)
    }

    const handleError = (payload: { message?: string }) => {
      setOutgoingCall(null)
      setIncomingCall(null)
      setConnectingCall(false)
      setRoomDetails(null)
      setRoomVitals(null)
      setRoomPatient(null)
      setRoomVitalsUpdatedAt(null)
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
      setRoomVitals(null)
      setRoomPatient(null)
      setRoomVitalsUpdatedAt(null)
    }

    const handleAny = (event: string) => {
      setLastEvent(event)
    }

    socket.on("connect", handleConnect)
    socket.on("call:incoming", handleIncoming)
    socket.on("call:accepted", handleAccepted)
    socket.on("call:room", handleRoom)
    socket.on("icu:vitals:update", handleVitals)
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
      socket.off("icu:vitals:update", handleVitals)
      socket.off("call:rejected", handleRejected)
      socket.off("call:cancelled", handleCancelled)
      socket.off("call:error", handleError)
      socket.off("connect_error", handleConnectError)
      socket.off("disconnect", handleDisconnect)
      socket.offAny(handleAny)
    }
  }, [currentId, role, roomDetails?.wardId])

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

  const handlePlaceCall = () => {
    const socket = connectSocket()
    const packet: CallPacket = {
      fromRole: role,
      fromId: currentId,
      toRole: oppositeRole,
      toId: activePeerId,
    }

    setOutgoingCall(packet)
    setConnectingCall(false)
    setRoomDetails(null)
    socket.emit("call:request", packet)
  }

  const handleCancelCall = () => {
    if (!outgoingCall) {
      return
    }

    const socket = connectSocket()
    socket.emit("call:cancel", outgoingCall)
    setOutgoingCall(null)
  }

  const handleAccept = () => {
    if (!incomingCall) {
      return
    }

    const socket = connectSocket()
    socket.emit("call:accept", {
      fromRole: role,
      fromId: currentId,
      toRole: incomingCall.fromRole,
      toId: incomingCall.fromId,
    })
    setIncomingCall(null)
  }

  const handleReject = () => {
    if (!incomingCall) {
      return
    }

    const socket = connectSocket()
    socket.emit("call:reject", {
      fromRole: role,
      fromId: currentId,
      toRole: incomingCall.fromRole,
      toId: incomingCall.fromId,
    })
    setIncomingCall(null)
  }

  const handleEndSession = () => {
    setRoomDetails(null)
    setConnectingCall(false)
    setOutgoingCall(null)
    setIncomingCall(null)
    setToast("Session ended")
  }

  return (
    <div className={`consultation-root ${getRoleThemeClass(role)}`}>
      <div className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">{getRoleEyebrow(role)}</p>
            <h1>{getRoleTitle(role)}</h1>
            <p className="subtitle">{getRoleSubtitle(role, currentName)}</p>
          </div>
          <div className="header-actions">
            <div className={`socket-chip ${socketStatus === "connected" ? "socket-chip--connected" : socketStatus === "error" ? "socket-chip--error" : socketStatus === "disconnected" ? "socket-chip--disconnected" : ""}`}>
              Socket: {socketStatus}
            </div>
            <button className="btn btn--ghost back-button" type="button" onClick={() => navigate("/consultation")}>
              Back
            </button>
            <div className="pill-row">
              <span className="pill pill--light">{currentName}</span>
            </div>
          </div>
        </header>

        <div className="doctor-layout">
          <aside className="sidebar">
            <h3>{role === "doctor" ? "Available Wards" : "Available Doctors"}</h3>
            <ul className="ward-list">
              {peers.map((peer) => (
                <li key={peer.id}>
                  <button
                    className={`ward-item ${activePeerId === peer.id ? "ward-item--active" : ""}`}
                    type="button"
                    onClick={() => setActivePeerId(peer.id)}
                  >
                    <span className="ward-name">{peer.name}</span>
                    <span className="ward-status">{activePeerId === peer.id ? "Active" : "Ready"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="main-panel">
            <div className="panel-header">
              <h2>{activePeerName}</h2>
              <span className="badge">Priority Access</span>
            </div>

            <div className="call-card">
              <div>
                <h3>{getPeerPanelTitle(role, activePeerName)}</h3>
                <p>{getPeerPanelDescription(role, activePeerName)}</p>
              </div>
              <button className="btn btn--primary" type="button" onClick={handlePlaceCall}>
                Initiate Call
              </button>
            </div>

            <div className="video-area">
              {roomDetails?.joinUrl ? (
                <iframe
                  key={`${roomDetails.joinUrl}-${roomFrameKey}`}
                  className="video-iframe"
                  title="Video Call"
                  src={roomDetails.joinUrl}
                  allow="camera; microphone; fullscreen"
                  allowFullScreen
                />
              ) : (
                <p>Video Stream Placeholder</p>
              )}
            </div>

            {role === "doctor" && roomDetails?.joinUrl ? (
              <section className="live-vitals-card">
                <div className="live-vitals-card__header">
                  <div>
                    <p className="eyebrow">Shared ICU data</p>
                    <h3 className="live-vitals-card__title">Realtime patient vitals</h3>
                    <p className="live-vitals-card__meta">
                      {roomPatient?.bed ? `${patientSummary} • Bed ${roomPatient.bed}` : patientSummary}
                    </p>
                  </div>
                  <span className="badge">Updated {formatVitalsTimestamp(roomVitalsUpdatedAt)}</span>
                </div>

                {roomPatient?.shift || roomPatient?.diagnosis || roomPatient?.ambRegNo ? (
                  <div className="pill-row">
                    {roomPatient?.shift ? <span className="pill">{roomPatient.shift}</span> : null}
                    {roomPatient?.diagnosis ? <span className="pill">{roomPatient.diagnosis}</span> : null}
                    {roomPatient?.ambRegNo ? <span className="pill">MRN {roomPatient.ambRegNo}</span> : null}
                  </div>
                ) : null}

                {roomVitals ? (
                  <div className="live-vitals-grid">
                    <div className="live-vitals-item">
                      <p className="live-vitals-item__label">Oxygen</p>
                      <p className="live-vitals-item__value">{roomVitals.oxygen.toFixed(1)}<span className="live-vitals-item__unit">%</span></p>
                    </div>
                    <div className="live-vitals-item">
                      <p className="live-vitals-item__label">Heart Rate</p>
                      <p className="live-vitals-item__value">{roomVitals.heartRate}<span className="live-vitals-item__unit">bpm</span></p>
                    </div>
                    <div className="live-vitals-item">
                      <p className="live-vitals-item__label">Respiratory Rate</p>
                      <p className="live-vitals-item__value">{roomVitals.respiratoryRate}<span className="live-vitals-item__unit">rpm</span></p>
                    </div>
                    <div className="live-vitals-item">
                      <p className="live-vitals-item__label">Temperature</p>
                      <p className="live-vitals-item__value">{roomVitals.temperature.toFixed(1)}<span className="live-vitals-item__unit">°C</span></p>
                    </div>
                    <div className="live-vitals-item">
                      <p className="live-vitals-item__label">Blood Pressure</p>
                      <p className="live-vitals-item__value">{roomVitals.systolic}/{roomVitals.diastolic}<span className="live-vitals-item__unit">mmHg</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="live-vitals-empty">
                    Waiting for the ICU desk to share realtime vitals for this consult.
                  </div>
                )}
              </section>
            ) : null}

            {roomDetails?.joinUrl ? (
              <div className="button-row">
                <button className="btn btn--ghost" type="button" onClick={handleEndSession}>
                  End Session
                </button>
              </div>
            ) : null}
          </main>

          <aside className="sidebar incoming-panel">
            <h3>Incoming Call</h3>
            {incomingCall ? (
              <section className="incoming-card incoming-card--live">
                <div>
                  <h4>{getIncomingLabel(role)}</h4>
                  <p>{getPeerLabel(role, incomingCall.fromId)} is requesting a call.</p>
                </div>
                <div className="button-row">
                  <button className="btn btn--accept" type="button" onClick={handleAccept}>
                    Accept
                  </button>
                  <button className="btn btn--reject" type="button" onClick={handleReject}>
                    Reject
                  </button>
                </div>
              </section>
            ) : (
              <div className="incoming-empty">
                <p>No incoming calls right now.</p>
              </div>
            )}
          </aside>
        </div>

        {outgoingCall ? (
          <div className="calling-overlay">
            <div className="calling-modal">
              <p className="eyebrow">Connecting</p>
              <h2>Calling {outgoingName}...</h2>
              <p>Awaiting response from the other side.</p>
              <button className="btn btn--ghost" type="button" onClick={handleCancelCall}>
                End Call
              </button>
            </div>
          </div>
        ) : null}

        {connectingCall ? (
          <div className="calling-overlay">
            <div className="calling-modal">
              <p className="eyebrow">Connecting</p>
              <h2>Connecting...</h2>
              <p>Preparing the video room link.</p>
              <div className="calling-loader">
                <Loader2 className="w-10 h-10 animate-spin" aria-hidden="true" />
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className="toast">{toast}</div> : null}

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="status-chip">Last event: {lastEvent || "Waiting"}</div>
        </div>
      </div>
    </div>
  )
}