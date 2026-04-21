import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Printer, RefreshCw, FileText, Star, Brain, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

export default function EndPage() {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [showThank, setShowThank] = useState(false)

  const handleRate = (r: number) => {
    setRating(r)
    setShowThank(true)
  }

  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[180px] pointer-events-none" />

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div className="h-full bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 transition-all duration-500" style={{ width: '100%' }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        {/* Success Animation */}
        <div className="animate-scale-in mb-8">
          <div className="w-24 h-24 rounded-full bg-emerald-400/10 border-2 border-emerald-400/30 flex items-center justify-center relative">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center animate-fade-in mb-2">
          Consultation Completed
        </h1>
        <p className="text-muted-foreground text-center max-w-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Your session with Dr. Sharma has ended. Your prescription is ready below.
        </p>

        {/* Prescription Card */}
        <div className="animate-fade-in-up w-full max-w-md mt-8" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Prescription</p>
                <p className="text-xs text-muted-foreground">Issued by Dr. Sharma • Today</p>
              </div>
            </div>

            <div className="bg-white/3 rounded-xl p-4 border border-white/5 mb-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Diagnosis</p>
                  <p className="text-sm text-foreground font-medium">Tension-type headache with mild dehydration</p>
                </div>
                <div className="border-t border-border/30 pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Medications</p>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-foreground">Paracetamol 500mg</p>
                        <p className="text-xs text-muted-foreground">Twice daily after food</p>
                      </div>
                      <span className="text-xs text-muted-foreground">5 days</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-foreground">ORS Sachets</p>
                        <p className="text-xs text-muted-foreground">3 times daily</p>
                      </div>
                      <span className="text-xs text-muted-foreground">3 days</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/30 pt-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground/80">
                    Increase water intake. Rest for 2 days. Return if symptoms persist beyond 5 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="animate-fade-in-up w-full max-w-md mt-6" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card p-5 text-center">
            <p className="text-sm text-foreground font-medium mb-3">Rate your experience</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-foreground/20"
                    }`}
                  />
                </button>
              ))}
            </div>
            {showThank && (
              <p className="text-xs text-emerald-400 mt-2 animate-fade-in">Thank you for your feedback!</p>
            )}
          </div>
        </div>

        {/* Start New Checkup */}
        <div className="animate-fade-in-up mt-8" style={{ animationDelay: '0.6s' }}>
          <Link to="/home">
            <Button variant="hero" className="rounded-full px-8 py-6 text-base gap-2 group">
              <RefreshCw className="w-5 h-5" />
              Start New Checkup
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <Link to="/" className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  )
}
