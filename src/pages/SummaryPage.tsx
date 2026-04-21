import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Brain, AlertTriangle, CheckCircle, Activity, Heart, Droplets, FileText, Shield } from "lucide-react"
import { Link } from "react-router-dom"

const symptoms = [
  { name: "Headache", severity: "Moderate", duration: "2 days" },
  { name: "Dizziness", severity: "Mild", duration: "1 day" },
  { name: "Weakness", severity: "Mild", duration: "2 days" },
]

const vitals = [
  { label: "SpO2", value: "97%", status: "normal", icon: <Droplets className="w-4 h-4" /> },
  { label: "Heart Rate", value: "78 BPM", status: "normal", icon: <Heart className="w-4 h-4" /> },
  { label: "Blood Pressure", value: "122/82", status: "normal", icon: <Activity className="w-4 h-4" /> },
]

export default function SummaryPage() {
  const riskLevel = "medium" // low | medium | high

  const riskConfig = {
    low: { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: <CheckCircle className="w-6 h-6" />, desc: "Your condition appears stable. A doctor consultation is optional but recommended." },
    medium: { label: "Medium Risk", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", icon: <AlertTriangle className="w-6 h-6" />, desc: "Some symptoms require attention. We recommend connecting with a doctor for further assessment." },
    high: { label: "High Risk", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30", icon: <AlertTriangle className="w-6 h-6" />, desc: "Your symptoms indicate a potentially serious condition. Immediate consultation is strongly advised." },
  }

  const risk = riskConfig[riskLevel]

  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between relative z-20 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/vitals">
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4 text-foreground/70" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              AI Assessment
            </h1>
            <p className="text-xs text-muted-foreground">Step 3 of 5</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400 transition-all duration-500" style={{ width: '60%' }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Risk Level Card */}
          <div className={`glass-card p-6 ${risk.border} border animate-scale-in`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl ${risk.bg} flex items-center justify-center ${risk.color} shrink-0`}>
                {risk.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg font-bold ${risk.color}`}>{risk.label}</span>
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{risk.desc}</p>
              </div>
            </div>
          </div>

          {/* Symptoms Summary */}
          <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              Detected Symptoms
            </h3>
            <div className="space-y-3">
              {symptoms.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-foreground text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Duration: {s.duration}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    s.severity === "Moderate"
                      ? "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                      : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"
                  }`}>
                    {s.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              Vitals Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {vitals.map((v, i) => (
                <div key={i} className="text-center py-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex justify-center mb-2 text-muted-foreground">{v.icon}</div>
                  <p className="text-lg font-bold text-foreground">{v.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{v.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="glass-card p-5 border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-400" />
              AI Recommendation
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Based on your symptoms (headache, dizziness, weakness persisting for 2 days) combined with your vitals (all within normal range), the AI suggests a <span className="text-amber-400 font-medium">non-urgent but recommended</span> doctor consultation. Your vitals are stable, but the persistent symptoms warrant professional evaluation to rule out underlying causes.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-6 pt-2">
        <Link to="/consultation">
          <Button variant="hero" className="w-full rounded-xl py-6 text-base gap-2 group">
            <Shield className="w-5 h-5" />
            Connect to Doctor
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
