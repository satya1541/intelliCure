import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { VideoBackground } from "./shared";

const TABLET_BACKGROUND_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4";

export default function KioskLayout() {
  const location = useLocation();
  const [showVideo, setShowVideo] = useState(location.pathname === "/kiosk");

  useEffect(() => {
    if (location.pathname === "/kiosk") {
      setShowVideo(true);
    } else {
      setShowVideo(false);
    }
  }, [location.pathname]);

  return (
    <div className="kiosk-shell-wrapper w-screen h-[100dvh] overflow-hidden bg-black text-foreground relative flex items-center justify-center p-0 sm:p-3 md:p-5 xl:p-8 select-none" style={{ perspective: 1200 }}>
      {/* Constant video background running outside the tablet */}
      <VideoBackground />

      {/* Fullscreen intro video ONLY for /kiosk home, unclickable so touches pass through to Start button */}
      <AnimatePresence>
        {showVideo && (
          <motion.video
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            src="/kiosk-video.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setShowVideo(false)}
            className="fixed inset-0 w-screen h-[100dvh] object-cover pointer-events-none z-[100]"
          />
        )}
      </AnimatePresence>
      
      {/* Ambient glows behind the tablet */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-10" />

      {/* Soft contact shadow under the tablet */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-[5vh] w-[1000px] h-12 rounded-[50%] bg-black blur-3xl opacity-80 pointer-events-none z-10" />

      {/* 3D Tablet Device — outer aluminum chassis */}
      <motion.div
        initial={{ rotateX: 15, rotateY: -5, y: 150, z: -200, opacity: 0, scale: 0.8 }}
        animate={{ rotateX: 0, rotateY: 0, y: 0, z: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 25, mass: 1.2 }}
        className="kiosk-shell-motion relative w-full max-w-none md:max-w-[1050px] h-[100dvh] md:h-[700px] max-h-none md:max-h-[85vh] rounded-none md:rounded-[2.2rem] xl:rounded-[2.6rem] flex flex-col text-foreground z-20"
        style={{
          transformStyle: "preserve-3d",
          background:
            "linear-gradient(135deg,#5b5d63 0%,#2c2e33 18%,#17181c 42%,#0d0e11 58%,#1a1c20 78%,#4a4c52 100%)",
          padding: "9px",
          boxShadow: [
            "0 70px 140px rgba(0,0,0,0.8)",
            "0 30px 60px rgba(0,0,0,0.55)",
            "0 2px 0 rgba(255,255,255,0.04)",
            "inset 0 1.5px 0 rgba(255,255,255,0.35)",
            "inset 0 -1.5px 0 rgba(0,0,0,0.85)",
            "inset 1.5px 0 0 rgba(255,255,255,0.08)",
            "inset -1.5px 0 0 rgba(255,255,255,0.08)",
          ].join(","),
        }}
      >
        {/* Subtle brushed-metal sheen overlay on the bezel */}
        <div
          className="hidden md:block absolute inset-0 rounded-[2.2rem] xl:rounded-[2.6rem] pointer-events-none z-30 mix-blend-overlay opacity-60"
          style={{
            background:
              "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.08) 30%, transparent 32%, transparent 60%, rgba(255,255,255,0.05) 62%, transparent 64%)",
          }}
        />

        {/* Inner mid-frame ring (dark plastic gasket) */}
        <div
          className="relative w-full h-full rounded-none md:rounded-[1.7rem] xl:rounded-[2.05rem] overflow-hidden"
          style={{
            background: "#020203",
            boxShadow:
              "inset 0 0 0 1px #000, 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 24px rgba(0,0,0,0.95)",
          }}
        >
          {/* Screen — sits with a thin uniform bezel inside the mid-frame */}
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              background: "#000",
            }}
          >
            {/* Front camera (tiny pinhole, centered on top bezel of outer frame) */}
            <div className="absolute top-[3px] left-1/2 -translate-x-1/2 z-50">
              <div
                className="w-[7px] h-[7px] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #1b2a44 0%, #060912 55%, #000 100%)",
                  boxShadow:
                    "inset 0 0 1px rgba(255,255,255,0.4), 0 0 0 1px rgba(0,0,0,0.9)",
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col relative isolate z-20 w-full h-full overflow-hidden bg-transparent">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                  src={TABLET_BACKGROUND_VIDEO}
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload="auto"
                  className="absolute inset-0 h-full w-full object-cover scale-105 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/20 to-background/80 pointer-events-none" />
              </div>

              <AnimatePresence mode="wait">
                <div key={location.pathname} className="relative z-10 w-full h-full">
                  <Outlet />
                </div>
              </AnimatePresence>

              {/* Glass reflection — large diagonal sheen */}
              <div
                className="absolute inset-0 pointer-events-none z-40"
                style={{
                  background:
                    "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 18%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.04) 85%, rgba(255,255,255,0.09) 100%)",
                }}
              />
              {/* Soft top-left highlight bloom */}
              <div className="absolute -top-24 -left-16 w-[55%] h-[55%] rotate-[18deg] bg-white/10 blur-3xl pointer-events-none z-40 rounded-full" />
              {/* Vignette to deepen the screen edges */}
              <div
                className="absolute inset-0 pointer-events-none z-40"
                style={{
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.45)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Hardware: side buttons protruding from the chassis */}
        {/* Power button (top-right edge) */}
        <div
          className="hidden md:block absolute -right-[4px] top-[60px] w-[4px] h-[58px] z-30"
          style={{
            background:
              "linear-gradient(180deg,#5a5c61 0%,#1f2024 50%,#5a5c61 100%)",
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.6), 1px 1px 2px rgba(0,0,0,0.7)",
          }}
        />
        {/* Volume rocker (left edge) */}
        <div
          className="hidden md:block absolute -left-[4px] top-[80px] w-[4px] h-[110px] z-30"
          style={{
            background:
              "linear-gradient(180deg,#5a5c61 0%,#1f2024 50%,#5a5c61 100%)",
            borderTopLeftRadius: 2,
            borderBottomLeftRadius: 2,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.6), -1px 1px 2px rgba(0,0,0,0.7)",
          }}
        />

        {/* Antenna line / chamfer accent on top edge */}
        <div className="hidden md:block absolute top-[2px] left-[14%] right-[14%] h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-40" />
        <div className="hidden md:block absolute bottom-[2px] left-[14%] right-[14%] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-40" />
      </motion.div>
    </div>
  );
}
