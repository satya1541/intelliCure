import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Heart, Droplets, Activity, Bluetooth } from "lucide-react"
import { Link } from "react-router-dom"
import { CubeLoader } from "@/components/CubeLoader"

interface VitalReading {
  label: string
  value: string
  unit: string
  status: "normal" | "alert" | "warning"
  icon: React.ReactNode
  color: string
  bgColor: string
  target: string
}

export default function VitalsPage() {
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [vitals, setVitals] = useState<VitalReading[]>([
    { label: "Blood Oxygen (SpO2)", value: "--", unit: "%", status: "normal", icon: <Droplets className="w-6 h-6" />, color: "text-cyan-400", bgColor: "bg-cyan-400/10", target: "95-100%" },
    { label: "Heart Rate (HR)", value: "--", unit: "BPM", status: "normal", icon: <Heart className="w-6 h-6" />, color: "text-rose-400", bgColor: "bg-rose-400/10", target: "60-100 BPM" },
    { label: "Blood Pressure (BP)", value: "--", unit: "mmHg", status: "normal", icon: <Activity className="w-6 h-6" />, color: "text-emerald-400", bgColor: "bg-emerald-400/10", target: "120/80" },
  ])

  // Simulate device connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  // Simulate vital readings coming in
  useEffect(() => {
    if (!isConnected) return

    const updateVitals = () => {
      setVitals([
        {
          label: "Blood Oxygen (SpO2)",
          value: String(95 + Math.floor(Math.random() * 4)),
          unit: "%",
          status: "normal",
          icon: <Droplets className="w-6 h-6" />,
          color: "text-cyan-400",
          bgColor: "bg-cyan-400/10",
          target: "95-100%",
        },
        {
          label: "Heart Rate (HR)",
          value: String(68 + Math.floor(Math.random() * 15)),
          unit: "BPM",
          status: Math.random() > 0.7 ? "warning" : "normal",
          icon: <Heart className="w-6 h-6" />,
          color: "text-rose-400",
          bgColor: "bg-rose-400/10",
          target: "60-100 BPM",
        },
        {
          label: "Blood Pressure (BP)",
          value: `${115 + Math.floor(Math.random() * 15)}/${75 + Math.floor(Math.random() * 10)}`,
          unit: "mmHg",
          status: "normal",
          icon: <Activity className="w-6 h-6" />,
          color: "text-emerald-400",
          bgColor: "bg-emerald-400/10",
          target: "120/80",
        },
      ])
    }

    updateVitals()
    const interval = setInterval(updateVitals, 3000)
    return () => clearInterval(interval)
  }, [isConnected])

  const statusLabel = (s: string) => {
    if (s === "normal") return { text: "Normal", cls: "vitals-normal bg-success/10 border-success/30" }
    if (s === "warning") return { text: "Elevated", cls: "vitals-warning bg-warning/10 border-warning/30" }
    return { text: "Alert!", cls: "vitals-alert bg-danger/10 border-danger/30" }
  }

  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between relative z-20 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/symptoms">
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4 text-foreground/70" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Vitals Monitor
            </h1>
            <p className="text-xs text-muted-foreground">Step 2 of 5</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">Sensor Connected</span>
            </>
          ) : (
            <>
              <CubeLoader size={16} />
              <span className="text-xs text-muted-foreground">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500" style={{ width: '40%' }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8 relative z-10">
        {/* Connecting state */}
        {isConnecting && (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in gap-6">
            <div className="w-24 h-24 rounded-[1.75rem] border border-primary/20 bg-primary/10 flex items-center justify-center shadow-[0_0_28px_rgba(124,58,237,0.18)]">
              <CubeLoader size={58} />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-lg">Connecting to Sensor</p>
              <p className="text-muted-foreground text-sm mt-1">Searching for nearby health devices...</p>
            </div>
          </div>
        )}

        {/* Vital readings */}
        {isConnected && (
          <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground">Your Vitals</h2>
              <p className="text-sm text-muted-foreground mt-1">Real-time readings from sensor</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Live — refreshing every 3s</span>
              </div>
            </div>

            {vitals.map((vital, i) => {
              const status = statusLabel(vital.status)
              return (
                <div
                  key={i}
                  className="glass-card p-5 flex items-center gap-5 group hover:border-white/15 transition-all duration-300"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${vital.bgColor} flex items-center justify-center ${vital.color} shrink-0 group-hover:scale-110 transition-transform`}>
                    {vital.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{vital.label}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-3xl font-bold ${vital.status === 'normal' ? 'text-foreground' : vital.status === 'warning' ? 'vitals-warning' : 'vitals-alert'} transition-all`}>
                        {vital.value}
                      </span>
                      <span className="text-sm text-muted-foreground">{vital.unit}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Normal: {vital.target}</p>
                  </div>

                  {/* Status badge */}
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${status.cls} shrink-0`}>
                    {status.text}
                  </div>
                </div>
              )
            })}

            {/* Sync animation */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-2">
              <CubeLoader size={12} />
              Auto-syncing...
            </div>
          </div>
        )}
      </div>

      {/* Proceed button */}
      {isConnected && (
        <div className="px-4 pb-6 pt-2 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Link to="/summary">
            <Button variant="hero" className="w-full rounded-xl py-6 text-base gap-2 group">
              View AI Summary
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
