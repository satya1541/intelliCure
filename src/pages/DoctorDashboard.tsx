import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Home, Users, Video, FileText, Clock, LogOut,
  AlertTriangle, CheckCircle, Search, Download, Bell, Activity, Mic, MicOff, Camera, PhoneOff, UploadCloud, VideoOff, X, Shield, ArrowLeft
} from "lucide-react"

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [selectedHistory, setSelectedHistory] = useState<any>(null)

  const liveQueue = [
    { id: 1, name: "Ramesh Kumar", age: 45, gender: "M", symptoms: "Headache + Fatigue", duration: "2 days", risk: "HIGH", waitTime: "8 min", vitalSpO2: 96, vitalHR: 102, vitalBP: "138/88" },
    { id: 2, name: "Priya Devi", age: 29, gender: "F", symptoms: "Cough + Cold", duration: "1 day", risk: "LOW", waitTime: "3 min", vitalSpO2: 99, vitalHR: 76, vitalBP: "115/75" },
    { id: 3, name: "Mohammed Ali", age: 52, gender: "M", symptoms: "Chest Discomfort", duration: "1 hour", risk: "MEDIUM", waitTime: "5 min", vitalSpO2: 97, vitalHR: 88, vitalBP: "130/85" },
  ]

  const patientHistory = [
    { id: 101, name: "Anita Sharma", date: "Apr 18, 2026", symptoms: "Fever", risk: "LOW", action: "View Details" },
    { id: 102, name: "Rajesh Singh", date: "Apr 17, 2026", symptoms: "Severe Back Pain", risk: "MEDIUM", action: "View Details" },
    { id: 103, name: "Sunita Patel", date: "Apr 16, 2026", symptoms: "Shortness of breath", risk: "HIGH", action: "View Details" },
    { id: 104, name: "Vikram Reddy", date: "Apr 15, 2026", symptoms: "Nausea", risk: "LOW", action: "View Details" },
    { id: 105, name: "Meena Gupta", date: "Apr 14, 2026", symptoms: "Vision blurriness", risk: "MEDIUM", action: "View Details" },
  ]

  const handleAcceptCall = (patient: any) => {
    setSelectedPatient(patient)
    setActiveTab("consultation")
  }

  const handleCompleteSession = () => {
    setSelectedPatient(null)
    setActiveTab("dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground overflow-hidden doctor-dashboard">
      {/* Sidebar */}
      <aside className="doctor-dashboard-sidebar w-full md:w-[200px] lg:w-[220px] xl:w-[240px] bg-card border-r-0 md:border-r border-b md:border-b-0 border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-white/5 shadow-[0_0_15px_rgba(124,58,237,0.25)]">
              <img src="/image%20logo.png" alt="IntelliCure" className="w-full h-full object-contain p-1" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">IntelliCure</span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-border shadow-sm overflow-hidden flex items-center justify-center">
              <UserSilhouette className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Dr. Meera Sharma</p>
              <p className="text-xs text-muted-foreground">General Medicine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={<Home className="w-5 h-5" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <SidebarItem icon={<Users className="w-5 h-5" />} label="Live Queue" active={activeTab === "queue"} badge="3" onClick={() => setActiveTab("queue")} />
          <SidebarItem icon={<Video className="w-5 h-5" />} label="Consultations" active={activeTab === "consultation"} onClick={() => setActiveTab("consultation")} />
          <SidebarItem icon={<FileText className="w-5 h-5" />} label="Prescriptions" active={activeTab === "prescriptions"} onClick={() => setActiveTab("prescriptions")} />
          <SidebarItem icon={<Clock className="w-5 h-5" />} label="Patient History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
        </nav>

        <div className="p-4 border-t border-border">
          <SidebarItem icon={<LogOut className="w-5 h-5" />} label="Logout" onClick={() => navigate("/", { replace: true })} className="text-danger hover:bg-danger/10" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="doctor-dashboard-main flex-1 overflow-visible md:overflow-hidden flex flex-col bg-background h-auto md:h-screen relative">
        <header className="px-4 sm:px-6 md:px-7 lg:px-8 py-4 md:py-0 min-h-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border bg-card shrink-0">
           <div className="flex items-center gap-3">
             <button
               onClick={() => navigate("/")}
               className="w-10 h-10 rounded-full bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition"
               aria-label="Back to home"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className="text-lg font-semibold text-foreground capitalize">{activeTab.replace('-', ' ')}</h1>
           </div>
           <div className="flex items-center gap-4">
             <div className="relative cursor-pointer hover:bg-white/5 p-2 rounded-full transition">
               <Bell className="w-5 h-5 text-muted-foreground" />
               <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
             </div>
             <span className="text-sm text-muted-foreground font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          {activeTab === "dashboard" && (
            <TabDashboard liveQueue={liveQueue} onAcceptCall={handleAcceptCall} />
          )}
          {activeTab === "queue" && (
            <TabDashboard liveQueue={liveQueue} onAcceptCall={handleAcceptCall} />
          )}
          {activeTab === "consultation" && (
            <TabConsultation patient={selectedPatient} liveQueue={liveQueue} onAcceptCall={handleAcceptCall} onComplete={handleCompleteSession} />
          )}
          {activeTab === "prescriptions" && (
            <TabPrescriptions patient={selectedPatient} liveQueue={liveQueue} />
          )}
          {activeTab === "history" && (
            <TabHistory history={patientHistory} onViewDetails={setSelectedHistory} />
          )}
        </div>

        <AnimatePresence>
          {selectedHistory && (
            <HistoryDetailsModal patient={selectedHistory} onClose={() => setSelectedHistory(null)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function SidebarItem({ icon, label, active, badge, onClick, className = "" }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge && (
        <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  )
}

function TabDashboard({ liveQueue, onAcceptCall }: any) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Good morning, Dr. Sharma</h2>
        <p className="text-muted-foreground">Here's your overview for today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Today's Consultations", value: "8", color: "blue" },
          { label: "Avg Wait Time", value: "4.2 min", color: "emerald" },
          { label: "Patient Satisfaction", value: "98%", color: "amber" },
          { label: "Pending Prescriptions", value: "2", color: "purple" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-xl border border-border shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Live Queue */}
      <div className="glass-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-white/5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Live Queue
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-danger/10 text-danger rounded-full border border-danger/20">
            3 Waiting
          </span>
        </div>
        <div className="divide-y divide-border">
          {liveQueue.map((p: any) => (
            <div key={p.id} className="p-4 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
              <div className="flex gap-4 sm:gap-6 items-center flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground font-bold border border-border shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.symptoms}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 w-full lg:w-auto">
                 <RiskBadge risk={p.risk} />
                 <div className="text-right">
                   <p className="text-xs text-muted-foreground font-medium uppercase">Wait Time</p>
                   <p className="text-sm font-bold text-foreground">{p.waitTime}</p>
                 </div>
                 <button 
                  onClick={() => onAcceptCall(p)}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-[0_0_15px_rgba(124,58,237,0.3)] active:scale-95 w-full sm:w-auto"
                 >
                   Accept Call
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 px-1">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { msg: "Completed consultation with Arvind Rao", time: "10:45 AM" },
            { msg: "Uploaded prescription for Simran Kaur", time: "10:12 AM" },
            { msg: "Completed consultation with Simran Kaur", time: "10:08 AM" },
          ].map((act, i) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-border" />
              <p className="text-muted-foreground flex-1">{act.msg}</p>
              <span className="text-muted-foreground/60">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabConsultation({ patient, liveQueue, onAcceptCall, onComplete }: any) {
  if (!patient) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Consultation Center</h2>
            <p className="text-muted-foreground">Review the live queue and launch a secure session.</p>
          </div>

          <div className="flex gap-3">
            <div className="glass-card px-4 py-3 rounded-xl border border-border shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Waiting</p>
              <p className="text-2xl font-black text-foreground">{liveQueue.length}</p>
            </div>
            <div className="glass-card px-4 py-3 rounded-xl border border-border shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Mode</p>
              <p className="text-2xl font-black text-success">Secure</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-white/5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Live Consult Queue
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-danger/10 text-danger rounded-full border border-danger/20">
                {liveQueue.length} Waiting
              </span>
            </div>
            <div className="divide-y divide-border">
              {liveQueue.map((p: any) => (
                <div key={p.id} className="p-6 flex items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold border border-border shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{p.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{p.symptoms} • {p.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <RiskBadge risk={p.risk} />
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Vitals</p>
                      <p className="text-sm font-bold text-foreground">{p.vitalSpO2}% / {p.vitalHR} BPM</p>
                    </div>
                    <button
                      onClick={() => onAcceptCall(p)}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-[0_0_15px_rgba(124,58,237,0.3)] active:scale-95"
                    >
                      Start Consultation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 rounded-xl border border-border shadow-lg">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Consultation Workflow</h3>
              <div className="space-y-4">
                {[
                  { title: "Verify patient", text: "Confirm identity and triage details.", icon: Shield },
                  { title: "Review symptoms", text: "Check complaints, duration, and vitals.", icon: Activity },
                  { title: "Open video call", text: "Start the secure consultation session.", icon: Video },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-tight mb-1">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-border shadow-lg">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Next In Line</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground font-bold border border-border shrink-0">
                  {liveQueue[0].name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate">{liveQueue[0].name}</p>
                  <p className="text-sm text-muted-foreground truncate">{liveQueue[0].symptoms}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full animate-in fade-in duration-300">
      {/* Video Panel - 60% */}
      <div className="w-full lg:w-3/5 bg-black rounded-2xl overflow-hidden flex flex-col relative shadow-xl border border-white/10 min-h-[52vh] lg:min-h-0">
        <div className="absolute top-4 left-4 bg-danger/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 z-10 border border-danger/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm font-medium z-10 backdrop-blur-md border border-white/10">
          {patient.name}
        </div>

        {/* Remote Video */}
        <div className="flex-1 flex items-center justify-center relative bg-black">
          <video
            src="/patient%20video2.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        {/* Local Video - Doctor */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-24 lg:right-8 w-28 h-40 sm:w-32 sm:h-44 lg:w-40 lg:h-56 bg-zinc-900 rounded-xl border-2 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center">
          <video
            src="/doctor.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 text-xs text-white font-medium bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">You</div>
        </div>

        {/* Video Controls */}
        <div className="h-16 lg:h-20 bg-black/80 backdrop-blur-xl flex items-center justify-center gap-4 lg:gap-6 border-t border-white/10 flex-wrap px-4">
          <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition border border-white/5">
            <MicOff className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition border border-white/5">
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={onComplete} className="w-14 h-14 rounded-full bg-danger text-white flex items-center justify-center hover:bg-danger/90 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition">
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Patient Data Panel - 40% */}
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-y-auto no-scrollbar pb-6 w-full">
        {/* Header box */}
        <div className="glass-card p-6 rounded-xl border border-border shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">{patient.age} yrs • {patient.gender === 'M' ? 'Male' : 'Female'}</p>
          </div>
          <RiskBadge risk={patient.risk} />
        </div>

        <div className="glass-card p-6 rounded-xl border border-border shadow-lg">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Live Vitals
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <span className="text-xs text-muted-foreground font-medium">SpO2</span>
              <p className="text-2xl font-bold text-primary mt-1">{patient.vitalSpO2}%</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <span className="text-xs text-muted-foreground font-medium">HR</span>
              <p className="text-2xl font-bold text-danger mt-1">{patient.vitalHR}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <span className="text-xs text-muted-foreground font-medium">BP</span>
              <p className="text-xl font-bold text-success mt-1">{patient.vitalBP}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-border shadow-lg">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">AI Triage Summary</h3>
          <div className="space-y-3">
             <div>
               <p className="text-xs text-muted-foreground mb-1">Reported Symptoms</p>
               <p className="text-sm font-medium text-foreground">{patient.symptoms}</p>
             </div>
             <div>
               <p className="text-xs text-muted-foreground mb-1">Duration</p>
               <p className="text-sm font-medium text-foreground">{patient.duration}</p>
             </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-border shadow-lg flex-1 flex flex-col min-h-[300px]">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Prescription Notes
          </h3>
          <textarea 
            className="flex-1 w-full bg-background border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition shadow-inner"
            placeholder="Type your medical advice and prescription here..."
          />
          <div className="mt-4 flex gap-3">
            <button className="flex-1 bg-white/5 border border-white/10 text-foreground py-3 text-sm font-semibold rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
              <UploadCloud className="w-4 h-4" /> Upload PDF
            </button>
            <button onClick={onComplete} className="flex-1 bg-success/20 text-success py-3 text-sm font-semibold rounded-lg hover:bg-success/30 border border-success/30 transition flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Complete Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabPrescriptions({ patient, liveQueue }: any) {
  const activePatient = patient || liveQueue[0] || { name: "Demo Patient", symptoms: "General follow-up", duration: "1 day", risk: "LOW" }

  const draftFields = [
    { label: "Medication", value: activePatient.risk === "HIGH" ? "Ibuprofen 400mg" : "Paracetamol 500mg" },
    { label: "Dosage", value: "1 tablet every 6 hours" },
    { label: "Duration", value: "3 days" },
    { label: "Refills", value: "0" },
  ]

  const recentPrescriptions = [
    { patient: "Ramesh Kumar", medication: "Naproxen 250mg", status: "Signed", time: "Today, 10:24 AM" },
    { patient: "Priya Devi", medication: "Vitamin C + Steam", status: "Draft", time: "Today, 09:58 AM" },
    { patient: "Mohammed Ali", medication: "Chest Pain Workup", status: "Issued", time: "Yesterday, 05:10 PM" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Prescriptions</h2>
          <p className="text-muted-foreground">Draft, save, and issue treatment notes with one pass.</p>
        </div>
        <button className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition shadow-[0_0_15px_rgba(124,58,237,0.3)] active:scale-95">
          AI Suggest Draft
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-border shadow-lg">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-1">Current Draft</p>
              <h3 className="text-xl font-bold text-foreground">{activePatient.name}</h3>
              <p className="text-sm text-muted-foreground">{activePatient.symptoms} • {activePatient.duration}</p>
            </div>
            <RiskBadge risk={activePatient.risk} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {draftFields.map((field, i) => (
              <div key={i} className="glass-card p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{field.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{field.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Medical Advice</label>
            <textarea
              className="w-full min-h-[180px] bg-background border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition shadow-inner"
              defaultValue="Continue observation. Recheck vitals after 48 hours if symptoms persist."
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button className="flex-1 min-w-[150px] bg-white/5 border border-white/10 text-foreground py-3 text-sm font-semibold rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
              <UploadCloud className="w-4 h-4" /> Save Draft
            </button>
            <button className="flex-1 min-w-[150px] bg-primary/10 border border-primary/20 text-primary py-3 text-sm font-semibold rounded-lg hover:bg-primary/20 transition flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button className="flex-1 min-w-[150px] bg-success/20 text-success py-3 text-sm font-semibold rounded-lg hover:bg-success/30 border border-success/30 transition flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Issue Now
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl border border-border shadow-lg">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Recent Prescriptions</h3>
            <div className="space-y-3">
              {recentPrescriptions.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5 flex items-start justify-between gap-4 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="font-semibold text-foreground leading-tight">{item.patient}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.medication}</p>
                    <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-2">{item.time}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${item.status === "Issued" ? "bg-success/10 text-success border-success/20" : item.status === "Signed" ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border shadow-lg">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Quick Templates</h3>
            <div className="flex flex-wrap gap-2">
              {["Pain Relief", "Fever Care", "Antibiotic", "Follow-up Note", "Lifestyle Advice"].map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabHistory({ history, onViewDetails }: any) {
  return (
    <div className="max-w-6xl mx-auto glass-card rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5">
        <div className="relative w-full md:w-[260px] xl:w-[300px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-medium border border-primary/20">All</button>
          <button className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-white/5 hover:text-foreground">High Risk</button>
          <button className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-white/5 hover:text-foreground">Medium Risk</button>
          <button className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-white/5 hover:text-foreground">Low Risk</button>
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-black/20 text-muted-foreground font-semibold uppercase tracking-wider text-xs border-b border-border">
          <tr>
            <th className="px-6 py-4">Patient</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Symptoms</th>
            <th className="px-6 py-4">Risk Level</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {history.map((row: any) => (
            <tr key={row.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-semibold text-foreground">{row.name}</td>
              <td className="px-6 py-4 text-muted-foreground">{row.date}</td>
              <td className="px-6 py-4 text-muted-foreground/80">{row.symptoms}</td>
              <td className="px-6 py-4"><RiskBadge risk={row.risk} /></td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onViewDetails(row)} className="text-primary font-semibold hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg">
                  {row.action}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

function HistoryDetailsModal({ patient, onClose }: any) {
  const detailMap: Record<string, any> = {
    LOW: {
      note: "Stable presentation with mild symptoms. Conservative management and observation recommended.",
      followUp: "72 hours",
      status: "Stable",
      plan: "Continue rest, hydration, and symptom monitoring at home.",
      vitalSpO2: "99%",
      vitalHR: "74 BPM",
      vitalBP: "116/74",
    },
    MEDIUM: {
      note: "Moderate presentation reviewed during consultation. Medication and follow-up advised.",
      followUp: "48 hours",
      status: "Monitored",
      plan: "Track symptom progression and reassess if discomfort increases.",
      vitalSpO2: "97%",
      vitalHR: "86 BPM",
      vitalBP: "128/82",
    },
    HIGH: {
      note: "Escalated review completed. Immediate monitoring and clear return precautions were given.",
      followUp: "24 hours",
      status: "Escalated",
      plan: "Observe closely and re-evaluate urgently if respiratory or pain symptoms worsen.",
      vitalSpO2: "95%",
      vitalHR: "104 BPM",
      vitalBP: "138/88",
    },
  }

  const detail = detailMap[patient.risk] || detailMap.LOW

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.98, y: 12, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-4xl glass-card rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
      >
        <div className="p-6 border-b border-border flex items-start justify-between bg-white/5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground mb-2">Demo View Details</p>
            <h3 className="text-2xl font-black text-foreground">{patient.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{patient.date} • {patient.symptoms}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Clinical Summary
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{detail.note}</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "SpO2", value: detail.vitalSpO2, color: "text-primary" },
                { label: "HR", value: detail.vitalHR, color: "text-danger" },
                { label: "BP", value: detail.vitalBP, color: "text-success" },
              ].map((v, i) => (
                <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{v.label}</p>
                  <p className={`text-2xl font-black ${v.color}`}>{v.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Patient Snapshot</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Risk</span>
                  <RiskBadge risk={patient.risk} />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-foreground">{detail.status}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Follow-up</span>
                  <span className="font-semibold text-foreground">{detail.followUp}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Demo Plan</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{detail.plan}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-white/5 flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Demo record only</p>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-foreground hover:bg-white/10 transition">
              Print Summary
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RiskBadge({ risk }: { risk: string }) {
  if (risk === "HIGH") return <span className="px-3 py-1 bg-danger/10 text-danger text-xs font-bold rounded-full border border-danger/20 inline-flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> HIGH</span>
  if (risk === "MEDIUM") return <span className="px-3 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full border border-warning/20 inline-flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> MEDIUM</span>
  return <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full border border-success/20 inline-flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> LOW</span>
}

function UserSilhouette(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
