import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Globe, AlertTriangle, Play } from "lucide-react";
import { spring } from "./shared";

export default function KioskHome() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("English");

  const handleEmergency = () => {
    window.location.href = "https://aps.24x7healthcare.live/login";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-y-auto no-scrollbar pt-12 pb-12 kiosk-home"
    >
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[80px] pointer-events-none z-0"
      />

      {/* Language pill */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, ...spring }}
        className="absolute top-8 right-8 z-20 flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 shadow-lg"
      >
        <Globe className="w-4 h-4 text-primary/70" />
        <select
          className="bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          <option value="English" className="text-black">English</option>
          <option value="Hindi" className="text-black">हिंदी</option>
        </select>
      </motion.div>

      {/* Step dots */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7, ...spring }}
        className="absolute top-8 left-8 z-20 flex items-center gap-2"
      >
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`rounded-full transition-all ${i === 1 ? "w-8 h-2 bg-primary" : "w-2 h-2 bg-white/20"}`} />
        ))}
      </motion.div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 gap-0 w-full">
        {/* Orb */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...spring }}
          className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6"
        >
          {/* outer pulse rings */}
          {[0, 0.7, 1.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 2], opacity: [0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-primary/40"
            />
          ))}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-primary/40 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.5)] overflow-hidden">
            <img src="/image%20logo.png" alt="IntelliCure" className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]" />
          </div>
        </motion.div>

        {/* Logo text */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, ...spring }}
        >
          <h1 
            className="text-[42px] sm:text-[70px] md:text-[96px] xl:text-[130px] font-normal leading-[1.02] tracking-[-0.024em] bg-clip-text text-transparent"
            style={{ 
              fontFamily: "'General Sans', sans-serif",
              backgroundImage: "linear-gradient(223deg, #E8E8E9 0%, #3A7BBF 104.15%)"
            }}
          >
            IntelliCure
          </h1>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, ...spring }}
          className="text-hero-sub text-center text-base sm:text-lg md:text-xl xl:text-3xl leading-relaxed max-w-2xl mt-4 opacity-80 mb-8 px-2"
        >
          our most powerful AI ever deployed<br />
          in Health Ai
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, ...spring }}
          className="w-full max-w-sm"
        >
          <button
            onClick={() => navigate("/kiosk/ai-assistant")}
            className="group relative w-full max-w-[320px] sm:max-w-sm md:max-w-[360px] xl:max-w-sm h-16 sm:h-20 rounded-full liquid-glass text-foreground text-lg sm:text-2xl md:text-xl xl:text-2xl font-normal hover:bg-white/5 active:scale-95 transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              <Play className="w-6 h-6 fill-foreground text-foreground" />
              Start Checkup
            </span>
          </button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleEmergency}
          className="mt-6 text-danger/80 text-base font-bold hover:text-danger transition-colors flex items-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" /> Emergency? Tap here
        </motion.button>
      </div>

      {/* Powered by */}
      <div className="absolute bottom-2 text-white/10 text-[10px] font-medium z-10">Powered by IntelliCure v2.1</div>
    </motion.div>
  );
}
