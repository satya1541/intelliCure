import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Download, Activity, Shield, Brain, FileText, ShoppingBag, ExternalLink } from "lucide-react";
import { spring } from "./shared";

const CONFETTI_COLORS = ["#7C3AED", "#10B981", "#EAB308", "#F43F5E", "#8B5CF6"];
const DATA_CAPTURED_VIDEO = "/kiosk/datacaptured.mp4";

export default function KioskFinished() {
  const navigate = useNavigate();

  const confetti = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 10,
    duration: 3 + Math.random() * 3,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col lg:flex-row items-center justify-center bg-background overflow-y-auto lg:overflow-hidden p-4 lg:p-10 gap-8 lg:gap-16">

      {/* Abstract background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-success/5 rounded-full blur-[100px]" />

      {/* Confetti */}
      {confetti.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -50, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "115vh", opacity: [1, 1, 0], rotate: 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, left: 0 }}
        />
      ))}

      {/* Left Column: Hero Status */}
      <div className="relative z-10 flex flex-col items-center justify-center shrink-0 max-w-[320px] w-full text-center">
        {/* Hero Success Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          className="relative mb-8"
        >
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-success/30 blur-3xl" />
          <div className="relative w-36 h-36 rounded-[2.5rem] overflow-hidden border border-success/25 bg-transparent shadow-[0_30px_100px_rgba(16,185,129,0.28),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <video
              src={DATA_CAPTURED_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ...spring }}>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-2 leading-tight">Checkup<br/>Finished</h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Dr. Meera Sharma<br/>
            <span className="opacity-50">Session ended {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </motion.div>
      </div>

      {/* Right Column: Cards & Actions */}
      <div className="relative z-10 flex flex-col flex-1 max-w-lg w-full gap-5">
        
        {/* Prescription Card */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, ...spring }}
          className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden group border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-black text-white leading-tight">Digital Prescription</p>
            <p className="text-muted-foreground text-xs font-medium">Notes and medical guidance</p>
          </div>
          <button className="h-10 px-4 bg-primary text-white font-black rounded-xl flex items-center gap-2 hover:bg-primary/80 transition-all shadow-lg text-xs">
            <Download className="w-4 h-4" /> PDF
          </button>
        </motion.div>

        {/* Medicine Purchase Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.58, ...spring }}
          className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden group border border-emerald-400/15 hover:bg-white/5 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="w-14 h-14 bg-emerald-400/10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-7 h-7 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-white leading-tight">Buy Medicine Now</p>
            <p className="text-muted-foreground text-xs font-medium">
              Order prescribed medicines from Helomed
            </p>
          </div>
          <a
            href="https://helomed.app"
            target="_blank"
            rel="noreferrer"
            className="h-10 px-4 bg-emerald-400 text-black font-black rounded-xl flex items-center gap-2 hover:bg-emerald-300 transition-all shadow-lg text-xs whitespace-nowrap"
          >
            Open Helomed <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Metrics Row */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, ...spring }}
          className="grid grid-cols-3 gap-4 w-full">
          {[
            { label: "Duration", value: "12:45", icon: Activity, color: "text-primary" },
            { label: "Vitals", value: "100%", icon: Shield, color: "text-success" },
            { label: "Next", value: "Review", icon: Brain, color: "text-warning" },
          ].map((m, i) => (
            <div key={i} className="glass-card p-4 rounded-3xl text-center border-white/5 flex flex-col items-center justify-center">
              <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-lg font-black text-white leading-none">{m.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Action Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, ...spring }} className="w-full mt-2">
          <button onClick={() => navigate("/doctor")}
            className="w-full h-16 rounded-[1.5rem] border-2 border-primary/50 bg-primary/10 text-primary font-black text-[15px] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-md">
            Go to Doctor Dashboard
          </button>
          <p className="text-center text-muted-foreground/30 text-[9px] mt-4 font-bold uppercase tracking-[0.4em]">Integrated Health Assurance Terminal</p>
        </motion.div>

      </div>
    </motion.div>
  );
}
