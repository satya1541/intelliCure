import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
export const spring = { type: "spring" as const, stiffness: 260, damping: 22 };

export const ASSETS = {
  hero_bg: "/kiosk/hero_bg.png",
  scanner_bg: "/kiosk/scanner_bg.png",
  assistant: "/kiosk/assistant.png",
  doctor: "/kiosk/doctor.png",
  patient: "/kiosk/patient.png",
};

export function ProgressPill({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 shadow-inner z-10 relative">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? "w-6 h-2 bg-primary" : "w-1.5 h-1.5 opacity-20 bg-white"}`} />
      ))}
      <span className="ml-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Step {step} / 6</span>
    </div>
  );
}

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    let isTransitioning = false;

    const setupFade = () => {
      if (video.duration) {
        const timeRemaining = video.duration - video.currentTime;
        if (timeRemaining <= 0.5) {
          if (!isTransitioning) {
            video.style.opacity = '0';
            isTransitioning = true;
          }
        } else if (video.currentTime <= 0.5) {
          if (!isTransitioning) {
            video.style.opacity = '1';
            isTransitioning = true;
          }
        } else {
          isTransitioning = false;
          video.style.opacity = '1';
        }
      }
      rafId = requestAnimationFrame(setupFade);
    };

    const handleEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(console.error);
      }, 100);
    };

    video.addEventListener('play', () => {
      rafId = requestAnimationFrame(setupFade);
    });
    video.addEventListener('ended', handleEnded);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-background overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ opacity: 0 }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
    </div>
  );
}
