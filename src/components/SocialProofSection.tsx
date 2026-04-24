import { useRef, useEffect } from "react"

const brands = [
  { name: "Clino Health Innovation", letter: "C" },
  { name: "Mo Ambulance", letter: "M" },
  { name: "AMX-Verse", letter: "A" },
  { name: "True Levy", letter: "T" },
  { name: "Hi-Tech Hospital", letter: "H" },
  { name: "Helomed", letter: "H" },
]

export default function SocialProofSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let animationId: number

    const fadeLoop = () => {
      if (!video || video.paused) return
      const { currentTime, duration } = video
      if (duration > 0) {
        const fadeInEnd = 0.5
        const fadeOutStart = duration - 0.5
        if (currentTime < fadeInEnd) {
          video.style.opacity = String(Math.min(currentTime / fadeInEnd, 1))
        } else if (currentTime > fadeOutStart) {
          video.style.opacity = String(Math.max((duration - currentTime) / 0.5, 0))
        } else {
          video.style.opacity = "1"
        }
      }
      animationId = requestAnimationFrame(fadeLoop)
    }

    const handlePlay = () => {
      animationId = requestAnimationFrame(fadeLoop)
    }

    const handleEnded = () => {
      video.style.opacity = "0"
      setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
      }, 100)
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("ended", handleEnded)

    return () => {
      cancelAnimationFrame(animationId)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  return (
    <section className="relative w-full overflow-hidden -mt-10">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0 }}
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pt-4 pb-24 px-4 gap-10">
        {/* h-20 spacer for video visibility */}
        <div className="h-20" />

        {/* Logo Marquee at max-w-5xl */}
        <div className="w-full max-w-5xl flex items-center overflow-hidden">
          {/* Left text */}
          <div className="text-foreground/50 text-sm whitespace-nowrap shrink-0 pr-10">
            Relied on by brands<br />across the globe
          </div>

          {/* Right side Marquee */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex animate-marquee gap-16 items-center">
              {[...brands, ...brands].map((brand, i) => (
                <div key={i} className="flex items-center gap-3 shrink-0">
                  <div className="liquid-glass w-6 h-6 rounded-lg flex items-center justify-center text-sm font-semibold text-foreground">
                    {brand.letter}
                  </div>
                  <span className="text-base font-semibold text-foreground whitespace-nowrap">
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
