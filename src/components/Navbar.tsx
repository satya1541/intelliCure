import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav className="w-full py-4 md:py-5 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
      {/* Left: Logo */}
      <div className="flex items-center justify-center md:justify-start w-full md:w-auto">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/full%20logo.png" alt="IntelliCure Logo" className="h-10 w-auto object-contain" />
        </Link>
      </div>

      {/* Center: Nav Items */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-1 w-full md:w-auto">

        <Link to="/kiosk" className="flex items-center gap-1 text-foreground/90 text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-blue-400 font-medium">
          Kiosk (Start Checkup)
        </Link>
        <Link to="/intelli-icu" className="flex items-center gap-1 text-foreground/90 text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-cyan-300 font-medium">
          IntelliICU
        </Link>
        <Link to="/doctor" className="flex items-center gap-1 text-foreground/90 text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-blue-400 font-medium">
          Doctor Dashboard
        </Link>
      </div>

      {/* Right: Sign Up Button */}
      <div className="flex items-center justify-center md:justify-end gap-4 w-full md:w-auto">
        <Link to="/signup">
          <Button variant="heroSecondary" size="sm" className="rounded-full px-4 py-2 w-full md:w-auto">
            Sign Up
          </Button>
        </Link>
      </div>
    </nav>
  )
}
