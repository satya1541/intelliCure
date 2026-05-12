import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  PhoneCall,
  PhoneOff,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Video,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CubeLoader } from "@/components/CubeLoader"
import { consultationSocket } from "@/lib/consultationSocket"

type Role = "doctor" | "ward"
type SocketState = "idle" | "connecting" | "connected" | "error"
type Tone = "neutral" | "success" | "warning" | "error"

type Identity = {
  id: string
  label: string
  note: string
}

type CallPacket = {
  fromRole: Role
  fromId: string
  toRole: Role
  toId: string
}

type RoomPacket = Partial<CallPacket> & {
  meetingId?: string
  roomUrl?: string
  hostRoomUrl?: string
  wardId?: string
  doctorId?: string
}

type LogEntry = {
  id: number
  title: string
  detail: string
  tone: Tone
  time: string
}

type ActiveRoom = RoomPacket & {
  joinUrl: string
}

type RoleMeta = {
  label: string
  description: string
  icon: LucideIcon
  accent: string
  identities: Identity[]
}

const ROLE_META: Record<Role, RoleMeta> = {
  doctor: {
    label: "Doctor",
    description: "Register a consultant and answer requests from the ward.",
    icon: Stethoscope,
    accent: "text-cyan-300",
    identities: [
      { id: "deepak-kumar-sahoo", label: "Dr. Deepak Kumar Sahoo", note: "Consultant physician" },
      { id: "aditya-ray", label: "Dr. Aditya Ray", note: "Senior clinician" },
    ],
  },
  ward: {
    label: "Ward",
    description: "Simulate a bedside station and initiate urgent consults.",
    icon: Users,
    accent: "text-emerald-300",
    identities: [
      { id: "ward-1", label: "Ward 1", note: "General nursing station" },
      { id: "ward-2", label: "Ward 2", note: "Critical care unit" },
    ],
  },
}

const ROLE_ORDER: Role[] = ["doctor", "ward"]
const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-white/5 text-muted-foreground border border-white/10",
  success: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25",
  warning: "bg-amber-400/10 text-amber-300 border border-amber-400/25",
  error: "bg-rose-400/10 text-rose-300 border border-rose-400/25",
}

function getOtherRole(role: Role): Role {
  return role === "doctor" ? "ward" : "doctor"
}

function getIdentityLabel(role: Role, id: string) {
  return ROLE_META[role].identities.find((identity) => identity.id === id)?.label ?? id
}

function statusTone(state: SocketState): Tone {
  if (state === "connected") return "success"
  if (state === "connecting") return "warning"
  if (state === "error") return "error"
  return "neutral"
}

