import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"
import { Activity, AlertTriangle, ArrowLeft, Brain, Camera, Clock3, Droplets, Heart, Sparkles, Thermometer, Wind } from "lucide-react"

const ECG_PATTERN = [0, 0, 0, 0.35, -0.45, 0.1, 0.2, -0.7, 0.5, 0, 1.2, -2.6, 7.8, -9.8, 4.2, 0.1, 0, 0, 0.15, 0, 0, 0]

const DEFAULT_WAVEFORM_LENGTH = 96

type WaveformDefinition = {
  key: string
  label: string
  subtitle: string
  tone: string
  featured?: boolean
}

const WAVEFORM_DEFINITIONS: WaveformDefinition[] = [
  { key: "ECG_II", label: "ECG II", subtitle: "Primary rhythm", tone: "text-emerald-300", featured: true },
  { key: "ECG_I", label: "ECG I", subtitle: "Lateral lead", tone: "text-cyan-300" },
  { key: "ECG_III", label: "ECG III", subtitle: "Inferior lead", tone: "text-violet-300" },
  { key: "ECG_AVR", label: "ECG aVR", subtitle: "Augmented lead", tone: "text-fuchsia-300" },
  { key: "ECG_AVL", label: "ECG aVL", subtitle: "Augmented lead", tone: "text-amber-300" },
  { key: "ECG_AVF", label: "ECG aVF", subtitle: "Augmented lead", tone: "text-sky-300" },
  { key: "RESP", label: "RESP", subtitle: "Respiratory trace", tone: "text-lime-300" },
  { key: "SPO2_PLETH", label: "SpO2 Pleth", subtitle: "Pulse pleth", tone: "text-rose-300" },
  { key: "ECG_V", label: "ECG V", subtitle: "Precordial lead", tone: "text-teal-300" },
] 

type Severity = "stable" | "watch" | "critical"

type ICUPageContext = {
  patientName?: string
  patientAge?: string | number
  bed?: string
  shift?: string
  doctor?: string
  diagnosis?: string
  ambRegNo?: string
  cameraTopic?: string
}

type LiveVitalsState = {
  oxygen: number
  heartRate: number
  respiratoryRate: number
  temperature: number
  systolic: number
  diastolic: number
}

type IncomingVital = {
  parameterId?: number | string
  parameterName?: string
  value?: number
  unit?: string
}

type WaveformPacket = {
  series: number[]
  sampleRate: number
  channel: number
  patientMrn?: string
}

