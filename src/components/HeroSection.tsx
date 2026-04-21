import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function HeroSection() {
  return (
    <section className="bg-background relative overflow-hidden hero-section">
      {/* Navbar at the top */}
      <Navbar />

      {/* Full-width 1px gradient divider */}
      <div className="mt-[3px] w-full h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

      {/* Centered Content */}
      <div className="flex flex-col items-center pt-12 md:pt-20 px-4">
        {/* Headline */}
        <h1
          className="text-[42px] sm:text-[70px] md:text-[85px] xl:text-[130px] font-normal leading-[1.02] tracking-[-0.024em] text-center"
          style={{
            fontFamily: "'General Sans', sans-serif",
          }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(223deg, #E8E8E9 0%, #3A7BBF 104.15%)",
            }}
          >
            IntelliCure
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-hero-sub text-center text-base sm:text-lg md:text-xl xl:text-3xl leading-7 sm:leading-8 max-w-md mt-4 opacity-80">
          our most powerful AI ever deployed<br />
          in Health Ai
        </p>

        {/* CTA Button */}
        <div className="mt-8 mb-16 md:mb-[66px] w-full flex justify-center">
          <Link to="/kiosk">
            <Button variant="heroSecondary" className="px-[29px] py-[24px] w-full sm:w-auto min-w-[240px]">
              Schedule a Consult
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