export default function ConsultationHub() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<Role>("doctor")
  const [selectedIdentityId, setSelectedIdentityId] = useState(ROLE_META.doctor.identities[0].id)
  const [selectedTargetId, setSelectedTargetId] = useState(ROLE_META.ward.identities[0].id)
  const [socketState, setSocketState] = useState<SocketState>("idle")
  const [statusMessage, setStatusMessage] = useState("Choose a role and connect to the backend.")
  const [connectedIdentity, setConnectedIdentity] = useState<{ role: Role; id: string } | null>(null)
  const [incomingCall, setIncomingCall] = useState<CallPacket | null>(null)
  const [outgoingCall, setOutgoingCall] = useState<CallPacket | null>(null)
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null)
  const [roomFrameVersion, setRoomFrameVersion] = useState(0)
  const [timeline, setTimeline] = useState<LogEntry[]>([
    {
      id: 1,
      title: "Ready",
      detail: "Select a role, open a second tab with the opposite side, and connect both sockets.",
      tone: "neutral",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  const selectionRef = useRef({ role: selectedRole, id: selectedIdentityId })

  const counterpartRole = getOtherRole(selectedRole)
  const roleMeta = ROLE_META[selectedRole]
  const counterpartMeta = ROLE_META[counterpartRole]
  const selectedIdentity = roleMeta.identities.find((identity) => identity.id === selectedIdentityId) ?? roleMeta.identities[0]
  const selectedTarget = counterpartMeta.identities.find((identity) => identity.id === selectedTargetId) ?? counterpartMeta.identities[0]
  const isSelectionLocked = socketState === "connecting" || socketState === "connected"
  const canRequestCall = socketState === "connected" && !activeRoom && !incomingCall && !outgoingCall

  const appendLog = useCallback((title: string, detail: string, tone: Tone = "neutral") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    setTimeline((current) => [{ id: Date.now() + Math.random(), title, detail, tone, time }, ...current].slice(0, 8))
  }, [])

  useEffect(() => {
    selectionRef.current = { role: selectedRole, id: selectedIdentityId }
  }, [selectedIdentityId, selectedRole])

  useEffect(() => {
    if (socketState === "connecting" || socketState === "connected") {
      return
    }

    setSelectedIdentityId(ROLE_META[selectedRole].identities[0].id)
    setSelectedTargetId(ROLE_META[getOtherRole(selectedRole)].identities[0].id)
    setIncomingCall(null)
    setOutgoingCall(null)
    setActiveRoom(null)
    setRoomFrameVersion(0)
  }, [selectedRole, socketState])

  useEffect(() => {
    const handleConnect = () => {
      const identity = selectionRef.current
      setSocketState("connected")
      setConnectedIdentity(identity)
      setStatusMessage(`Connected as ${getIdentityLabel(identity.role, identity.id)}.`)
      consultationSocket.emit("register", identity)
      appendLog("Socket connected", `${getIdentityLabel(identity.role, identity.id)} is registered with the backend.`, "success")
    }

    const handleDisconnect = (reason: string) => {
      setSocketState("idle")
      setConnectedIdentity(null)
      setIncomingCall(null)
      setOutgoingCall(null)
      setActiveRoom(null)
      setRoomFrameVersion(0)
      setStatusMessage(reason === "io client disconnect" ? "Disconnected from the backend." : `Socket disconnected: ${reason}`)
      appendLog("Socket disconnected", reason || "Manual disconnect", "warning")
    }

    const handleConnectError = (error: Error) => {
      setSocketState("error")
      setStatusMessage("Unable to reach the backend. Check the dev server or proxy and retry.")
      appendLog("Connection error", error?.message || "Socket connection failed.", "error")
    }

    const handleCallError = (payload: { message?: string }) => {
      const message = payload?.message || "Call failed."
      setOutgoingCall(null)
      setIncomingCall(null)
      setActiveRoom(null)
      setStatusMessage(message)
      appendLog("Call error", message, "error")
    }

    const handleIncoming = (payload: CallPacket) => {
      const current = selectionRef.current
      if (payload.toRole !== current.role || payload.toId !== current.id) {
        return
      }

      setIncomingCall(payload)
      setStatusMessage(`Incoming call from ${getIdentityLabel(payload.fromRole, payload.fromId)}.`)
      appendLog("Incoming call", `${getIdentityLabel(payload.fromRole, payload.fromId)} is requesting a room.`, "warning")
    }

    const handleAccepted = (payload: CallPacket) => {
      setStatusMessage(`Call accepted by ${getIdentityLabel(payload.fromRole, payload.fromId)}.`)
      appendLog("Call accepted", `${getIdentityLabel(payload.fromRole, payload.fromId)} accepted the request.`, "success")
    }

    const handleRejected = (payload: CallPacket) => {
      setOutgoingCall(null)
      setIncomingCall(null)
      setStatusMessage(`Call rejected by ${getIdentityLabel(payload.fromRole, payload.fromId)}.`)
      appendLog("Call rejected", `${getIdentityLabel(payload.fromRole, payload.fromId)} rejected the request.`, "warning")
    }

    const handleCancelled = (payload: CallPacket) => {
      setOutgoingCall(null)
      setIncomingCall(null)
      setStatusMessage(`Call cancelled by ${getIdentityLabel(payload.fromRole, payload.fromId)}.`)
      appendLog("Call cancelled", `${getIdentityLabel(payload.fromRole, payload.fromId)} cancelled the request.`, "warning")
    }

    const handleRoom = (payload: RoomPacket) => {
      const current = selectionRef.current
      const belongsToCurrentIdentity = current.role === "doctor" ? payload.doctorId === current.id : payload.wardId === current.id

      if (!belongsToCurrentIdentity || !payload.roomUrl) {
        return
      }

      setIncomingCall(null)
      setOutgoingCall(null)
      setActiveRoom({ ...payload, joinUrl: payload.roomUrl })
      setRoomFrameVersion(0)
      setStatusMessage(`Room ready for ${getIdentityLabel(current.role, current.id)}.`)
      appendLog("Room ready", `Meeting ${payload.meetingId || "pending"} has been created.`, "success")
    }

    consultationSocket.on("connect", handleConnect)
    consultationSocket.on("disconnect", handleDisconnect)
    consultationSocket.on("connect_error", handleConnectError)
    consultationSocket.on("call:error", handleCallError)
    consultationSocket.on("call:incoming", handleIncoming)
    consultationSocket.on("call:accepted", handleAccepted)
    consultationSocket.on("call:rejected", handleRejected)
    consultationSocket.on("call:cancelled", handleCancelled)
    consultationSocket.on("call:room", handleRoom)

    return () => {
      consultationSocket.off("connect", handleConnect)
      consultationSocket.off("disconnect", handleDisconnect)
      consultationSocket.off("connect_error", handleConnectError)
      consultationSocket.off("call:error", handleCallError)
      consultationSocket.off("call:incoming", handleIncoming)
      consultationSocket.off("call:accepted", handleAccepted)
      consultationSocket.off("call:rejected", handleRejected)
      consultationSocket.off("call:cancelled", handleCancelled)
      consultationSocket.off("call:room", handleRoom)
      if (consultationSocket.connected) {
        consultationSocket.disconnect()
      }
    }
  }, [appendLog])

  const handleConnect = () => {
    if (socketState === "connecting" || consultationSocket.connected) {
      return
    }

    setSocketState("connecting")
    setStatusMessage("Opening the Socket.IO channel...")
    consultationSocket.connect()
  }

  const handleDisconnect = () => {
    if (!consultationSocket.connected) {
      setSocketState("idle")
      setStatusMessage("Disconnected from the backend.")
      return
    }

    consultationSocket.disconnect()
  }

  const handleRequestCall = (targetRole: Role, targetId: string) => {
    if (!consultationSocket.connected) {
      setStatusMessage("Connect to the backend before requesting a call.")
      return
    }

    const packet: CallPacket = {
      fromRole: selectionRef.current.role,
      fromId: selectionRef.current.id,
      toRole: targetRole,
      toId: targetId,
    }

    setOutgoingCall(packet)
    consultationSocket.emit("call:request", packet)
    setStatusMessage(`Request sent to ${getIdentityLabel(targetRole, targetId)}.`)
    appendLog("Call requested", `${getIdentityLabel(selectionRef.current.role, selectionRef.current.id)} -> ${getIdentityLabel(targetRole, targetId)}.`, "neutral")
  }

  const handleAcceptIncoming = () => {
    if (!incomingCall) {
      return
    }

    const packet: CallPacket = {
      fromRole: selectionRef.current.role,
      fromId: selectionRef.current.id,
      toRole: incomingCall.fromRole,
      toId: incomingCall.fromId,
    }

    consultationSocket.emit("call:accept", packet)
    setStatusMessage(`Accepted ${getIdentityLabel(incomingCall.fromRole, incomingCall.fromId)}.`)
    appendLog("Call accepted", `Accepted ${getIdentityLabel(incomingCall.fromRole, incomingCall.fromId)}.`, "success")
  }

  const handleRejectIncoming = () => {
    if (!incomingCall) {
      return
    }

    const packet: CallPacket = {
      fromRole: selectionRef.current.role,
      fromId: selectionRef.current.id,
      toRole: incomingCall.fromRole,
      toId: incomingCall.fromId,
    }

    consultationSocket.emit("call:reject", packet)
    setIncomingCall(null)
    setStatusMessage(`Rejected ${getIdentityLabel(incomingCall.fromRole, incomingCall.fromId)}.`)
    appendLog("Call rejected", `Rejected ${getIdentityLabel(incomingCall.fromRole, incomingCall.fromId)}.`, "warning")
  }

  const handleCancelOutgoing = () => {
    if (!outgoingCall) {
      return
    }

    consultationSocket.emit("call:cancel", outgoingCall)
    setOutgoingCall(null)
    setStatusMessage(`Cancelled the request to ${getIdentityLabel(outgoingCall.toRole, outgoingCall.toId)}.`)
    appendLog("Call cancelled", `Cancelled the request to ${getIdentityLabel(outgoingCall.toRole, outgoingCall.toId)}.`, "warning")
  }

  const handleCopy = async (value?: string, label = "room link") => {
    if (!value || !navigator.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      appendLog("Link copied", `Copied the ${label} to the clipboard.`, "success")
    } catch {
      appendLog("Copy failed", `Could not copy the ${label}.`, "error")
    }
  }

  const handleOpenRoom = () => {
    if (!activeRoom?.joinUrl) {
      return
    }

    window.open(activeRoom.joinUrl, "_blank", "noopener,noreferrer")
  }

  const handleEndSession = () => {
    appendLog("Session ended", "The consultation has been closed.", "warning")
    consultationSocket.disconnect()
    navigate("/end")
  }

  const handleRefreshRoom = () => {
    setRoomFrameVersion((version) => version + 1)
    appendLog("Room refreshed", "Reloaded the embedded video room.", "neutral")
  }

  const connectionLabel = socketState === "connected" ? "Online" : socketState === "connecting" ? "Connecting" : socketState === "error" ? "Error" : "Offline"
  const connectionIcon = socketState === "connected" ? Wifi : WifiOff
  const ConnectionIcon = connectionIcon
  const activeRoleIcon = roleMeta.icon
  const CounterpartIcon = counterpartMeta.icon

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-[-12%] left-[-10%] w-[520px] h-[520px] bg-primary/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-18%] right-[-8%] w-[440px] h-[440px] bg-emerald-500/8 rounded-full blur-[170px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border/50 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary/75 mb-1">Step 4 · Consultation</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Secure call control room</h1>
              <p className="text-sm text-muted-foreground max-w-2xl mt-1">
                Register as doctor or ward, exchange call events through the backend, and join the Whereby room returned by the server.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusChip label={connectionLabel} tone={statusTone(socketState)} icon={ConnectionIcon} />
            <StatusChip label={roleMeta.label} tone="neutral" icon={activeRoleIcon} />
            <StatusChip label={counterpartMeta.label} tone="neutral" icon={CounterpartIcon} />
          </div>
        </header>

        <div className="grid gap-3 mt-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Socket" value={connectionLabel} icon={ConnectionIcon} tone={statusTone(socketState)} />
          <MetricCard label="Identity" value={connectedIdentity ? getIdentityLabel(connectedIdentity.role, connectedIdentity.id) : selectedIdentity.label} icon={ShieldCheck} tone="neutral" />
          <MetricCard label="Counterpart" value={selectedTarget.label} icon={Users} tone="neutral" />
          <MetricCard label="Room" value={activeRoom ? "Live" : "Waiting"} icon={Video} tone={activeRoom ? "success" : "warning"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] mt-6">
          <div className="space-y-6">
            <section className="glass-card p-5 md:p-6">
              <SectionHeader
                eyebrow="Connection"
                title="Pick the identity you want to register"
                description="Selections lock after you connect because the backend stores each socket under a role and id pair."
                icon={Sparkles}
              />

              <div className="grid gap-3 sm:grid-cols-2 mt-5">
                {ROLE_ORDER.map((role) => {
                  const meta = ROLE_META[role]
                  const Icon = meta.icon
                  const isActive = selectedRole === role

                  return (
                    <button
                      key={role}
                      type="button"
                      disabled={isSelectionLocked}
                      onClick={() => setSelectedRole(role)}
                      className={`text-left rounded-2xl border p-4 transition-all ${isActive ? "border-primary/35 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10"} ${isSelectionLocked ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${isActive ? "bg-primary/15 border-primary/25" : "bg-white/5 border-white/10"}`}>
                          <Icon className={`w-5 h-5 ${meta.accent}`} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-[0.3em] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {isActive ? "Selected" : "Choose"}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-foreground">{meta.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mt-5">
                {roleMeta.identities.map((identity) => {
                  const isActive = selectedIdentityId === identity.id

                  return (
                    <button
                      key={identity.id}
                      type="button"
                      disabled={isSelectionLocked}
                      onClick={() => setSelectedIdentityId(identity.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${isActive ? "border-primary/35 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10"} ${isSelectionLocked ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{identity.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{identity.note}</p>
                        </div>
                        {isActive ? <CheckCircle2 className="w-5 h-5 text-primary" /> : null}
                      </div>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{selectedRole}</p>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Button variant="hero" size="lg" onClick={handleConnect} disabled={socketState === "connecting" || socketState === "connected"} className="rounded-2xl">
                  {socketState === "connecting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {socketState === "connected" ? "Connected" : socketState === "connecting" ? "Connecting" : socketState === "error" ? "Retry connection" : "Connect to backend"}
                </Button>
                <Button variant="outline" size="lg" onClick={handleDisconnect} disabled={socketState === "idle"} className="rounded-2xl">
                  <WifiOff className="w-4 h-4" />
                  Disconnect
                </Button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Keep the role and id fixed while connected. If you want to switch sides, disconnect first and then choose a new identity.
              </p>
            </section>

            <section className="glass-card p-5 md:p-6">
              <SectionHeader
                eyebrow="Routing"
                title={`Target ${counterpartMeta.label.toLowerCase()} contact`}
                description={`Select a ${counterpartMeta.label.toLowerCase()} identity, then send a call request through the backend.`}
                icon={PhoneCall}
              />

              <div className="grid gap-3 sm:grid-cols-2 mt-5">
                {counterpartMeta.identities.map((identity) => {
                  const isActive = selectedTargetId === identity.id

                  return (
                    <button
                      key={identity.id}
                      type="button"
                      onClick={() => setSelectedTargetId(identity.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${isActive ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{identity.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{identity.note}</p>
                        </div>
                        {isActive ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Button variant="hero" size="lg" onClick={() => handleRequestCall(counterpartRole, selectedTargetId)} disabled={!canRequestCall} className="rounded-2xl">
                  <PhoneCall className="w-4 h-4" />
                  Request call
                </Button>
                <Button variant="outline" size="lg" onClick={() => setSelectedTargetId(counterpartMeta.identities[0].id)} className="rounded-2xl">
                  <RefreshCcw className="w-4 h-4" />
                  Reset target
                </Button>
              </div>
            </section>

            <section className="glass-card p-5 md:p-6">
              <SectionHeader
                eyebrow="Live call"
                title="Incoming and outgoing call state"
                description="Use the acceptance buttons when a counterpart reaches out, or cancel a request before the room is created."
                icon={ShieldCheck}
              />

              {incomingCall ? (
                <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200/70">Incoming request</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">{getIdentityLabel(incomingCall.fromRole, incomingCall.fromId)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Wants to connect with {getIdentityLabel(incomingCall.toRole, incomingCall.toId)}.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="success" size="lg" onClick={handleAcceptIncoming} className="rounded-2xl">
                        <CheckCircle2 className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button variant="danger" size="lg" onClick={handleRejectIncoming} className="rounded-2xl">
                        <PhoneOff className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ) : outgoingCall ? (
                <div className="mt-5 rounded-3xl border border-primary/20 bg-primary/10 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Outgoing request</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">Waiting for {getIdentityLabel(outgoingCall.toRole, outgoingCall.toId)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Request sent from {getIdentityLabel(outgoingCall.fromRole, outgoingCall.fromId)}. The room will appear once the other side accepts.
                      </p>
                    </div>
                    <Button variant="outline" size="lg" onClick={handleCancelOutgoing} className="rounded-2xl">
                      <PhoneOff className="w-4 h-4" />
                      Cancel request
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No active call</p>
                    <p className="text-sm text-muted-foreground mt-1">Request a call from the left panel or wait for the opposite side to reach you.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass-card p-5 md:p-6">
              <SectionHeader
                eyebrow="Room"
                title="Whereby session viewer"
                description="The backend returns a room URL once a doctor and ward pair accepts. The room is embedded below and can also be opened in a new tab."
                icon={Video}
              />

              {activeRoom ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip label="Room live" tone="success" icon={Video} />
                      <StatusChip label={activeRoom.meetingId ? `Meeting ${activeRoom.meetingId}` : "Meeting pending"} tone="neutral" icon={Activity} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Doctor</p>
                        <p className="text-foreground">{activeRoom.doctorId ? getIdentityLabel("doctor", activeRoom.doctorId) : "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Ward</p>
                        <p className="text-foreground">{activeRoom.wardId ? getIdentityLabel("ward", activeRoom.wardId) : "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(activeRoom.roomUrl, "guest link")} className="rounded-2xl">
                        <Copy className="w-4 h-4" />
                        Copy guest link
                      </Button>
                      {activeRoom.hostRoomUrl ? (
                        <Button variant="outline" size="sm" onClick={() => handleCopy(activeRoom.hostRoomUrl, "host link")} className="rounded-2xl">
                          <Copy className="w-4 h-4" />
                          Copy host link
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" onClick={handleOpenRoom} className="rounded-2xl">
                        <ExternalLink className="w-4 h-4" />
                        Open in new tab
                      </Button>
                      <Button variant="danger" size="sm" onClick={handleEndSession} className="rounded-2xl">
                        <PhoneOff className="w-4 h-4" />
                        End session
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/70 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
                    <iframe
                      key={`${activeRoom.joinUrl}-${roomFrameVersion}`}
                      src={activeRoom.joinUrl}
                      title="Whereby consultation room"
                      className="h-[470px] w-full"
                      allow="camera; microphone; fullscreen; autoplay"
                      allowFullScreen
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 break-all">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Guest link</p>
                      <p>{activeRoom.roomUrl || "Unavailable"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 break-all">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Host link</p>
                      <p>{activeRoom.hostRoomUrl || "Unavailable"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3">
                    <p className="text-sm text-muted-foreground">If the embedded frame blocks camera access, use the open-in-new-tab fallback above.</p>
                    <Button variant="outline" size="sm" onClick={handleRefreshRoom} className="rounded-2xl shrink-0">
                      <RefreshCcw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 min-h-[470px] flex flex-col items-center justify-center text-center px-6">
                  {socketState === "connecting" ? (
                    <>
                      <div className="w-20 h-20 rounded-[1.75rem] border border-primary/20 bg-primary/10 flex items-center justify-center shadow-[0_0_28px_rgba(124,58,237,0.18)]">
                        <CubeLoader size={54} />
                      </div>
                      <p className="mt-6 text-2xl font-black text-foreground">Connecting to the backend...</p>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md">The consultation room will appear here after a doctor and ward pair accept the call.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-[1.75rem] border border-white/10 bg-white/5 flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="mt-6 text-2xl font-black text-foreground">Waiting for room creation</p>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md">The backend will return a Whereby link after the opposite side accepts your request.</p>
                    </>
                  )}
                </div>
              )}
            </section>

            <section className="glass-card p-5 md:p-6">
              <SectionHeader
                eyebrow="Activity"
                title="Socket timeline"
                description="Recent events from registration, requests, acceptances, room creation, and disconnects."
                icon={Activity}
              />

              <div className="mt-5 space-y-3">
                {timeline.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${entry.tone === "success" ? "bg-emerald-400" : entry.tone === "warning" ? "bg-amber-300" : entry.tone === "error" ? "bg-rose-400" : "bg-white/35"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{entry.title}</p>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground shrink-0">{entry.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{entry.detail}</p>
                      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.3em] ${TONE_STYLES[entry.tone]}`}>
                        {entry.tone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card p-5 md:p-6">
              <SectionHeader
                eyebrow="Workflow"
                title="How to test the room"
                description="Use this page in two tabs to simulate the backend-driven consultation lifecycle end to end."
                icon={ShieldCheck}
              />

              <div className="mt-5 grid gap-3">
                <WorkflowStep index="01" title="Open two tabs" detail="Choose doctor on one tab and ward on the other." />
                <WorkflowStep index="02" title="Connect both sockets" detail="Press Connect on each tab so the backend can register the role and id." />
                <WorkflowStep index="03" title="Request, accept, and join" detail="Send a call request, accept it from the other side, then join the embedded Whereby room." />
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/50 bg-background/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
          {statusMessage}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-1">{eyebrow}</p>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
      </div>
    </div>
  )
}

function StatusChip({
  label,
  tone,
  icon: Icon,
}: {
  label: string
  tone: Tone
  icon: LucideIcon
}) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${TONE_STYLES[tone]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: Tone
}) {
  const ringClass =
    tone === "success"
      ? "bg-emerald-400/10 border-emerald-400/20"
      : tone === "warning"
        ? "bg-amber-400/10 border-amber-400/20"
        : tone === "error"
          ? "bg-rose-400/10 border-rose-400/20"
          : "bg-white/5 border-white/10"

  return (
    <div className="glass-card p-4 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-1">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${ringClass}`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  )
}

function WorkflowStep({
  index,
  title,
  detail,
}: {
  index: string
  title: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0 text-sm font-black text-primary">
          {index}
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{detail}</p>
        </div>
      </div>
    </div>
  )
}
