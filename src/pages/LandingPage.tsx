import HeroSection from "@/components/HeroSection"
import SocialProofSection from "@/components/SocialProofSection"
import { Brain, Activity, Video, FileText, Shield, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

const features = [
  {
    icon: Brain,
    title: "AI Symptom Intake",
    description: "Describe your symptoms through voice or text. Our AI understands natural language and extracts medical context instantly.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Activity,
    title: "Real-Time Vitals",
    description: "SpO2, heart rate, and blood pressure captured from connected sensors — displayed with instant Normal/Alert status.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Shield,
    title: "AI Triage Engine",
    description: "Intelligent risk scoring maps your symptoms to Low, Medium, or High risk — guiding your next step with clinical accuracy.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Video,
    title: "Video Consultation",
    description: "Connect with a doctor via real-time video. They see your vitals, AI summary, and symptoms — all in one view.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: FileText,
    title: "Instant Prescription",
    description: "Doctors upload prescriptions during the call. Download, print, or share them immediately after your session.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    icon: Zap,
    title: "60-Second Start",
    description: "Designed for non-tech users. Start a checkup and reach the vitals screen in under 60 seconds — no training needed.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
]

const steps = [
  { step: "01", title: "Start Checkup", desc: "Tap the big button. No logins, no forms." },
  { step: "02", title: "Describe Symptoms", desc: "Speak or type — the AI understands you." },
  { step: "03", title: "Vitals Captured", desc: "Sensors measure your SpO2, HR, and BP." },
  { step: "04", title: "AI Assessment", desc: "Get a risk score and recommendation." },
  { step: "05", title: "See a Doctor", desc: "Video call with full patient context." },
  { step: "06", title: "Get Prescription", desc: "Download it immediately after the call." },
]

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col w-full landing-page">
      <HeroSection />
      <SocialProofSection />

      {/* Features Section */}
      <section className="relative py-24 md:py-20 xl:py-24 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Capabilities</p>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold gradient-text mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From symptom intake to prescription delivery — a complete healthcare assessment pipeline powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass-card glass-card-hover p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 md:py-20 xl:py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Process</p>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold gradient-text mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Six simple steps from symptom to solution. No complexity, no confusion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {steps.map((item, i) => (
              <div key={i} className="glass-card p-6 glass-card-hover group relative">
                <div className="text-5xl font-black text-primary/10 absolute top-4 right-4 group-hover:text-primary/20 transition-colors">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-20 xl:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold gradient-text mb-6">
            Ready to Transform<br/>Healthcare Access?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Start a checkup in under 60 seconds. No training. No complexity. Just healthcare that works.
          </p>
          <Link to="/kiosk">
            <Button variant="hero" size="xl" className="rounded-full px-10 py-7 text-lg gap-3 group">
              Begin Your Checkup
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30 overflow-hidden">
              <img src="/image%20logo.png" alt="IntelliCure" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-foreground font-semibold">IntelliCure</span>
            <span className="text-muted-foreground text-sm ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
