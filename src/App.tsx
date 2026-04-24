import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

const LandingPage = lazy(() => import("@/pages/LandingPage"))
const DoctorDashboard = lazy(() => import("@/pages/DoctorDashboard"))
const IntelliICUPage = lazy(() => import("@/pages/IntelliICUPage"))

// Kiosk Routes
const KioskLayout = lazy(() => import("@/pages/kiosk/KioskLayout"))
const KioskHome = lazy(() => import("@/pages/kiosk/KioskHome"))
const KioskAiAssistant = lazy(() => import("@/pages/kiosk/KioskAiAssistant"))
const KioskVitals = lazy(() => import("@/pages/kiosk/KioskVitals"))
const KioskAssessment = lazy(() => import("@/pages/kiosk/KioskAssessment"))
const KioskConsult = lazy(() => import("@/pages/kiosk/KioskConsult"))
const KioskFinished = lazy(() => import("@/pages/kiosk/KioskFinished"))

function AppLoader() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 text-sm text-muted-foreground">
      Loading interface...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoader />}>
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
          <Route path="/intelli-icu" element={<IntelliICUPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