function getRouteContext(location: { state: unknown; search: string }) {
  const state = (location.state as ICUPageContext | null) ?? {}
  const searchParams = new URLSearchParams(location.search)

  return {
    patientName: state.patientName ?? searchParams.get("patientName") ?? "",
    patientAge: state.patientAge ?? searchParams.get("patientAge") ?? "",
    bed: state.bed ?? searchParams.get("bed") ?? "",
    shift: state.shift ?? searchParams.get("shift") ?? "",
    doctor: state.doctor ?? searchParams.get("doctor") ?? "",
    diagnosis: state.diagnosis ?? searchParams.get("diagnosis") ?? "",
    ambRegNo: state.ambRegNo ?? searchParams.get("ambRegNo") ?? "",
    cameraTopic: state.cameraTopic ?? searchParams.get("cameraTopic") ?? "",
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function createFlatSeries(length = DEFAULT_WAVEFORM_LENGTH) {
  return Array(length).fill(0)
}

function normalizeWaveformKey(name: string) {
  return name.trim().replace(/\s+/g, "_").toUpperCase()
}

function seriesToPoints(values: number[], width = 100, height = 100) {
  if (values.length < 2) {
    return ""
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const negativeOnly = max <= 0 && min < 0

  if (max === min) {
    const centerY = height / 2

    return values
      .map((_, index) => {
        const x = (index / (values.length - 1)) * width
        return `${x},${centerY}`
      })
      .join(" ")
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = negativeOnly
        ? height / 2 + clamp((max - value) / range, 0, 1) * (height / 2)
        : height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")
}

function buildWaveformGeometry(values: number[], width = 300, height = 100) {
  if (values.length < 2) {
    return {
      path: "",
      fillPath: "",
      lastY: height / 2,
    }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const centerY = height / 2
  const negativeOnly = max <= 0 && min < 0

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = max === min
      ? centerY
      : negativeOnly
        ? centerY + clamp((max - value) / range, 0, 1) * centerY
        : height - ((value - min) / range) * height
    return { x, y }
  })

  const buildPath = () => {
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
    }

    let path = `M ${points[0].x} ${points[0].y}`

    for (let index = 0; index < points.length - 1; index++) {
      const previousPoint = points[index - 1] ?? points[index]
      const currentPoint = points[index]
      const nextPoint = points[index + 1]
      const nextNextPoint = points[index + 2] ?? nextPoint

      const cp1x = currentPoint.x + (nextPoint.x - previousPoint.x) / 6
      const cp1y = currentPoint.y + (nextPoint.y - previousPoint.y) / 6
      const cp2x = nextPoint.x - (nextNextPoint.x - currentPoint.x) / 6
      const cp2y = nextPoint.y - (nextNextPoint.y - currentPoint.y) / 6

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextPoint.x} ${nextPoint.y}`
    }

    return path
  }

  const path = buildPath()
  const baselineY = negativeOnly ? centerY : height

  return {
    path,
    fillPath: `${path} L ${width} ${baselineY} L 0 ${baselineY} Z`,
    lastY: points[points.length - 1].y,
  }
}

function Sparkline({ values, tone }: { values: number[]; tone: string }) {
  const points = seriesToPoints(values)

  if (!points) {
    return <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">Awaiting live data</div>
  }

  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full overflow-visible ${tone}`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VitalCard({
  label,
  value,
  unit,
  tone,
  series,
  icon,
}: {
  label: string
  value: string
  unit: string
  tone: string
  series: number[]
  icon: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-[10px] sm:text-[9px] min-[1400px]:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span className="flex shrink-0 h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-foreground/90">{icon}</span>
          <span className="truncate leading-tight">{label}</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className={`text-3xl font-black tracking-tight ${tone}`}>{value}</span>
          <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{unit}</span>
        </div>
      </div>

      <div className="relative z-10 mt-4 h-14 rounded-2xl border border-white/5 bg-black/20 p-2 text-current">
        <Sparkline values={series} tone={tone} />
      </div>
    </motion.div>
  )
}

function WaveformCard({ definition, packet }: { definition: WaveformDefinition; packet?: WaveformPacket }) {
  const series = packet?.series ?? createFlatSeries()
  const geometry = buildWaveformGeometry(series, 300, 100)
  const filterId = `waveform-glow-${definition.key.toLowerCase()}`
  const isLive = Boolean(packet)
  const isFlat = isLive && series.length > 1 && series.every((value) => value === series[0])
  const descriptor = !isLive ? "Waiting for stream" : isFlat ? "Flat baseline" : "Live stream"
  const sampleRateLabel = packet?.sampleRate && packet.sampleRate > 0 ? `${packet.sampleRate} Hz` : "-- Hz"
  const channelLabel = packet?.channel && packet.channel > 0 ? `ch ${packet.channel}` : "ch --"
  const latestValue = series.length > 0 ? series[series.length - 1] : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`glass-card relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ${definition.featured ? "xl:col-span-2" : ""} ${definition.tone}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
      <motion.div
        className="pointer-events-none absolute inset-y-4 left-0 w-28 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl opacity-60"
        animate={{ x: ["-35%", "140%"] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">{definition.subtitle}</p>
          <h3 className="mt-1 truncate text-lg font-black text-current">{definition.label}</h3>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">Stream</p>
          <p className={`mt-1 text-sm font-semibold ${isLive ? (isFlat ? "text-warning" : "text-success") : "text-muted-foreground"}`}>{descriptor}</p>
        </div>
      </div>

      <div className="relative z-10 mt-4 h-52 overflow-hidden rounded-[1.4rem] border border-white/5 bg-[#05040a] p-3">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:100%_18px,18px_100%] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.08),transparent_60%)]" />
        {!isLive && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 backdrop-blur-md">
              Waiting for the patient to get geared up
            </div>
          </div>
        )}

        <motion.div
          className="pointer-events-none absolute inset-y-4 left-0 w-28 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl opacity-50"
          animate={{ x: ["-30%", "140%"] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
        />

        <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="relative z-10 h-full w-full overflow-visible">
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <motion.path
            d={geometry.fillPath}
            fill="currentColor"
            fillOpacity="0.08"
            stroke="none"
            animate={{ opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.path
            d={geometry.path}
            fill="none"
            stroke="currentColor"
            strokeWidth={definition.featured ? 3.25 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${filterId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.8, 1, 0.85] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.circle
            cx={300}
            cy={geometry.lastY}
            r={definition.featured ? 3.1 : 2.8}
            fill="currentColor"
            animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.35em] text-white/75 backdrop-blur-md">
          {isLive ? (isFlat ? "Flat trace" : "Live trace") : "Awaiting stream"}
        </div>
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.35em] text-white/75 backdrop-blur-md">
          {Math.round(latestValue)}
        </div>
        <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.35em] text-white/75 backdrop-blur-md">
          {sampleRateLabel}
        </div>
        <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.35em] text-white/75 backdrop-blur-md">
          {channelLabel}
        </div>
      </div>
    </motion.div>
  )
}

function isSameVitalIdentifier(entry: IncomingVital, identifier: number | string) {
  return String(entry.parameterId ?? "").toLowerCase() === String(identifier).toLowerCase() || String(entry.parameterName ?? "").toLowerCase() === String(identifier).toLowerCase()
}

function extractVitalsUpdate(payload: any): Partial<LiveVitalsState> | null {
  const vitalsArray = payload?.data?.vitals || payload?.vitals
  const dashboardVitals = payload?.data?.dashboardVitals || payload?.dashboardVitals

  const collectFromArray = (readings: IncomingVital[] | undefined) => {
    if (!Array.isArray(readings)) {
      return null
    }

    const findParam = (identifiers: Array<number | string>) =>
      readings.find((entry) => identifiers.some((identifier) => isSameVitalIdentifier(entry, identifier)))

    const nextVitals: Partial<LiveVitalsState> = {}

    const spo2 = findParam([251, "SpO2"])
    const heartRate = findParam([259, "PR", "HR"])
    const respiratoryRate = findParam([258, "RR"])
    const temperature = findParam([1051, 1052, "T1", "T2"])
    const systolic = findParam([351, "NIBP-S"])
    const diastolic = findParam([352, "NIBP-D"])

    if (typeof spo2?.value === "number" && spo2.value >= 0) nextVitals.oxygen = spo2.value
    if (typeof heartRate?.value === "number" && heartRate.value >= 0) nextVitals.heartRate = heartRate.value
    if (typeof respiratoryRate?.value === "number" && respiratoryRate.value >= 0) nextVitals.respiratoryRate = respiratoryRate.value
    if (typeof temperature?.value === "number" && temperature.value >= 0) nextVitals.temperature = temperature.value
    if (typeof systolic?.value === "number" && systolic.value >= 0) nextVitals.systolic = systolic.value
    if (typeof diastolic?.value === "number" && diastolic.value >= 0) nextVitals.diastolic = diastolic.value

    return Object.keys(nextVitals).length > 0 ? nextVitals : null
  }

  const arrayUpdate = collectFromArray(vitalsArray)
  if (arrayUpdate) {
    return arrayUpdate
  }

  if (!dashboardVitals) {
    return null
  }

  const nextVitals: Partial<LiveVitalsState> = {}

  if (typeof dashboardVitals.spo2?.value === "number" && dashboardVitals.spo2.value >= 0) nextVitals.oxygen = dashboardVitals.spo2.value
  if (typeof dashboardVitals.heartRate?.value === "number" && dashboardVitals.heartRate.value >= 0) nextVitals.heartRate = dashboardVitals.heartRate.value
  if (typeof dashboardVitals.respiratoryRate?.value === "number" && dashboardVitals.respiratoryRate.value >= 0) nextVitals.respiratoryRate = dashboardVitals.respiratoryRate.value
  if (typeof dashboardVitals.temperature?.value === "number" && dashboardVitals.temperature.value >= 0) nextVitals.temperature = dashboardVitals.temperature.value
  if (typeof dashboardVitals.bloodPressure?.sys === "number" && dashboardVitals.bloodPressure.sys >= 0) nextVitals.systolic = dashboardVitals.bloodPressure.sys
  if (typeof dashboardVitals.bloodPressure?.dia === "number" && dashboardVitals.bloodPressure.dia >= 0) nextVitals.diastolic = dashboardVitals.bloodPressure.dia

  return Object.keys(nextVitals).length > 0 ? nextVitals : null
}

function extractWaveformPacket(payload: any) {
  const waveformPayload = payload?.data?.waveform ? payload.data : payload
  const packetType = String(payload?.type ?? "waveform").toLowerCase()
  const waveform = waveformPayload?.waveform
  const waveformName = String(waveform?.waveformName ?? "").trim()
  const dataPoints = waveform?.dataPoints

  if (packetType !== "waveform" || !waveformName || !Array.isArray(dataPoints)) {
    return null
  }

  const series = dataPoints.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value))

  if (series.length === 0) {
    return null
  }

  return {
    waveformName,
    channel: Number(waveform?.channel ?? 0) || 0,
    sampleRate: Number(waveform?.sampleRate ?? 0) || 0,
    dataPoints: series,
    patientMrn: waveformPayload?.patientMrn,
  }
}

export default function IntelliICUPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeContext = getRouteContext(location)

  const patientName = routeContext.patientName || "Waiting for patient"
  const patientAge = routeContext.patientAge ? String(routeContext.patientAge) : ""
  const bedLabel = routeContext.bed ? `Bed ${routeContext.bed}` : "Bed --"
  const shiftLabel = routeContext.shift || "Awaiting handoff"
  const ambRegNo = routeContext.ambRegNo

  const [vitals, setVitals] = useState<LiveVitalsState>({
    oxygen: 0,
    heartRate: 0,
    respiratoryRate: 0,
    temperature: 0,
    systolic: 0,
    diastolic: 0
  })

  const [oxygenSeries, setOxygenSeries] = useState<number[]>([])
  const [heartSeries, setHeartSeries] = useState<number[]>([])
  const [respiratorySeries, setRespiratorySeries] = useState<number[]>([])
  const [temperatureSeries, setTemperatureSeries] = useState<number[]>([])
  const [bloodPressureSeries, setBloodPressureSeries] = useState<number[]>([])
  const [waveforms, setWaveforms] = useState<Record<string, WaveformPacket | undefined>>({})
  const [hasLiveVitals, setHasLiveVitals] = useState(false)

  useEffect(() => {
    let ws: WebSocket | undefined
    let reconnectTimeout: number | undefined
    let active = true

    const connect = () => {
      ws = new WebSocket("wss://vital.smartambulance.in/")
      
      ws.onopen = () => {
        console.log("WebSocket connected")

        if (ambRegNo) {
          ws?.send(JSON.stringify({ event: "join_vital_room", data: ambRegNo }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const parsed = typeof event.data === "string" ? JSON.parse(event.data) : event.data
          console.log("IntelliICU websocket payload", parsed)

          const vitalsUpdate = extractVitalsUpdate(parsed)
          if (vitalsUpdate) {
            setHasLiveVitals(true)
            setVitals((prev) => ({ ...prev, ...vitalsUpdate }))

            if (typeof vitalsUpdate.oxygen === "number") setOxygenSeries((history) => [...history.slice(-27), vitalsUpdate.oxygen as number])
            if (typeof vitalsUpdate.heartRate === "number") setHeartSeries((history) => [...history.slice(-27), vitalsUpdate.heartRate as number])
            if (typeof vitalsUpdate.respiratoryRate === "number") setRespiratorySeries((history) => [...history.slice(-27), vitalsUpdate.respiratoryRate as number])
            if (typeof vitalsUpdate.temperature === "number") setTemperatureSeries((history) => [...history.slice(-27), vitalsUpdate.temperature as number])
            if (typeof vitalsUpdate.systolic === "number") setBloodPressureSeries((history) => [...history.slice(-27), vitalsUpdate.systolic as number])
            return
          }

          const waveformPacket = extractWaveformPacket(parsed)

          if (waveformPacket) {
            const waveformKey = normalizeWaveformKey(waveformPacket.waveformName)

            setWaveforms((history) => ({
              ...history,
              [waveformKey]: {
                series: waveformPacket.dataPoints.slice(-300),
                sampleRate: waveformPacket.sampleRate,
                channel: waveformPacket.channel,
                patientMrn: waveformPacket.patientMrn,
              },
            }))
          }
        } catch (err) {
          console.error("WS Parse error", err)
        }
      }

      ws.onclose = () => {
        if (!active) {
          return
        }

        console.log("WS closed, retrying in 5s...")
        reconnectTimeout = window.setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      active = false
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const { oxygen, heartRate, respiratoryRate, temperature, systolic, diastolic } = vitals

  const ecgSeverity: Severity = !hasLiveVitals ? "stable" : oxygen < 92 || heartRate > 115 || respiratoryRate > 25 || temperature > 38.0 || systolic > 150 ? "critical" : oxygen < 94 || heartRate > 100 || respiratoryRate > 22 || temperature > 37.7 ? "watch" : "stable"

  const alerts = hasLiveVitals ? [
    oxygen < 94 && { title: "SpO2 dip detected", detail: `Oxygen level fell to ${oxygen}%`, severity: "critical" as const },
    heartRate > 108 && { title: "Tachycardia spike", detail: `Heart rate jumped to ${heartRate} bpm`, severity: "critical" as const },
    respiratoryRate > 24 && { title: "Respiratory stress", detail: `Breathing rate rose to ${respiratoryRate} bpm`, severity: "watch" as const },
    temperature > 38.0 && { title: "Temperature escalation", detail: `Temperature reached ${temperature}°C`, severity: "watch" as const },
    systolic > 145 && { title: "Blood pressure instability", detail: `Systolic pressure peaked at ${systolic} mmHg`, severity: "critical" as const },
    ecgSeverity !== "stable" && { title: "ECG rhythm anomaly", detail: ecgSeverity === "critical" ? "Irregular spike pattern detected" : "Rhythm variation under observation", severity: ecgSeverity },
  ].filter(Boolean) as Array<{ title: string; detail: string; severity: Severity }> : []

  const statusLabel = !hasLiveVitals ? "Waiting for live vitals" : ecgSeverity === "critical" ? "Critical watch" : ecgSeverity === "watch" ? "Active watch" : "Stable monitor"
  const statusTone = !hasLiveVitals ? "text-muted-foreground" : ecgSeverity === "critical" ? "text-danger" : ecgSeverity === "watch" ? "text-warning" : "text-success"

  const oxygenDisplay = hasLiveVitals ? vitals.oxygen.toFixed(1) : "--"
  const heartRateDisplay = hasLiveVitals ? String(vitals.heartRate) : "--"
  const respiratoryDisplay = hasLiveVitals ? String(vitals.respiratoryRate) : "--"
  const temperatureDisplay = hasLiveVitals ? vitals.temperature.toFixed(1) : "--"
  const bloodPressureDisplay = hasLiveVitals ? `${vitals.systolic}/${vitals.diastolic}` : "--/--"
  const hasLiveWaveforms = Object.keys(waveforms).length > 0
  const waveformSummaryLabel = hasLiveVitals ? `${heartRate} bpm` : hasLiveWaveforms ? "Waveforms live" : "-- bpm"
  const waveformSummaryTone = hasLiveVitals ? statusTone : hasLiveWaveforms ? "text-success" : "text-muted-foreground"
  const waveformCards = WAVEFORM_DEFINITIONS.map((definition) => ({
    definition,
    packet: waveforms[definition.key],
  }))

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <video
        className="absolute inset-0 h-full w-full object-cover object-center opacity-35 saturate-125"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute top-[-12%] left-[-8%] h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-6%] h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

      <main className="relative z-10 grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <VitalCard label="Oxygen Level" value={oxygenDisplay} unit="%" tone="text-cyan-300" series={oxygenSeries} icon={<Activity className="h-4 w-4 text-cyan-300" />} />
            <VitalCard label="Heart Rate" value={heartRateDisplay} unit="bpm" tone="text-rose-300" series={heartSeries} icon={<Heart className="h-4 w-4 text-rose-300" />} />
            <VitalCard label="Respiratory Rate" value={respiratoryDisplay} unit="bpm" tone="text-emerald-300" series={respiratorySeries} icon={<Wind className="h-4 w-4 text-emerald-300" />} />
            <VitalCard label="Temperature" value={temperatureDisplay} unit="°C" tone="text-amber-300" series={temperatureSeries} icon={<Thermometer className="h-4 w-4 text-amber-300" />} />
            <VitalCard label="Blood Pressure" value={bloodPressureDisplay} unit="mmHg" tone="text-violet-300" series={bloodPressureSeries} icon={<Droplets className="h-4 w-4 text-violet-300" />} />
          </div>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-400/10 pointer-events-none" />
            <div className="relative z-10 border-b border-white/5 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/doctor")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10 hover:text-foreground transition"
                    aria-label="Back to doctor dashboard"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">Live waveform grid</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/90">{patientName}{patientAge ? ` • ${patientAge} yrs` : ""}</div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/90">{bedLabel}</div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/90 flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-primary" /> {shiftLabel}</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 p-5">
              <div className="rounded-[1.8rem] border border-white/5 bg-[#05040a] p-4 shadow-inner shadow-black/50">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">Waveform matrix</p>
                    <p className={`mt-1 text-2xl font-black ${waveformSummaryTone}`}>{waveformSummaryLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">Clinical readout</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{hasLiveVitals ? (ecgSeverity === "critical" ? "Spike pattern detected" : ecgSeverity === "watch" ? "Irregularity under review" : "Sinus rhythm stable") : hasLiveWaveforms ? "Lead packets streaming" : "Awaiting live stream"}</p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {waveformCards.map(({ definition, packet }) => (
                    <WaveformCard key={definition.key} definition={definition} packet={packet} />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </section>

        <aside className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-400/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">Patient Camera</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">Live ICU Feed</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-danger">
                <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                Live stream
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden bg-black">
              <video
                src="/patient%20live%20feed.mp4"
                poster="/patient_camera.png"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)] bg-[length:100%_7px] opacity-40 pointer-events-none" />

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/90 backdrop-blur-md">
                <Camera className="h-3.5 w-3.5 text-cyan-300" /> ICU Camera
              </div>
              <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/80 backdrop-blur-md">
                {routeContext.bed || "Bed --"}
              </div>

              <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">Live monitoring</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{hasLiveVitals ? "SpO2 and ECG sync active" : hasLiveWaveforms ? "Waveform stream active" : "Waiting for telemetry"}</p>
              </div>

              <div className="absolute bottom-4 right-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">Risk lane</p>
                <p className={`mt-1 text-sm font-semibold ${statusTone}`}>{statusLabel}</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.26)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-400/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">AI warning</p>
                <h3 className="mt-1 text-lg font-black text-foreground">Anomaly monitor</h3>
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${hasLiveVitals ? alerts.length > 0 ? "border border-danger/25 bg-danger/10 text-danger" : "border border-success/25 bg-success/10 text-success" : "border border-white/10 bg-white/5 text-muted-foreground"}`}>
                {hasLiveVitals ? `${alerts.length} ${alerts.length === 1 ? "warning" : "warnings"}` : "Waiting"}
              </div>
            </div>

            <div className="relative z-10 mt-3 space-y-2">
              {hasLiveVitals ? (
                alerts.length > 0 ? (
                  alerts.slice(0, 3).map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className={`flex items-start gap-3 rounded-2xl border p-3 ${item.severity === "critical" ? "border-danger/20 bg-danger/10" : "border-warning/20 bg-warning/10"}`}
                    >
                      <div className={`rounded-xl p-2 ${item.severity === "critical" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className={`mt-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${item.severity === "critical" ? "border-danger/25 text-danger" : "border-warning/25 text-warning"}`}>
                        {item.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-success/15 bg-success/10 p-3">
                    <div className="rounded-xl bg-success/15 p-2 text-success">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">No issues detected</p>
                      <p className="text-xs text-muted-foreground">Live vitals are currently within the normal range.</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                  <div className="rounded-xl bg-white/5 p-2 text-muted-foreground">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Waiting for live telemetry</p>
                    <p className="text-xs text-muted-foreground">Warnings will appear here once data starts streaming.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </aside>
      </main>
    </div>
  )
}