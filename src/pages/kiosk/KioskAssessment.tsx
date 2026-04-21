import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Brain, Shield, Zap, Thermometer, Battery, Video, Download, Activity } from "lucide-react";
import { spring, ProgressPill } from "./shared";

export default function KioskAssessment() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="w-full h-full flex flex-col bg-background text-foreground overflow-y-auto lg:overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 sm:px-6 md:px-8 xl:px-10 py-4 bg-background border-b border-white/5 shrink-0 z-10">
        <button onClick={() => navigate("/kiosk/vitals")} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="flex-1 text-lg font-bold">Health Assessment</h2>
        <ProgressPill step={4} />
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-8 px-4 sm:px-6 md:px-8 xl:px-10 py-4 md:py-6 lg:py-8 overflow-hidden h-full">
        {/* Left Column: Risk Banner & Context */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Risk banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ...spring }}
            className="relative overflow-hidden rounded-[2rem] glass-card bg-warning/5 border-warning/20 p-6 md:p-7 lg:p-8 flex-shrink-0"
          >
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-warning/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="relative shrink-0">
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-warning rounded-full blur-md" />
                <div className="relative w-16 h-16 bg-warning rounded-2xl flex items-center justify-center shadow-2xl shadow-warning/40">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-warning/70 uppercase tracking-[0.2em] mb-1">AI Risk Assessment</p>
                <h3 className="text-4xl font-black text-warning leading-none">MEDIUM</h3>
                <p className="text-xs text-warning/60 mt-2 font-bold flex items-center gap-2">
                  <Brain className="w-3 h-3" /> Teleconsultation strongly recommended
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 shadow-lg">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-primary">94%</span>
                    <Shield className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Context */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...spring }} className="glass-card p-6 md:p-7 lg:p-8 bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center">
            <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <Brain className="w-4 h-4" /> AI Diagnostics Note
            </p>
            <div className="text-lg font-medium text-foreground/80 leading-relaxed italic mb-6">
              "Symptoms suggest potential viral seasonal inflammation exacerbated by fatigue. Vital trends show slight HR elevation but overall stability. Immediate clinical overview via video is advised."
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-primary/20 shrink-0 mt-auto">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Duration Insight</p>
                <p className="text-sm font-black">Symptoms persistent for 2-3 Days</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Symptoms & Inline CTA */}
        <div className="w-full md:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6">
          {/* Symptoms List */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, ...spring }} className="glass-card p-5 md:p-6 flex-1 flex flex-col">
            <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 bg-primary rounded-full" /> Reported Symptoms
            </p>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { label: "Tension Headache", icon: Zap, color: "text-primary", bg: "bg-primary/5" },
                { label: "Fever State", icon: Thermometer, color: "text-warning", bg: "bg-warning/5" },
                { label: "Global Fatigue", icon: Battery, color: "text-danger", bg: "bg-danger/5" },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-4 p-3.5 rounded-2xl border border-white/5 ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-base font-bold">{s.label}</span>
                  <div className="ml-auto text-[9px] font-black opacity-30">DETECTED</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Inline CTA */}
          <div className="flex gap-4 shrink-0">
            <button
              onClick={() => navigate("/kiosk/consult")}
              className="flex-1 h-16 rounded-[1.25rem] bg-primary text-white font-black text-lg flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(124,58,237,0.4)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.6)] hover:-translate-y-1 transition-all active:scale-95 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
              <Video className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Connect Doctor</span>
            </button>
            <button className="w-16 h-16 rounded-[1.25rem] glass-card flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-all group shrink-0">
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
