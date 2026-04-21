import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, AlertTriangle, Stethoscope, Shield, Activity, Brain } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

const languages = ["English", "हिन्दी", "தமிழ்", "తెలుగు", "বাংলা", "ಕನ್ನಡ"]

export default function HomePage() {
  const [selectedLang, setSelectedLang] = useState("English")
  const [showLang, setShowLang] = useState(false)

  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <div className="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="text-foreground font-semibold text-lg">IntelliCure</span>
        </Link>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-foreground/80 hover:bg-white/10 transition-all"
          >
            <Globe className="w-4 h-4" />
            {selectedLang}
          </button>
          {showLang && (
            <div className="absolute right-0 mt-2 glass-card p-2 min-w-[160px] z-50">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setSelectedLang(lang); setShowLang(false) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedLang === lang ? "bg-primary/20 text-primary" : "text-foreground/70 hover:bg-white/5"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 relative z-10">
        {/* Greeting */}
        <div className="text-center mb-10 animate-fade-in px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            Welcome to <span className="gradient-text">IntelliCure</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Your AI-powered health assessment tool.<br/>
            Fast, simple, and accessible.
          </p>
        </div>

        {/* Big Start Button */}
        <div className="animate-fade-in-up mb-12" style={{ animationDelay: '0.2s' }}>
          <Link to="/symptoms" className="block w-full flex justify-center">
            <button className="relative block group cursor-pointer border-none outline-none focus:outline-none">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl group-hover:bg-primary/50 transition-all duration-500 scale-110" />

              {/* Button body */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-primary via-primary/90 to-violet-700 flex flex-col items-center justify-center gap-3 shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 group-hover:scale-105 group-active:scale-95 transition-all duration-300">
                <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                <span className="text-white text-base sm:text-xl font-bold">Start Checkup</span>
              </div>

              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDuration: '2s' }} />
            </button>
          </Link>
        </div>

        {/* Quick info cards */}
        <div className="animate-fade-in-up grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full px-2" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card p-4 text-center glass-card-hover">
            <Activity className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Vitals Check</p>
            <p className="text-xs text-muted-foreground mt-1">SpO2, HR, BP</p>
          </div>
          <div className="glass-card p-4 text-center glass-card-hover">
            <Brain className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">AI Analysis</p>
            <p className="text-xs text-muted-foreground mt-1">Smart triage</p>
          </div>
          <div className="glass-card p-4 text-center glass-card-hover">
            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Doctor Consult</p>
            <p className="text-xs text-muted-foreground mt-1">Video call</p>
          </div>
        </div>

        {/* Emergency placeholder */}
        <div className="animate-fade-in mt-10" style={{ animationDelay: '0.6s' }}>
          <button className="flex items-center gap-2 px-5 py-3 rounded-full border border-danger/30 bg-danger/10 text-danger text-sm hover:bg-danger/20 transition-all group max-w-full">
            <AlertTriangle className="w-4 h-4 group-hover:animate-pulse" />
            Emergency SOS (Coming V2)
          </button>
        </div>
      </div>
    </div>
  )
}
