import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import DoctorDashboard from "@/pages/DoctorDashboard"

// Kiosk Routes
import KioskLayout from "@/pages/kiosk/KioskLayout"
import KioskHome from "@/pages/kiosk/KioskHome"
import KioskAiAssistant from "@/pages/kiosk/KioskAiAssistant"
import KioskVitals from "@/pages/kiosk/KioskVitals"
import KioskAssessment from "@/pages/kiosk/KioskAssessment"
import KioskConsult from "@/pages/kiosk/KioskConsult"
import KioskFinished from "@/pages/kiosk/KioskFinished"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Kiosk Nested Routes */}
        <Route path="/kiosk" element={<KioskLayout />}>
          <Route index element={<KioskHome />} />
          <Route path="ai-assistant" element={<KioskAiAssistant />} />
          <Route path="vitals" element={<KioskVitals />} />
          <Route path="assessment" element={<KioskAssessment />} />
          <Route path="consult" element={<KioskConsult />} />
          <Route path="finished" element={<KioskFinished />} />
        </Route>

        <Route path="/doctor" element={<DoctorDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
