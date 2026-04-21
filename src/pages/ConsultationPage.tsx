import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, Heart, Droplets, Activity, Brain, User, MessageSquare } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

export default function ConsultationPage() {
  const navigate = useNavigate()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [callTime, setCallTime] = useState(0)
  const [isConnecting, setIsConnecting] = useState(true)
  const [showChat, setShowChat] = useState(false)

  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(() => setIsConnecting(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Call timer
  useEffect(() => {
    if (isConnecting) return
    const interval = setInterval(() => setCallTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isConnecting])

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0')
    const secs = (s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const endCall = () => navigate("/end")

  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="w-full px-6 py-3 flex items-center justify-between relative z-30 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              Video Consultation
            </h1>
            <p className="text-xs text-muted-foreground">Step 4 of 5</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isConnecting && (
            <span className="text-sm text-emerald-400 font-mono flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {formatTime(callTime)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-gradient-to-r from-primary via-emerald-400 to-blue-400 transition-all duration-500" style={{ width: '80%' }} />
      </div>

      {/* Video Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Main Video (Doctor) */}
        <div className="flex-1 relative bg-gradient-to-br from-card to-background min-h-[300px] overflow-hidden">
          {isConnecting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-fade-in z-10">
              <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">Connecting to Doctor...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait while we connect your call</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/50 animate-fade-in">
              <img src="/doctor_profile.png" alt="Doctor Feed" className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Doctor Details overlay */}
              <div className="absolute bottom-6 left-6 glass-card p-3 rounded-xl flex items-center gap-3 animate-fade-in-up">
                <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0">
                   <img src="/doctor_profile.png" alt="Dr. Sharma" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">Dr. Sharma</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Live</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patient self-preview */}
          {!isConnecting && (
            <div className="absolute top-6 right-6 w-28 h-40 md:w-36 md:h-48 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl z-20 bg-black">
              {isVideoOn ? (
                <img src="/patient_camera.png" alt="Patient Feed" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-card">
                  <VideoOff className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 text-[10px] text-foreground font-semibold bg-black/60 px-2 py-1 rounded">You</div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className={`lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-background/50 backdrop-blur-sm ${showChat ? 'block' : 'hidden lg:block'}`}>
          <div className="p-4 space-y-4 overflow-y-auto h-full no-scrollbar">
            {/* Patient Vitals */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Live Vitals
              </h3>
              <div className="space-y-3">
                {[
                  { label: "SpO2", value: "97%", icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />, status: "normal" },
                  { label: "Heart Rate", value: "78 BPM", icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, status: "normal" },
                  { label: "BP", value: "122/82", icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />, status: "normal" },
                ].map((v, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {v.icon}
                      <span className="text-xs text-muted-foreground">{v.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{v.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-primary" />
                AI Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    Medium Risk
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Headache (moderate, 2 days), Dizziness (mild, 1 day), Weakness (mild, 2 days). Vitals stable. Recommend evaluation for underlying cause.
                </p>
              </div>
            </div>

            {/* Symptoms */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                Symptoms
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Headache", "Dizziness", "Weakness"].map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-foreground/70">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Controls */}
      {!isConnecting && (
        <div className="px-4 py-5 border-t border-border/50 bg-background/80 backdrop-blur-sm relative z-30">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted ? "bg-danger/20 text-danger border border-danger/30" : "bg-white/5 text-foreground/70 border border-white/10 hover:bg-white/10"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                !isVideoOn ? "bg-danger/20 text-danger border border-danger/30" : "bg-white/5 text-foreground/70 border border-white/10 hover:bg-white/10"
              }`}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 text-foreground/70 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all lg:hidden"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={endCall}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-danger flex items-center justify-center text-white hover:bg-danger/90 shadow-lg shadow-danger/30 transition-all hover:scale-105 active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
