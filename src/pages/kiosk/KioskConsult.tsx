import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MicOff, Mic, PhoneOff, VideoOff, Video, Shield, Activity, Brain } from "lucide-react";
import { ASSETS } from "./shared";

const CONNECTING_VIDEO = "/kiosk/finding-animation.mp4";

export default function KioskConsult() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [hr, setHr] = useState(88);
  const [spo2, setSpo2] = useState(98);

  useEffect(() => {
    if (!connected) return;
    const iv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [connected]);
  useEffect(() => {
    if (!connected) return;
    const iv1 = setInterval(() => setHr(h => h + (Math.random() > 0.5 ? 1 : -1)), 3000);
    const iv2 = setInterval(() => setSpo2(s => Math.min(100, Math.max(95, s + (Math.random() > 0.7 ? 1 : -1)))), 6000);
    return () => { clearInterval(iv1); clearInterval(iv2); };
  }, [connected]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col lg:flex-row bg-background text-foreground overflow-hidden">

      {/* Video column */}
      <div className="flex-1 relative overflow-hidden bg-black min-h-[55vh] lg:min-h-0">
        {!connected ? (
          <>
            <video
              src={CONNECTING_VIDEO}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover object-center scale-105"
              onEnded={() => setConnected(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/55 pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-50 px-8 text-center">
              <div>
                <p className="text-2xl font-black tracking-tight mb-2 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.75)]">Connecting to Doctor...</p>
                <p className="text-white/80 font-semibold flex items-center justify-center gap-2 drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)]">
                  <Shield className="w-4 h-4" /> Establishing end-to-end encryption
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Doctor feed */}
            <video src="/doctor.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

            {/* Top HUD */}
            <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-end z-20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-danger/20 border border-danger/40 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-2xl shrink-0">
                  <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  <span className="text-[10px] font-black text-danger tracking-[0.2em] leading-none">LIVE</span>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black tracking-wider leading-none shrink-0">
                  1080P · SECURE
                </div>
              </div>
            </div>

            {/* Doctor Info Floating Detail */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}
              className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.25rem] md:rounded-[1.5rem] border-2 border-primary/40 overflow-hidden shadow-2xl shrink-0">
                <img src="/doctor-thumbnail.png" alt="Doctor" className="w-full h-full object-cover" />
              </div>
              <div className="glass-card bg-black/60 px-4 py-3 border-white/10 rounded-2xl">
                <h4 className="text-lg font-black leading-none mb-1 text-white">Dr. Meera Sharma</h4>
                <p className="text-[10px] font-bold text-primary flex items-center gap-1.5 leading-none uppercase tracking-widest">
                  <Shield className="w-3 h-3" /> MBBS, MD
                </p>
              </div>
            </motion.div>

            {/* Patient PIP - Smaller & Glassy (Moved to bottom left so it doesn't collide with sidebar) */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}
              className="absolute bottom-4 left-4 md:bottom-6 md:left-6 w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-48 rounded-[1.5rem] md:rounded-[2rem] border-2 border-white/20 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-20 glass-card">
              {!camOff ? (
                <video src="/patient.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900/80 backdrop-blur-md flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-white/40" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">
                You
              </div>
            </motion.div>

            {/* Main Controls Rack (Floating Island) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card bg-black/40 border border-white/10 rounded-[2rem] p-2 md:p-3 flex items-center justify-center gap-3 md:gap-4 z-30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setMicMuted(m => !m)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${micMuted ? "bg-danger shadow-xl shadow-danger/40" : "bg-white/10 hover:bg-white/20"}`}
              >
                {micMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>

              <button onClick={() => navigate("/kiosk/finished")}
                className="w-16 h-16 rounded-[1.5rem] bg-danger flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95 transition-all group">
                <PhoneOff className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
              </button>

              <button
                onClick={() => setCamOff(c => !c)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${camOff ? "bg-danger shadow-xl shadow-danger/40" : "bg-white/10 hover:bg-white/20"}`}
              >
                {camOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Data Sidebar - Slimmer for tablet */}
      <div className="w-full lg:w-[280px] flex flex-col border-l-0 lg:border-l border-t lg:border-t-0 border-white/5 bg-background shadow-2xl shrink-0 z-40 overflow-hidden lg:h-full">
        {/* Connection Timer */}
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Session Active</p>
          <p className="text-4xl font-mono font-black text-primary" style={{ textShadow: "0 0 20px rgba(124,58,237,0.4)" }}>{fmt(timer)}</p>
        </div>

        {/* Real-time Streaming Metrics */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3 text-primary" /> Live Vitals Stream
            </p>
            {[
              { label: "SpO2 (Blood Oxygen)", val: `${spo2}%`, cls: "text-primary" },
              { label: "Heart Rate (BPM)", val: `${hr}`, cls: "text-danger" },
              { label: "Blood Pressure", val: "124/82", cls: "text-warning" },
            ].map((m, i) => (
              <div key={i} className="glass-card p-3.5 border-white/5 flex flex-col gap-0.5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-8 h-8 bg-white/5 rotate-45 translate-x-4 -translate-y-4 transition-transform group-hover:translate-x-3" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{m.label}</span>
                <span className={`text-xl font-black ${m.cls} leading-none`}>{m.val}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-3 h-3 text-primary" /> AI Session Context
            </p>
            <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4">
              <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-2">High Risk Flags</p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-warning/10">
                {["Fatigue", "Neuralgia", "Sync:88%"].map(t => (
                  <span key={t} className="text-[9px] font-black text-warning/70 border border-warning/20 px-2 py-1 rounded-md">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
