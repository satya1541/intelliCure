import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Heart } from "lucide-react";
import { spring, ProgressPill, ASSETS } from "./shared";

type Phase = "ready" | "scanning" | "done";

const HAND_PLACEMENT_VIDEO = "/kiosk/hand-placement.mp4";
const DATA_CAPTURED_VIDEO = "/kiosk/datacaptured.mp4";

export default function KioskVitals() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("ready");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [analysisCountdown, setAnalysisCountdown] = useState(3);

  useEffect(() => {
    if (phase !== "ready") return;
    setProgress(0);
    setCountdown(5);

    let remaining = 5;
    const iv = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(iv);
        setPhase("scanning");
        return;
      }

      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== "scanning") return;
    setProgress(0);
    const totalTime = 4000;
    const interval = 50;
    const steps = totalTime / interval;
    let currentStep = 0;

    const iv = setInterval(() => {
      currentStep++;
      // easeOut calculation for progress giving a highly realistic fast-then-slow effect
      const t = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - t, 3);
      const p = easeOut * 100;
      
      setProgress(p);
      if (currentStep >= steps) {
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => setPhase("done"), 600);
      }
    }, interval);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    setAnalysisCountdown(3);

    let remaining = 3;
    const iv = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(iv);
        navigate("/kiosk/assessment");
        return;
      }

      setAnalysisCountdown(remaining);
    }, 1000);

    return () => clearInterval(iv);
  }, [phase, navigate]);

  // Interpolated values for realism
  const currentSpO2 = Math.min(98, Math.round(85 + (13 * (progress / 100))));
  const currentHR = Math.min(88, Math.round(110 - (22 * (progress / 100))));
  const currentBP = progress > 70 ? "124/82" : progress > 40 ? "118/--" : "--/--";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col bg-background text-foreground overflow-hidden relative"
    >
      {/* Dynamic Background Glow based on phase */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none blur-[120px] rounded-full transition-colors duration-1000"
        style={{
          background: phase === 'ready' ? 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)' :
                      phase === 'scanning' ? 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' :
                      'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)'
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-8 py-4 md:py-5 bg-background/80 border-b border-white/5 shrink-0 z-20 backdrop-blur-md">
        <button onClick={() => navigate("/kiosk/ai-assistant")} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="flex-1 text-xl font-bold tracking-tight">Vitals Measurement</h2>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-3 mr-4">
          <AnimatePresence mode="popLayout">
            {phase === "ready" && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="px-4 py-1.5 bg-warning/10 text-warning text-xs font-black rounded-full uppercase tracking-widest border border-warning/20 animate-pulse">
                Awaiting User
              </motion.div>
            )}
            {phase === "scanning" && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="px-4 py-1.5 flex items-center gap-2 bg-primary/20 text-primary text-xs font-black rounded-full uppercase tracking-widest border border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" /> Active Scan
              </motion.div>
            )}
            {phase === "done" && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="px-4 py-1.5 bg-success/20 text-success text-xs font-black rounded-full uppercase tracking-widest border border-success/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                Complete
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ProgressPill step={3} />
      </div>

      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {/* 1. READY PHASE */}
          {phase === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}
              className="absolute inset-0 overflow-hidden"
            >
              <video
                src={HAND_PLACEMENT_VIDEO}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/70 pointer-events-none" />
              <div className="absolute inset-0 bg-primary/5 mix-blend-screen pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...spring }}
                className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[calc(100%-2rem)] max-w-[320px] md:max-w-[420px]"
              >
                <div className="rounded-[2rem] bg-transparent p-0 text-left shadow-none border-0">
                  <h3 className="text-4xl font-black mb-4 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
                    Device Ready
                  </h3>
                  <p className="max-w-md text-base md:text-lg leading-relaxed text-white/90 drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)] mb-8">
                    Please place your right hand flat on the glowing sensor pad to initiate the multi-spectral biometric scan.
                  </p>

                  <div className="inline-flex items-center gap-4 rounded-[1.25rem] border border-white/15 bg-white/10 px-6 py-4 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.12)]">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="w-12 h-12 rounded-full bg-white text-black font-black text-lg flex items-center justify-center"
                    >
                      {String(countdown).padStart(2, "0")}
                    </motion.div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">Starting automatically</p>
                      <p className="text-xs text-white/70">Vitals calculate in {countdown} second{countdown === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 2. SCANNING PHASE */}
          {phase === "scanning" && (
            <motion.div key="scan" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -30 }} transition={spring}
              className="absolute inset-0 flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 lg:py-0 gap-6 md:gap-8 lg:gap-20 overflow-y-auto lg:overflow-hidden"
            >
              {/* Left side: scanning video */}
              <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] lg:w-[360px] lg:h-[360px] shrink-0 overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] border border-black/60 bg-black/85">
                <video
                  src="/kiosk/scanning.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50 pointer-events-none" />
                <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none" />
              </div>

              {/* Right side: Progress & Live Metrics */}
              <div className="flex-1 w-full max-w-md md:max-w-[360px] xl:max-w-md flex flex-col gap-6 lg:gap-8">
                <div>
                  <motion.h3 
                    animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70"
                  >
                    Scanning...
                  </motion.h3>
                  <p className="text-muted-foreground text-base leading-relaxed">Analyzing dermal capillaries and bio-impedance metrics. Please maintain a steady hand position.</p>
                </div>

                {/* Cyberpunk Progress bar */}
                <div className="w-full bg-black/50 rounded-2xl p-5 border border-white/10 glass-card">
                  <div className="flex justify-between text-[11px] font-black tracking-[0.2em] text-white/50 mb-4">
                    <span className="uppercase">Sensors Active</span>
                    <span className="text-primary drop-shadow-[0_0_10px_rgba(124,58,237,0.8)]">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div className="absolute top-0 left-0 h-full rounded-full bg-primary shadow-[0_0_20px_rgba(124,58,237,1)]" style={{ width: `${progress}%` }}>
                      {/* Laser hot-head on progress bar */}
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-white blur-[2px] opacity-80" />
                    </motion.div>
                  </div>
                </div>

                {/* Live metrics (Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "SpO2 (Oxygen)", val: `${currentSpO2}%`, color: "text-primary", glow: "shadow-[0_0_40px_rgba(124,58,237,0.2)]" },
                    { label: "Heart Rate", val: currentHR, color: "text-danger", glow: "shadow-[0_0_40px_rgba(239,68,68,0.2)]" },
                    { label: "Blood Pressure", val: currentBP, color: "text-warning", colSpan: "col-span-2", glow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]" },
                  ].map((m, i) => (
                    <motion.div 
                      key={i} 
                      className={`glass-card p-6 border border-white/10 flex flex-col items-start justify-center relative overflow-hidden rounded-2xl ${m.colSpan || ""} ${m.glow}`}
                    >
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2 z-10">{m.label}</p>
                      <p className={`text-4xl font-black font-mono tracking-tighter z-10 ${m.color} drop-shadow-lg`}>{m.val}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. DONE PHASE */}
          {phase === "done" && (
            <motion.div key="results" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={spring}
              className="absolute inset-0 flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8 lg:py-0 gap-8 md:gap-10 lg:gap-24 overflow-y-auto lg:overflow-hidden"
            >
              {/* Left side: Success & CTA */}
              <div className="flex flex-col items-center text-center max-w-sm md:max-w-[280px] xl:max-w-sm w-full shrink-0">
                <div className="relative mb-10">
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-success/35 blur-[48px]" />
                  <div className="relative w-52 h-52 rounded-full overflow-hidden bg-transparent border border-success/20 shadow-[0_0_90px_rgba(16,185,129,0.28),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                    <video
                      src={DATA_CAPTURED_VIDEO}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="absolute inset-0 h-full w-full object-cover object-center saturate-110 contrast-110"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
                  </div>
                </div>
                <h3 className="text-5xl font-black mb-4 tracking-tight">Captured.</h3>
                <p className="text-muted-foreground text-lg px-2 mb-12 leading-relaxed">Your vitals are exceptionally stable and have been securely synced to our diagnostic AI.</p>
                
                <div className="w-full h-16 rounded-[1.25rem] bg-white text-black font-black text-lg shadow-[0_0_50px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-3">
                    Analyzing...
                    <span className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-base font-black tabular-nums">
                      {analysisCountdown}
                    </span>
                  </span>
                </div>
              </div>

              {/* Right side: Vertical stack of final metrics */}
              <div className="flex flex-col gap-6 flex-1 max-w-md md:max-w-[360px] xl:max-w-md w-full">
                {[
                  { label: "SpO2 (Blood Oxygen)", val: "98", unit: "%", Icon: Activity, color: "text-primary", bg: "from-primary/10 to-transparent border-primary/30", glow: "hover:shadow-[0_0_40px_rgba(124,58,237,0.3)]" },
                  { label: "Heart Rate", val: "88", unit: "BPM", Icon: Heart, color: "text-danger", bg: "from-danger/10 to-transparent border-danger/30", glow: "hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]" },
                  { label: "Blood Pressure", val: "124/82", unit: "mmHg", Icon: Activity, color: "text-warning", bg: "from-warning/10 to-transparent border-warning/30", glow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]" },
                ].map((v, i) => (
                  <motion.div key={v.label} initial={{ opacity: 0, x: 40, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ delay: i * 0.15 + 0.3, ...spring }}
                    className={`glass-card bg-gradient-to-r ${v.bg} p-5 flex items-center gap-6 border-[1.5px] rounded-2xl transition-all duration-300 group ${v.glow} cursor-default hover:-translate-y-1`}
                  >
                    <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <v.Icon className={`w-8 h-8 ${v.color} drop-shadow-md`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-white/50 font-black uppercase tracking-[0.2em] mb-1.5">{v.label}</p>
                      <p className={`text-4xl font-black font-mono tracking-tighter leading-none ${v.color} drop-shadow-md`}>{v.val}<span className="text-xs font-bold ml-2 opacity-50 uppercase tracking-widest">{v.unit}</span></p>
                    </div>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15 + 0.6, type: "spring" }} className="text-[10px] bg-success/20 text-success border border-success/40 px-3 py-1.5 rounded-full font-black uppercase shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-widest">NORMAL</motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
