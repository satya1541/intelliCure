import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"
import { Activity, ArrowLeft, Camera, Clock3, Droplets, Heart, RefreshCw, Sparkles, Thermometer, Wind, Wifi, TriangleAlert, Percent, ShieldAlert, Brain, Zap, HeartOff } from "lucide-react"
import IcuCallControlPanel from "./IcuCallControlPanel"

const ECG_PATTERN = [0, 0, 0, 0.35, -0.45, 0.1, 0.2, -0.7, 0.5, 0, 1.2, -2.6, 7.8, -9.8, 4.2, 0.1, 0, 0, 0.15, 0, 0, 0]

const DEFAULT_WAVEFORM_LENGTH = 96
const ROOMS = [
  { id: "room-1", name: "Room 1", url: "https://vid1.clinohealthinnovation.com/pi-patient-01" },
  { id: "room-2", name: "Room 2", url: "https://vid1.clinohealthinnovation.com/pi-patient-02" },
]

function formatPatientName(name: string): string {
  if (!name) return ""
  const upper = name.trim().toUpperCase()
  if (upper === "MISHRA ROHIT" || upper === "ROHIT MISHRA") return "ROHIT MISHRA"
  if (upper === "PANDA RAHUL" || upper === "RAHUL PANDA") return "RAHUL PANDA"
  if (upper === "DAS RANJAN" || upper === "RANJAN DAS") return "RANJAN DAS"
  return name
}

const PATIENTS = [
  { mrn: "PT001", name: "ROHIT MISHRA", age: "42", bed: "Bed 04", shift: "Post-round review" },
  { mrn: "PT002", name: "RAHUL PANDA", age: "35", bed: "Bed 07", shift: "Active watch" },
  { mrn: "PT003", name: "RANJAN DAS", age: "58", bed: "Bed 11", shift: "Step-down review" },
]

type WaveformDefinition = {
  key: string
  label: string
  subtitle: string
  tone: string
  kind: "ecg" | "resp" | "pleth"
  featured?: boolean
}

const WAVEFORM_DEFINITIONS: WaveformDefinition[] = [
  { key: "ECG_II", label: "ECG II", subtitle: "Primary rhythm", tone: "text-emerald-300", kind: "ecg", featured: true },
  { key: "ECG_I", label: "ECG I", subtitle: "Lateral lead", tone: "text-cyan-300", kind: "ecg" },
  { key: "ECG_III", label: "ECG III", subtitle: "Inferior lead", tone: "text-violet-300", kind: "ecg" },
  { key: "ECG_AVR", label: "ECG aVR", subtitle: "Augmented lead", tone: "text-fuchsia-300", kind: "ecg" },
  { key: "ECG_AVL", label: "ECG aVL", subtitle: "Augmented lead", tone: "text-amber-300", kind: "ecg" },
  { key: "ECG_AVF", label: "ECG aVF", subtitle: "Augmented lead", tone: "text-sky-300", kind: "ecg" },
  { key: "RESP", label: "RESP", subtitle: "Respiratory trace", tone: "text-lime-300", kind: "resp" },
  { key: "SPO2_PLETH", label: "SpO2 Pleth", subtitle: "Pulse pleth", tone: "text-rose-300", kind: "pleth" },
  { key: "ECG_V", label: "ECG V", subtitle: "Precordial lead", tone: "text-teal-300", kind: "ecg" },
]

type DataMode = "real" | "dummy"

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
  pi?: number
  pr?: number
  pvcs?: number
  ews?: number
  gcs?: number
  gcsEye?: number
  gcsVerbal?: number
  gcsMotor?: number
}

type AlarmPacket = {
  alarmType: string
  alarmId: number
  alarmText: string
  alarmLevel: number
  observationTime: string
}

type IncomingVital = {
  parameterId?: number | string
  parameterName?: string
  value?: number
  unit?: string
  moduleId?: number
  moduleName?: string
}

type WaveformPacket = {
  series: number[]
  sampleRate: number
  channel: number
  patientMrn?: string
}

type WarningEntry = {
  title: string
  detail: string
  severity: Severity
}

type DummyICUContext = {
  patientName: string
  patientAge: string
  bedLabel: string
  shiftLabel: string
  cameraBedLabel: string
  statusLabel: string
  statusTone: string
  waveformSummaryLabel: string
  waveformSummaryTone: string
  liveMonitoringLabel: string
  clinicalReadoutLabel: string
  warningPillLabel: string
  warningPillTone: string
  warnings: WarningEntry[]
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
  const normalized = name.trim().replace(/[\s_-]+/g, "_").toUpperCase()
  if (normalized.includes("PLETH") || normalized.includes("SPO2")) {
    return "SPO2_PLETH"
  }
  if (normalized.includes("RESP")) {
    return "RESP"
  }
  return normalized
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash || 1
}

function seededNoise(seed: number, index: number, frame: number) {
  const raw = Math.sin(seed * 12.9898 + index * 78.233 + frame * 37.719) * 43758.5453
  return raw - Math.floor(raw)
}

function fract(value: number) {
  return value - Math.floor(value)
}

function pseudoRandom(seed: number, value: number) {
  return fract(Math.sin(seed * 12.9898 + value * 78.233) * 43758.5453)
}

function smoothNoise(seed: number, value: number) {
  const lower = Math.floor(value)
  const upper = lower + 1
  const ratio = value - lower
  const eased = ratio * ratio * (3 - 2 * ratio)
  const start = pseudoRandom(seed, lower)
  const end = pseudoRandom(seed, upper)

  return start + (end - start) * eased
}

function layeredNoise(seed: number, value: number, octaves = 3) {
  let amplitude = 0.5
  let frequency = 1
  let total = 0
  let normalization = 0

  for (let octave = 0; octave < octaves; octave++) {
    total += smoothNoise(seed + octave * 17, value * frequency) * amplitude
    normalization += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return normalization > 0 ? total / normalization : 0.5
}

function buildTrendSeries(base: number, variation: number, frame: number, seed: number, length = 28) {
  let level = base + (layeredNoise(seed, frame * 0.15) - 0.5) * variation * 0.7

  return Array.from({ length }, (_, index) => {
    const time = frame * 0.15 + index * 0.35
    const drift = (layeredNoise(seed + 3, time * 0.7) - 0.5) * variation * 0.6
    const wobble = (layeredNoise(seed + 11, time * 1.6) - 0.5) * variation * 0.28
    const twitch = layeredNoise(seed + 19, frame * 0.2 + index * 0.12)
    const event = twitch > 0.92 ? (twitch - 0.92) * variation * 2.4 : 0

    level += (layeredNoise(seed + 27, time) - 0.5) * variation * 0.12
    level += (layeredNoise(seed + 33, time * 0.5) - 0.5) * variation * 0.08

    const value = clamp(level + drift + wobble + event, base - variation * 2.2, base + variation * 2.2)
    level = clamp(level, base - variation * 1.6, base + variation * 1.6)

    return Number(value.toFixed(1))
  })
}

function decomposeGCS(total: number) {
  const gcs = Math.min(Math.max(total, 3), 15)
  if (gcs === 15) return { gcsEye: 4, gcsVerbal: 5, gcsMotor: 6 }
  if (gcs === 14) return { gcsEye: 3, gcsVerbal: 5, gcsMotor: 6 }
  if (gcs === 13) return { gcsEye: 3, gcsVerbal: 4, gcsMotor: 6 }
  if (gcs === 12) return { gcsEye: 3, gcsVerbal: 4, gcsMotor: 5 }
  if (gcs === 11) return { gcsEye: 3, gcsVerbal: 3, gcsMotor: 5 }
  if (gcs === 10) return { gcsEye: 2, gcsVerbal: 3, gcsMotor: 5 }
  if (gcs === 9)  return { gcsEye: 2, gcsVerbal: 2, gcsMotor: 5 }
  if (gcs === 8)  return { gcsEye: 2, gcsVerbal: 2, gcsMotor: 4 }
  if (gcs === 7)  return { gcsEye: 1, gcsVerbal: 2, gcsMotor: 4 }
  if (gcs === 6)  return { gcsEye: 1, gcsVerbal: 1, gcsMotor: 4 }
  if (gcs === 5)  return { gcsEye: 1, gcsVerbal: 1, gcsMotor: 3 }
  if (gcs === 4)  return { gcsEye: 1, gcsVerbal: 1, gcsMotor: 2 }
  return { gcsEye: 1, gcsVerbal: 1, gcsMotor: 1 }
}

function buildDummyVitals(frame: number, seed: number, patientAge?: string | number): LiveVitalsState {
  const ageValue = Number(patientAge)
  const age = Number.isFinite(ageValue) ? clamp(ageValue, 16, 92) : 44
  const ageTilt = Math.max(0, age - 40)
  const time = frame * 0.18
  const stress = layeredNoise(seed + 5, time * 0.55)
  const recovery = layeredNoise(seed + 9, time * 0.31)
  const wobble = layeredNoise(seed + 13, time * 0.92)
  const oxygenDip = Math.max(0, layeredNoise(seed + 17, time * 1.7) - 0.93)

  const oxygen = clamp(98.9 - ageTilt * 0.03 - stress * 0.7 - oxygenDip * 3.5 + (recovery - 0.5) * 0.6, 93.6, 99.8)
  const heartRate = clamp(68 + ageTilt * 0.18 + stress * 18 + wobble * 6 + (recovery - 0.5) * 6, 58, 108)
  const respiratoryRate = clamp(14 + ageTilt * 0.04 + stress * 4.2 + wobble * 1.4, 12, 26)
  const temperature = clamp(36.5 + (recovery - 0.5) * 0.45 + layeredNoise(seed + 23, time * 0.23) * 0.18, 36.2, 37.8)
  const systolic = clamp(110 + ageTilt * 0.42 + stress * 15 + layeredNoise(seed + 29, time * 0.41) * 7, 98, 142)
  const diastolic = clamp(68 + ageTilt * 0.22 + stress * 9 + layeredNoise(seed + 31, time * 0.44) * 4, 58, 96)

  const pi = clamp(4.5 + (recovery - 0.5) * 1.5 + wobble * 0.5, 1.2, 9.8)
  const pr = clamp(heartRate - 2 + wobble * 1.5, 50, 120)
  const pvcs = stress > 0.85 ? Math.round(stress * 3) : 0
  const ews = stress > 0.8 ? Math.round(stress * 4) : 0
  const gcs = clamp(Math.round(15 - stress * 3), 3, 15)
  const { gcsEye, gcsVerbal, gcsMotor } = decomposeGCS(gcs)

  return {
    oxygen: Number(oxygen.toFixed(1)),
    heartRate: Math.round(heartRate),
    respiratoryRate: Math.round(respiratoryRate),
    temperature: Number(temperature.toFixed(1)),
    systolic: Math.round(systolic),
    diastolic: Math.round(diastolic),
    pi: Number(pi.toFixed(2)),
    pr: Math.round(pr),
    pvcs,
    ews,
    gcs,
    gcsEye,
    gcsVerbal,
    gcsMotor,
  }
}

function buildDummyWaveformPacket(definition: WaveformDefinition, frame: number, seed: number, vitals: LiveVitalsState): WaveformPacket {
  const waveformSeed = hashString(`${seed}:${definition.key}`)

  if (definition.kind === "ecg") {
    const leadConfig: Record<string, { polarity: number; scale: number; baseline: number; phase: number }> = {
      ECG_I: { polarity: 0.86, scale: 0.82, baseline: 26, phase: 3 },
      ECG_II: { polarity: 1, scale: 1, baseline: 32, phase: 0 },
      ECG_III: { polarity: -0.76, scale: 0.76, baseline: 16, phase: 6 },
      ECG_AVR: { polarity: -1, scale: 0.7, baseline: -14, phase: 1 },
      ECG_AVL: { polarity: 0.66, scale: 0.62, baseline: 22, phase: 4 },
      ECG_AVF: { polarity: 0.92, scale: 0.84, baseline: 28, phase: 2 },
      ECG_V: { polarity: 1.06, scale: 1.08, baseline: 36, phase: 5 },
    }

    const config = leadConfig[definition.key] ?? leadConfig.ECG_II
    const heartRate = clamp(vitals.heartRate, 54, 108)
    const rrInterval = 60 / heartRate
    const sampleRate = 256
    const windowSeconds = 300 / sampleRate
    const timeOffset = frame * 0.08 + config.phase * 0.012
    const beatCenters: Array<{ center: number; strength: number }> = []
    let beatCenter = -rrInterval + (timeOffset % rrInterval) - rrInterval * 0.2

    while (beatCenter < windowSeconds + rrInterval) {
      const beatIndex = beatCenters.length
      const beatNoise = layeredNoise(waveformSeed + 7, frame * 0.28 + beatIndex * 0.52)
      const intervalScale = 1 + (beatNoise - 0.5) * 0.16
      const strength = 1 + (layeredNoise(waveformSeed + 13, frame * 0.22 + beatIndex * 0.41) - 0.5) * 0.24

      beatCenter += rrInterval * intervalScale
      beatCenters.push({ center: beatCenter, strength })
    }

    const series = Array.from({ length: 300 }, (_, index) => {
      const t = index / sampleRate + timeOffset
      const baselineWander = (layeredNoise(waveformSeed + 17, frame * 0.2 + index * 0.03) - 0.5) * 6
      const microNoise = (layeredNoise(waveformSeed + 19, frame * 0.4 + index * 0.07) - 0.5) * 3
      const qrsNoise = (layeredNoise(waveformSeed + 23, frame * 0.2 + index * 0.09) - 0.5) * 1.5
      const nearbyBeats = beatCenters.filter((beat) => Math.abs(t - beat.center) < rrInterval * 1.1)

      const signal = nearbyBeats.reduce((value, beat, beatIndex) => {
        const dt = t - beat.center
        const beatShapeSeed = waveformSeed + beatIndex * 31
        const p = Math.exp(-Math.pow((dt + rrInterval * 0.22) / (rrInterval * 0.055), 2)) * 4.8
        const q = Math.exp(-Math.pow((dt + rrInterval * 0.028) / (rrInterval * 0.018), 2)) * -6.5
        const r = Math.exp(-Math.pow(dt / (rrInterval * 0.012), 2)) * 38 * beat.strength
        const s = Math.exp(-Math.pow((dt - rrInterval * 0.02) / (rrInterval * 0.018), 2)) * -11
        const tWave = Math.exp(-Math.pow((dt - rrInterval * 0.26) / (rrInterval * 0.08), 2)) * 9.5
        const leadNoise = (layeredNoise(beatShapeSeed, frame * 0.15 + beatIndex * 0.45) - 0.5) * 2.5

        return value + (p + q + r + s + tWave) * config.scale * config.polarity + qrsNoise * 2 + leadNoise
      }, config.baseline + baselineWander + microNoise)

      return Math.round(signal)
    })

    return {
      series,
      sampleRate,
      channel: 1,
      patientMrn: `SIM-${definition.key}-${waveformSeed % 1000}`,
    }
  }

  if (definition.kind === "resp") {
    const series = Array.from({ length: 300 }, (_, index) => {
      const t = index / 100 + frame * 0.1
      const breathRate = clamp(vitals.respiratoryRate, 11, 26)
      const breathInterval = 60 / breathRate
      const phase = ((t + waveformSeed * 0.001) % breathInterval) / breathInterval
      const inhale = Math.sin(Math.PI * phase)
      const exhale = Math.sin(Math.PI * Math.max(0, phase - 0.12) / 0.88)
      const asymmetry = 0.7 + layeredNoise(waveformSeed + 5, frame * 0.14 + index * 0.04) * 0.3
      const drift = (layeredNoise(waveformSeed + 11, frame * 0.4 + index * 0.06) - 0.5) * 300
      const ripple = (layeredNoise(waveformSeed + 17, frame * 0.7 + index * 0.2) - 0.5) * 90
      const noise = (layeredNoise(waveformSeed + 23, frame * 0.28 + index * 0.08) - 0.5) * 120
      const wave = inhale * 920 * asymmetry + exhale * 440
      return Math.round(-5200 + wave + drift + ripple + noise)
    })

    return {
      series,
      sampleRate: 100,
      channel: 1,
      patientMrn: `SIM-${definition.key}-${waveformSeed % 1000}`,
    }
  }

  const series = Array.from({ length: 300 }, (_, index) => {
    const heartRate = clamp(vitals.heartRate, 54, 108)
    const pulseInterval = 60 / heartRate
    const t = index / 100 + frame * 0.1
    const phase = ((t + waveformSeed * 0.001) % pulseInterval) / pulseInterval
    const rise = Math.pow(Math.max(0, Math.sin(Math.PI * phase)), 2.8)
    const notch = Math.exp(-Math.pow((phase - 0.68) / 0.08, 2)) * -0.16
    const rebound = Math.exp(-Math.pow((phase - 0.88) / 0.09, 2)) * 0.12
    const drift = (layeredNoise(waveformSeed + 29, frame * 0.22 + index * 0.05) - 0.5) * 4
    const noise = (layeredNoise(waveformSeed + 31, frame * 0.28 + index * 0.11) - 0.5) * 3
    return Math.round(86 + rise * 72 + notch * 22 + rebound * 18 + drift + noise)
  })

  return {
    series,
    sampleRate: 100,
    channel: 1,
    patientMrn: `SIM-${definition.key}-${waveformSeed % 1000}`,
  }
}

function buildDummyWaveformMap(frame: number, seed: number, vitals: LiveVitalsState) {
  return Object.fromEntries(WAVEFORM_DEFINITIONS.map((definition) => [definition.key, buildDummyWaveformPacket(definition, frame, seed, vitals)])) as Record<string, WaveformPacket>
}

function getVitalSeverity(vitals: LiveVitalsState): Severity {
  return vitals.oxygen < 92 || vitals.heartRate > 115 || vitals.respiratoryRate > 25 || vitals.temperature > 38.0 || vitals.systolic > 150
    ? "critical"
    : vitals.oxygen < 94 || vitals.heartRate > 100 || vitals.respiratoryRate > 22 || vitals.temperature > 37.7
      ? "watch"
      : "stable"
}

function buildVitalsWarnings(vitals: LiveVitalsState): WarningEntry[] {
  const severity = getVitalSeverity(vitals)

  return [
    vitals.oxygen < 94 && { title: "SpO2 drift detected", detail: `Oxygen holding at ${vitals.oxygen}%`, severity: "critical" as const },
    vitals.heartRate > 108 && { title: "Mild tachycardia", detail: `Heart rate is ${vitals.heartRate} bpm`, severity: "watch" as const },
    vitals.respiratoryRate > 24 && { title: "Respiratory rate elevated", detail: `Breathing trend is ${vitals.respiratoryRate} bpm`, severity: "watch" as const },
    vitals.temperature > 37.7 && { title: "Temperature trending up", detail: `Temperature is ${vitals.temperature}°C`, severity: "watch" as const },
    vitals.systolic > 145 && { title: "Blood pressure elevation", detail: `Systolic pressure is ${vitals.systolic} mmHg`, severity: "critical" as const },
    severity !== "stable" && { title: "Rhythm variation under review", detail: severity === "critical" ? "ECG pattern is showing intermittent spikes." : "Rhythm is slightly irregular but consistent.", severity },
  ].filter(Boolean) as WarningEntry[]
}

function buildDummyPatientContext(seed: number, vitals?: LiveVitalsState): DummyICUContext {
  const firstNames = ["Aarav", "Aanya", "Ishaan", "Mira", "Kabir", "Diya", "Arjun", "Sana", "Rohan", "Naina"]
  const lastNames = ["Sharma", "Patel", "Reddy", "Verma", "Iyer", "Nair", "Gupta", "Singh", "Mehta", "Chopra"]
  const shiftLabels = ["Post-round review", "Active observation", "Night observation", "Step-down review", "Senior handoff"]
  const severity = vitals ? getVitalSeverity(vitals) : "stable"
  const warnings = vitals ? buildVitalsWarnings(vitals) : []
  const firstName = firstNames[Math.floor(pseudoRandom(seed + 3, 0.17) * firstNames.length) % firstNames.length]
  const lastName = lastNames[Math.floor(pseudoRandom(seed + 7, 0.83) * lastNames.length) % lastNames.length]
  const age = String(clamp(Math.round(28 + pseudoRandom(seed + 11, 0.42) * 42), 24, 78))
  const bedNumber = String(3 + Math.floor(pseudoRandom(seed + 13, 0.61) * 15)).padStart(2, "0")
  const bedLabel = `Bed ${bedNumber}`
  const shiftLabel = severity === "critical" ? "Senior review" : severity === "watch" ? "Active observation" : shiftLabels[Math.floor(pseudoRandom(seed + 17, 0.29) * shiftLabels.length) % shiftLabels.length]
  const statusLabel = severity === "critical" ? "Critical watch" : severity === "watch" ? "Active watch" : "Stable monitor"
  const statusTone = severity === "critical" ? "text-danger" : severity === "watch" ? "text-warning" : "text-success"
  const liveMonitoringLabel = severity === "critical" ? "Senior review requested" : severity === "watch" ? "Vitals under observation" : "SpO2 and ECG sync active"
  const clinicalReadoutLabel = warnings.length > 0 ? warnings[0].title : "Telemetry stable"
  const warningPillLabel = warnings.length > 0 ? `${warnings.length} ${warnings.length === 1 ? "warning" : "warnings"}` : "No issues detected"
  const warningPillTone = warnings.length > 0 ? (severity === "critical" ? "border border-danger/25 bg-danger/10 text-danger" : "border border-warning/25 bg-warning/10 text-warning") : "border border-success/25 bg-success/10 text-success"

  return {
    patientName: `${firstName} ${lastName}`,
    patientAge: age,
    bedLabel,
    shiftLabel,
    cameraBedLabel: bedLabel,
    statusLabel,
    statusTone,
    waveformSummaryLabel: statusLabel,
    waveformSummaryTone: statusTone,
    liveMonitoringLabel,
    clinicalReadoutLabel,
    warningPillLabel,
    warningPillTone,
    warnings,
  }
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
  children,
}: {
  label: string
  value: string
  unit: string
  tone: string
  series: number[]
  icon: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card relative overflow-hidden rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 text-[9px] min-[1400px]:text-[9.5px] font-black uppercase tracking-widest text-muted-foreground">
          <span className="flex shrink-0 h-6 w-6 items-center justify-center rounded-lg bg-white/5 border border-white/5 text-foreground/90">{icon}</span>
          <span className="truncate leading-tight">{label}</span>
        </div>
        <div className="mt-2.5 flex items-end gap-1.5">
          <span className={`text-2xl font-black tracking-tight ${tone}`}>{value}</span>
          <span className="pb-0.5 text-[8.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{unit}</span>
        </div>
      </div>

      <div className="relative z-10 mt-3 h-11 rounded-xl border border-white/5 bg-black/20 p-1.5 text-current">
        {children ? children : <Sparkline values={series} tone={tone} />}
      </div>
    </motion.div>
  )
}

function WaveformCard({
  definition,
  packet,
  mode,
}: {
  definition: WaveformDefinition
  packet?: WaveformPacket
  mode: DataMode
}) {
  const series = packet?.series ?? createFlatSeries()
  const geometry = buildWaveformGeometry(series, 300, 100)
  const filterId = `waveform-glow-${definition.key.toLowerCase()}`
  const isLive = Boolean(packet)
  const isSimulation = mode === "dummy"
  const isFlat = isLive && series.length > 1 && series.every((value) => value === series[0])
  const descriptor = !isLive ? "Waiting for stream" : isSimulation ? "Synthetic stream" : isFlat ? "Flat baseline" : "Live stream"
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
          {isLive ? (isSimulation ? "Synthetic trace" : isFlat ? "Flat trace" : "Live trace") : "Awaiting stream"}
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
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[\s_-]+/g, "")

  return normalize(String(entry.parameterId ?? "")) === normalize(String(identifier)) || normalize(String(entry.parameterName ?? "")) === normalize(String(identifier))
}

function coerceVitalNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function extractVitalsUpdate(payload: any): (Partial<LiveVitalsState> & { patientMrn?: string }) | null {
  const vitalsArray = payload?.data?.vitals || payload?.vitals
  const dashboardVitals = payload?.data?.dashboardVitals || payload?.dashboardVitals
  const patientMrn = payload?.data?.patientMrn || payload?.patientMrn

  const collectFromArray = (readings: IncomingVital[] | undefined) => {
    if (!Array.isArray(readings)) {
      return null
    }

    const findParam = (identifiers: Array<number | string>) =>
      readings.find((entry) => identifiers.some((identifier) => isSameVitalIdentifier(entry, identifier)))

    const readParamValue = (identifiers: Array<number | string>) => coerceVitalNumber(findParam(identifiers)?.value)

    const nextVitals: Partial<LiveVitalsState> & { patientMrn?: string } = {}

    if (patientMrn) {
      nextVitals.patientMrn = patientMrn
    }

    const spo2 = readParamValue([251, "SpO2", "SPO2", "Oxygen", "oxygen", "oxygenSaturation"])
    const heartRate = readParamValue([201, "HR", "Heart Rate", "heartRate", "heart_rate", "heartbeat", "heartBeat"])
    // Respiratory Rate can come from RESP module (parameterId 401) or SPO2 module (parameterId 258)
    // Prefer RESP module value if valid, fall back to SPO2 module value
    const rrFromResp = readings.find((entry) => {
      const idMatch = isSameVitalIdentifier(entry, 401) || (isSameVitalIdentifier(entry, "RR") && String(entry.moduleName ?? "").toUpperCase() === "RESP")
      return idMatch
    })
    const rrFromSpo2 = readings.find((entry) => {
      const idMatch = isSameVitalIdentifier(entry, 258) || (isSameVitalIdentifier(entry, "RR") && String(entry.moduleName ?? "").toUpperCase() === "SPO2")
      return idMatch
    })
    const rrRespVal = coerceVitalNumber(rrFromResp?.value)
    const rrSpo2Val = coerceVitalNumber(rrFromSpo2?.value)
    // Debug: trace respiratory rate extraction
    console.log("[RR Debug]", {
      rrFromResp: rrFromResp ? { parameterId: rrFromResp.parameterId, parameterName: rrFromResp.parameterName, moduleName: rrFromResp.moduleName, value: rrFromResp.value } : null,
      rrFromSpo2: rrFromSpo2 ? { parameterId: rrFromSpo2.parameterId, parameterName: rrFromSpo2.parameterName, moduleName: rrFromSpo2.moduleName, value: rrFromSpo2.value } : null,
      rrRespVal,
      rrSpo2Val,
    })
    // Use RESP module value if valid (>0, not -1), else fall back to SPO2 module value
    const respiratoryRate = (typeof rrRespVal === "number" && rrRespVal > 0 && rrRespVal !== -1)
      ? rrRespVal
      : (typeof rrSpo2Val === "number" && rrSpo2Val > 0 && rrSpo2Val !== -1)
        ? rrSpo2Val
        : readParamValue(["RR", "respiratoryRate", "respiratory_rate", "respRate", "resp_rate"])
    console.log("[RR Debug] Final respiratoryRate:", respiratoryRate)
    const temperature = readParamValue([1051, 1052, "T1", "T2", "Temperature", "temperature"])
    const systolic = readParamValue([351, "NIBP-S", "Systolic", "systolic"])
    const diastolic = readParamValue([352, "NIBP-D", "Diastolic", "diastolic"])

    // Additional parameters
    const pi = readParamValue([252, "PI", "Perfusion Index", "perfusionIndex"])
    const pr = readParamValue([259, "PR", "Pulse Rate", "pulseRate"])
    const pvcs = readParamValue([219, "PVCs", "PVCs/min", "pvcs"])
    const ews = readParamValue([2051, "EWS-Total", "EWS Total Score"])
    const gcs = readParamValue([2101, "GCS-Total", "GCS Total Score"])
    const gcsEye = readParamValue([2102, "GCS-Eye", "GCS Eye Opening"])
    const gcsVerbal = readParamValue([2103, "GCS-Verbal", "GCS Verbal Response"])
    const gcsMotor = readParamValue([2104, "GCS-Motor", "GCS Motor Response"])

    if (typeof spo2 === "number" && spo2 !== -1) nextVitals.oxygen = spo2
    if (typeof heartRate === "number" && heartRate !== -1) nextVitals.heartRate = heartRate
    if (typeof respiratoryRate === "number" && respiratoryRate !== -1) nextVitals.respiratoryRate = respiratoryRate
    if (typeof temperature === "number" && temperature !== -1) nextVitals.temperature = temperature
    if (typeof systolic === "number" && systolic !== -1) nextVitals.systolic = systolic
    if (typeof diastolic === "number" && diastolic !== -1) nextVitals.diastolic = diastolic

    if (typeof pi === "number" && pi !== -1) nextVitals.pi = pi
    if (typeof pr === "number" && pr !== -1) nextVitals.pr = pr
    if (typeof pvcs === "number" && pvcs !== -1) nextVitals.pvcs = pvcs
    if (typeof ews === "number" && ews !== -1) nextVitals.ews = ews
    if (typeof gcs === "number" && gcs !== -1) {
      nextVitals.gcs = gcs
      const decomposed = decomposeGCS(gcs)
      nextVitals.gcsEye = typeof gcsEye === "number" && gcsEye !== -1 ? gcsEye : decomposed.gcsEye
      nextVitals.gcsVerbal = typeof gcsVerbal === "number" && gcsVerbal !== -1 ? gcsVerbal : decomposed.gcsVerbal
      nextVitals.gcsMotor = typeof gcsMotor === "number" && gcsMotor !== -1 ? gcsMotor : decomposed.gcsMotor
    } else {
      if (typeof gcsEye === "number" && gcsEye !== -1) nextVitals.gcsEye = gcsEye
      if (typeof gcsVerbal === "number" && gcsVerbal !== -1) nextVitals.gcsVerbal = gcsVerbal
      if (typeof gcsMotor === "number" && gcsMotor !== -1) nextVitals.gcsMotor = gcsMotor
    }

    return Object.keys(nextVitals).length > 0 ? nextVitals : null
  }

  const arrayUpdate = collectFromArray(vitalsArray)
  if (arrayUpdate) {
    return arrayUpdate
  }

  if (!dashboardVitals) {
    return null
  }

  const nextVitals: Partial<LiveVitalsState> & { patientMrn?: string } = {}
  if (patientMrn) {
    nextVitals.patientMrn = patientMrn
  }

  const dashboardSpo2 = coerceVitalNumber(dashboardVitals.spo2?.value ?? dashboardVitals.spO2?.value ?? dashboardVitals.spo2 ?? dashboardVitals.oxygen?.value ?? dashboardVitals.oxygen)
  const dashboardHeartRate = coerceVitalNumber(dashboardVitals.heartRate?.value ?? dashboardVitals.heartBeat?.value ?? dashboardVitals.hr?.value ?? dashboardVitals.pulseRate?.value ?? dashboardVitals.pulse?.value ?? dashboardVitals.heartRate ?? dashboardVitals.heartBeat ?? dashboardVitals.hr ?? dashboardVitals.pulseRate ?? dashboardVitals.pulse)
  const dashboardRespiratoryRate = coerceVitalNumber(dashboardVitals.respiratoryRate?.value ?? dashboardVitals.respRate?.value ?? dashboardVitals.respirationRate?.value ?? dashboardVitals.respiratoryRate ?? dashboardVitals.respRate ?? dashboardVitals.respirationRate)
  const dashboardTemperature = coerceVitalNumber(dashboardVitals.temperature?.value ?? dashboardVitals.temperature)
  const dashboardSystolic = coerceVitalNumber(dashboardVitals.bloodPressure?.sys ?? dashboardVitals.systolic?.value ?? dashboardVitals.systolic)
  const dashboardDiastolic = coerceVitalNumber(dashboardVitals.bloodPressure?.dia ?? dashboardVitals.diastolic?.value ?? dashboardVitals.diastolic)

  if (typeof dashboardSpo2 === "number" && dashboardSpo2 > 0) nextVitals.oxygen = dashboardSpo2
  if (typeof dashboardHeartRate === "number" && dashboardHeartRate > 0) nextVitals.heartRate = dashboardHeartRate
  if (typeof dashboardRespiratoryRate === "number" && dashboardRespiratoryRate > 0) nextVitals.respiratoryRate = dashboardRespiratoryRate
  if (typeof dashboardTemperature === "number" && dashboardTemperature > 0) nextVitals.temperature = dashboardTemperature
  if (typeof dashboardSystolic === "number" && dashboardSystolic > 0) nextVitals.systolic = dashboardSystolic
  if (typeof dashboardDiastolic === "number" && dashboardDiastolic > 0) nextVitals.diastolic = dashboardDiastolic

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
    patientMrn: waveformPayload?.patientMrn || payload?.patientMrn || payload?.data?.patientMrn || waveformPayload?.mrn || payload?.mrn || payload?.data?.mrn,
  }
}

function useNetworkSpeed() {
  const [speed, setSpeed] = useState({ downlink: "...", rtt: "...", isFallback: false });

  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (!connection) {
      // Mock for browsers that don't support it so it still feels alive
      let baseMock = 12.5;
      const intId = window.setInterval(() => {
        const jitter = (Math.random() - 0.5) * 1.5;
        setSpeed({ downlink: Math.max(1, baseMock + jitter).toFixed(2), rtt: Math.floor(40 + Math.random() * 15).toString(), isFallback: true })
      }, 1200);
      return () => window.clearInterval(intId);
    }

    let baseDownlink = connection.downlink || 8.5;
    let baseRtt = connection.rtt || 45;

    const updateSpeed = () => {
      baseDownlink = connection.downlink || baseDownlink;
      baseRtt = connection.rtt || baseRtt;
    }

    connection.addEventListener("change", updateSpeed);
    setSpeed({ downlink: baseDownlink.toFixed(2), rtt: baseRtt.toString(), isFallback: false });

    // Provide a realtime jitter to reflect constant polling
    const intervalId = window.setInterval(() => {
      const jitterD = (Math.random() - 0.5) * 0.08 * baseDownlink;
      const jitterR = (Math.random() - 0.5) * 0.1 * baseRtt;

      setSpeed({
        downlink: Math.max(0.1, baseDownlink + jitterD).toFixed(2),
        rtt: Math.max(1, Math.round(baseRtt + jitterR)).toString(),
        isFallback: false
      });
    }, 1200);

    return () => {
      connection.removeEventListener("change", updateSpeed)
      window.clearInterval(intervalId);
    }
  }, [])

  return speed
}

function NetworkTracker() {
  const { downlink, rtt, isFallback } = useNetworkSpeed()

  const speedVal = typeof downlink === "string" && downlink !== "..." ? parseFloat(downlink) : 0;

  const getTone = () => {
    if (speedVal >= 5 || downlink === "...") return "bg-emerald-500 text-emerald-400"
    if (speedVal >= 2) return "bg-yellow-500 text-yellow-400"
    return "bg-red-500 text-red-400"
  }

  const toneClass = getTone()

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-2 py-1 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-colors duration-300">
      <Wifi className={`h-3 w-3 ${toneClass.split(' ')[1]}`} />
      <div className="flex items-center gap-1 min-w-[62px]">
        <span className="text-[9px] leading-none font-black uppercase tracking-widest text-white/95 font-mono">
          {downlink}{isFallback ? "*" : ""} Mbps
        </span>
        <span className="text-[9px] leading-none text-white/30">•</span>
        <span className={`text-[9px] leading-none font-bold tracking-widest ${toneClass.split(' ')[1]}`}>
          {rtt}ms
        </span>
      </div>
      <span className={`h-1.5 w-1.5 rounded-full ${toneClass.split(' ')[0]} animate-pulse ml-0.5`} />
    </div>
  )
}

function BrowserWarningModal() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const hasSeenWarning = localStorage.getItem("intelli-icu-browser-warning")
    if (hasSeenWarning) return

    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox")
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    const checkBrave = async () => {
      if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === "function") {
        return await (navigator as any).brave.isBrave()
      }
      return false
    }

    checkBrave().then((isBrave) => {
      if (isFirefox || isSafari || isBrave) {
        setShowWarning(true)
      }
    })
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("intelli-icu-browser-warning", "true")
    setShowWarning(false)
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-yellow-500/30 bg-[#0a0a0a] p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
            <TriangleAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Browser Compatibility</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              For optimal performance and accurate real-time telemetry, we strongly recommend using <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
              <br /><br />
              Features like advanced network bandwidth tracking may be restricted or blocked by privacy shields in Brave, Firefox, or Safari.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDismiss}
                className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 active:bg-white/30"
              >
                I understand, continue
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function IntelliICUPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeContext = getRouteContext(location)
  const { downlink } = useNetworkSpeed()

  const currentSpeed = typeof downlink === "string" && downlink !== "..." ? parseFloat(downlink) : 10;
  const isNetworkPoor = currentSpeed < 3;

  const ambRegNo = routeContext.ambRegNo

  const [patients, setPatients] = useState(PATIENTS)

  const getMrnFromHash = () => {
    const hash = window.location.hash
    if (hash === "#1") return "PT001"
    if (hash === "#2") return "PT002"
    if (hash === "#3") return "PT003"
    return "PT001"
  }

  const [selectedPatientMrn, setSelectedPatientMrn] = useState<string>(getMrnFromHash)

  useEffect(() => {
    const hashValue = selectedPatientMrn === "PT001" ? "1" : selectedPatientMrn === "PT002" ? "2" : "3"
    if (window.location.hash !== `#${hashValue}`) {
      window.location.hash = hashValue
    }
  }, [selectedPatientMrn])

  useEffect(() => {
    const handleHashChange = () => {
      setSelectedPatientMrn(getMrnFromHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  const currentPatient = patients.find(p => p.mrn === selectedPatientMrn) || patients[0]
  const simulationSeed = hashString([currentPatient.name, currentPatient.age, currentPatient.bed, selectedPatientMrn].filter(Boolean).join("|") || "intelli-icu")

  const [patientsVitals, setPatientsVitals] = useState<Record<string, LiveVitalsState>>({
    "PT001": { oxygen: 98, heartRate: 0, respiratoryRate: 20, temperature: 0, systolic: 0, diastolic: 0, pi: 4.73, pr: 83 },
    "PT002": { oxygen: 99, heartRate: 0, respiratoryRate: 0, temperature: 0, systolic: 0, diastolic: 0, pi: 7.59, pr: 83 },
    "PT003": { oxygen: 99, heartRate: 0, respiratoryRate: 0, temperature: 0, systolic: 0, diastolic: 0, pi: 6.35, pr: 83 },
  })

  const [patientsSeries, setPatientsSeries] = useState<Record<string, {
    oxygen: number[]
    heart: number[]
    respiratory: number[]
    temperature: number[]
    bloodPressure: number[]
    pi: number[]
    pr: number[]
    pvcs: number[]
    ews: number[]
    gcs: number[]
  }>>({
    "PT001": { oxygen: [], heart: [], respiratory: [], temperature: [], bloodPressure: [], pi: [], pr: [], pvcs: [], ews: [], gcs: [] },
    "PT002": { oxygen: [], heart: [], respiratory: [], temperature: [], bloodPressure: [], pi: [], pr: [], pvcs: [], ews: [], gcs: [] },
    "PT003": { oxygen: [], heart: [], respiratory: [], temperature: [], bloodPressure: [], pi: [], pr: [], pvcs: [], ews: [], gcs: [] },
  })

  const [patientsWaveforms, setPatientsWaveforms] = useState<Record<string, Record<string, WaveformPacket | undefined>>>({
    "PT001": {},
    "PT002": {},
    "PT003": {},
  })

  const [patientsAlarms, setPatientsAlarms] = useState<Record<string, AlarmPacket | null>>({})

  const [hasLiveVitals, setHasLiveVitals] = useState(false)
  const [dataMode, setDataMode] = useState<DataMode>("real")
  const [dummyFrame, setDummyFrame] = useState(0)
  const [isLiveFeedReady, setIsLiveFeedReady] = useState(false)
  const [streamReloadVersion, setStreamReloadVersion] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0])

  const handleRoomChange = (room: typeof ROOMS[0]) => {
    setIsLiveFeedReady(false)
    setSelectedRoom(room)
  }

  useEffect(() => {
    let ws: WebSocket | undefined
    let reconnectTimeout: number | undefined
    let active = true

    const connect = () => {
      ws = new WebSocket("wss://testback.intellicure.io/")

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

          if (parsed?.type === "patient_update") {
            const patientData = parsed?.data?.patient
            if (patientData && patientData.mrn) {
              const fullName = [patientData.firstName, patientData.lastName].filter(Boolean).join(" ")
              const formattedName = formatPatientName(fullName)
              let bedLabel = ""
              if (patientData.bedLocation) {
                const parts = patientData.bedLocation.split("&")
                const bedNum = parts[0]
                bedLabel = bedNum ? `Bed ${bedNum.padStart(2, "0")}` : patientData.bedLocation
              }
              setPatients((prev) =>
                prev.map((p) =>
                  p.mrn === patientData.mrn
                    ? {
                      ...p,
                      name: formattedName || p.name,
                      bed: bedLabel || p.bed,
                    }
                    : p
                )
              )
            }
            return
          }

          if (parsed?.type === "alarm") {
            const alarmData = parsed?.data
            if (alarmData?.patientMrn && alarmData?.alarm) {
              setPatientsAlarms((prev) => ({
                ...prev,
                [alarmData.patientMrn]: alarmData.alarm
              }))
            }
            return
          }

          const vitalsUpdate = extractVitalsUpdate(parsed)
          if (vitalsUpdate) {
            const mrn = vitalsUpdate.patientMrn || selectedPatientMrn
            console.log("[Vitals Store Debug]", { mrn, respiratoryRate: vitalsUpdate.respiratoryRate, update: vitalsUpdate })
            setHasLiveVitals(true)
            setPatientsVitals((prev) => ({
              ...prev,
              [mrn]: {
                ...prev[mrn],
                ...vitalsUpdate
              }
            }))

            setPatientsSeries((prev) => {
              const current = prev[mrn] || { oxygen: [], heart: [], respiratory: [], temperature: [], bloodPressure: [], pi: [], pr: [], pvcs: [], ews: [], gcs: [] }
              return {
                ...prev,
                [mrn]: {
                  oxygen: typeof vitalsUpdate.oxygen === "number" ? [...current.oxygen.slice(-27), vitalsUpdate.oxygen] : current.oxygen,
                  heart: typeof vitalsUpdate.heartRate === "number" ? [...current.heart.slice(-27), vitalsUpdate.heartRate] : current.heart,
                  respiratory: typeof vitalsUpdate.respiratoryRate === "number" ? [...current.respiratory.slice(-27), vitalsUpdate.respiratoryRate] : current.respiratory,
                  temperature: typeof vitalsUpdate.temperature === "number" ? [...current.temperature.slice(-27), vitalsUpdate.temperature] : current.temperature,
                  bloodPressure: typeof vitalsUpdate.systolic === "number" ? [...current.bloodPressure.slice(-27), vitalsUpdate.systolic] : current.bloodPressure,
                  pi: typeof vitalsUpdate.pi === "number" ? [...current.pi.slice(-27), vitalsUpdate.pi] : current.pi,
                  pr: typeof vitalsUpdate.pr === "number" ? [...current.pr.slice(-27), vitalsUpdate.pr] : current.pr,
                  pvcs: typeof vitalsUpdate.pvcs === "number" ? [...current.pvcs.slice(-27), vitalsUpdate.pvcs] : current.pvcs,
                  ews: typeof vitalsUpdate.ews === "number" ? [...current.ews.slice(-27), vitalsUpdate.ews] : current.ews,
                  gcs: typeof vitalsUpdate.gcs === "number" ? [...current.gcs.slice(-27), vitalsUpdate.gcs] : current.gcs,
                }
              }
            })
            return
          }

          const waveformPacket = extractWaveformPacket(parsed)

          if (waveformPacket) {
            const waveformKey = normalizeWaveformKey(waveformPacket.waveformName)
            const mrn = waveformPacket.patientMrn || selectedPatientMrn

            setPatientsWaveforms((history) => {
              const current = history[mrn] || {}
              return {
                ...history,
                [mrn]: {
                  ...current,
                  [waveformKey]: {
                    series: waveformPacket.dataPoints.slice(-300),
                    sampleRate: waveformPacket.sampleRate,
                    channel: waveformPacket.channel,
                    patientMrn: waveformPacket.patientMrn,
                  }
                }
              }
            })
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

  useEffect(() => {
    if (dataMode !== "dummy" && hasLiveVitals) {
      return
    }

    const intervalId = window.setInterval(() => {
      setDummyFrame((frame) => frame + 1)
    }, 850)

    return () => window.clearInterval(intervalId)
  }, [dataMode, hasLiveVitals])

  useEffect(() => {
    setIsLiveFeedReady(false)
  }, [streamReloadVersion])

  const handleRefreshFeed = () => {
    setIsLiveFeedReady(false)
    setStreamReloadVersion((version) => version + 1)
  }

  const isRealMode = dataMode === "real"
  const dummyVitals = buildDummyVitals(dummyFrame, simulationSeed, currentPatient.age)
  const activeVitals = isRealMode
    ? (patientsVitals[selectedPatientMrn] || { oxygen: 98, heartRate: 0, respiratoryRate: 0, temperature: 0, systolic: 0, diastolic: 0 })
    : dummyVitals

  const { oxygen, heartRate, respiratoryRate, temperature, systolic, diastolic } = activeVitals
  const activeWaveforms = isRealMode ? (patientsWaveforms[selectedPatientMrn] || {}) : buildDummyWaveformMap(dummyFrame, simulationSeed, dummyVitals)
  const hasActiveWaveforms = Object.keys(activeWaveforms).length > 0

  const ecgSeverity: Severity = !hasLiveVitals ? "stable" : oxygen < 92 || heartRate > 115 || respiratoryRate > 25 || temperature > 38.0 || systolic > 150 ? "critical" : oxygen < 94 || heartRate > 100 || respiratoryRate > 22 || temperature > 37.7 ? "watch" : "stable"

  const oxygenDisplay = isRealMode ? (hasLiveVitals && activeVitals.oxygen > 0 ? activeVitals.oxygen.toFixed(1) : "--") : activeVitals.oxygen.toFixed(1)
  const heartRateDisplay = isRealMode ? (hasLiveVitals && activeVitals.heartRate > 0 ? String(activeVitals.heartRate) : "--") : String(activeVitals.heartRate)
  const respiratoryDisplay = isRealMode ? (hasLiveVitals && activeVitals.respiratoryRate > 0 ? String(activeVitals.respiratoryRate) : "--") : String(activeVitals.respiratoryRate)
  const temperatureDisplay = isRealMode ? (hasLiveVitals && activeVitals.temperature > 0 ? activeVitals.temperature.toFixed(1) : "--") : activeVitals.temperature.toFixed(1)
  const bloodPressureDisplay = isRealMode ? (hasLiveVitals && activeVitals.systolic > 0 ? `${activeVitals.systolic}/${activeVitals.diastolic}` : "--/--") : `${activeVitals.systolic}/${activeVitals.diastolic}`

  const prDisplay = isRealMode ? (hasLiveVitals && activeVitals.pr !== undefined && activeVitals.pr > 0 ? String(activeVitals.pr) : "--") : String(activeVitals.pr ?? 83)
  const piDisplay = isRealMode ? (hasLiveVitals && activeVitals.pi !== undefined && activeVitals.pi > 0 ? activeVitals.pi.toFixed(2) : "--") : (activeVitals.pi !== undefined ? activeVitals.pi.toFixed(2) : "5.00")
  const pvcsDisplay = isRealMode ? (hasLiveVitals && activeVitals.pvcs !== undefined && activeVitals.pvcs >= 0 ? String(activeVitals.pvcs) : "--") : String(activeVitals.pvcs ?? 0)
  const ewsDisplay = isRealMode ? (hasLiveVitals && activeVitals.ews !== undefined && activeVitals.ews >= 0 ? String(activeVitals.ews) : "--") : String(activeVitals.ews ?? 0)
  const gcsDisplay = isRealMode ? (hasLiveVitals && activeVitals.gcs !== undefined && activeVitals.gcs >= 0 ? String(activeVitals.gcs) : "--") : String(activeVitals.gcs ?? 15)

  const dummyContext = buildDummyPatientContext(simulationSeed, activeVitals)

  const statusLabel = isRealMode ? (!hasLiveVitals ? "Waiting for live vitals" : ecgSeverity === "critical" ? "Critical watch" : ecgSeverity === "watch" ? "Active watch" : "Stable monitor") : dummyContext.statusLabel
  const statusTone = isRealMode ? (!hasLiveVitals ? "text-muted-foreground" : ecgSeverity === "critical" ? "text-danger" : ecgSeverity === "watch" ? "text-warning" : "text-success") : dummyContext.statusTone

  const waveformCards = WAVEFORM_DEFINITIONS.map((definition) => ({
    definition,
    packet: activeWaveforms[definition.key],
  }))

  const currentSeries = patientsSeries[selectedPatientMrn] || { oxygen: [], heart: [], respiratory: [], temperature: [], bloodPressure: [], pi: [], pr: [], pvcs: [], ews: [], gcs: [] }

  const oxygenSeriesDisplay = isRealMode ? currentSeries.oxygen : buildTrendSeries(activeVitals.oxygen, 0.9, dummyFrame, hashString(`oxygen:${simulationSeed}`))
  const heartSeriesDisplay = isRealMode ? currentSeries.heart : buildTrendSeries(activeVitals.heartRate, 4, dummyFrame, hashString(`heart:${simulationSeed}`))
  const respiratorySeriesDisplay = isRealMode ? currentSeries.respiratory : buildTrendSeries(activeVitals.respiratoryRate, 2, dummyFrame, hashString(`resp:${simulationSeed}`))
  const temperatureSeriesDisplay = isRealMode ? currentSeries.temperature : buildTrendSeries(activeVitals.temperature, 0.25, dummyFrame, hashString(`temp:${simulationSeed}`))
  const bloodPressureSeriesDisplay = isRealMode ? currentSeries.bloodPressure : buildTrendSeries((activeVitals.systolic + activeVitals.diastolic) / 2, 5, dummyFrame, hashString(`bp:${simulationSeed}`))

  const prSeriesDisplay = isRealMode ? currentSeries.pr : buildTrendSeries(activeVitals.pr ?? 83, 3, dummyFrame, hashString(`pr:${simulationSeed}`))
  const piSeriesDisplay = isRealMode ? currentSeries.pi : buildTrendSeries(activeVitals.pi ?? 5.0, 0.5, dummyFrame, hashString(`pi:${simulationSeed}`))
  const pvcsSeriesDisplay = isRealMode ? currentSeries.pvcs : buildTrendSeries(activeVitals.pvcs ?? 0, 0.2, dummyFrame, hashString(`pvcs:${simulationSeed}`))
  const ewsSeriesDisplay = isRealMode ? currentSeries.ews : buildTrendSeries(activeVitals.ews ?? 0, 0.1, dummyFrame, hashString(`ews:${simulationSeed}`))
  const gcsSeriesDisplay = isRealMode ? currentSeries.gcs : buildTrendSeries(activeVitals.gcs ?? 15, 0, dummyFrame, hashString(`gcs:${simulationSeed}`))

  const displayPatientName = currentPatient.name
  const displayPatientAge = currentPatient.age
  const displayBedLabel = currentPatient.bed
  const displayShiftLabel = currentPatient.shift
  const cameraBedLabel = currentPatient.bed

  const waveformSummaryLabel = isRealMode ? (hasLiveVitals ? `${heartRate} bpm` : hasActiveWaveforms ? "Waveforms live" : "-- bpm") : dummyContext.waveformSummaryLabel
  const waveformSummaryTone = isRealMode ? (hasLiveVitals ? statusTone : hasActiveWaveforms ? "text-success" : "text-muted-foreground") : dummyContext.waveformSummaryTone
  const liveMonitoringLabel = isRealMode
    ? isLiveFeedReady
      ? hasLiveVitals
        ? "Camera and telemetry active"
        : "Camera feed active"
      : "Connecting live feed"
    : dummyContext.liveMonitoringLabel
  const clinicalReadoutLabel = isRealMode ? (hasLiveVitals ? (ecgSeverity === "critical" ? "Spike pattern detected" : ecgSeverity === "watch" ? "Irregularity under review" : "Sinus rhythm stable") : hasActiveWaveforms ? "Lead packets streaming" : "Awaiting live stream") : dummyContext.clinicalReadoutLabel
  const consultationVitals = activeVitals
  const currentAlarm = patientsAlarms[selectedPatientMrn]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BrowserWarningModal />
      {!isNetworkPoor && (
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
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute top-[-12%] left-[-8%] h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-6%] h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

      <main className="relative z-10 grid gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="space-y-6">
          {/* Patient Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-md">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground font-mono">Select Patient Monitor</p>
              <h1 className="mt-0.5 text-base font-black text-foreground">Intelli ICU Center</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {patients.map((p) => (
                <button
                  key={p.mrn}
                  type="button"
                  onClick={() => setSelectedPatientMrn(p.mrn)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer ${selectedPatientMrn === p.mrn
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_16px_rgba(6,182,212,0.15)]"
                      : "border-white/10 bg-white/5 text-foreground/70 hover:border-white/25 hover:bg-white/10"
                    }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedPatientMrn === p.mrn ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
                  <span>{p.name} ({p.mrn})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Patient Alarm Banner */}
          {currentAlarm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border backdrop-blur-md shadow-md ${currentAlarm.alarmLevel > 0
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : "border-warning/30 bg-warning/10 text-warning"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${currentAlarm.alarmLevel > 0 ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                  }`}>
                  <TriangleAlert className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 font-mono">
                    Active Alarm ({currentAlarm.alarmType})
                  </p>
                  <p className="text-xs font-extrabold mt-0.5">{currentAlarm.alarmText}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientsAlarms((prev) => ({ ...prev, [selectedPatientMrn]: null }))}
                className="rounded-full bg-white/5 hover:bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 min-[1400px]:grid-cols-6 min-[1700px]:grid-cols-8">
            <VitalCard label="Oxygen Level" value={oxygenDisplay} unit="%" tone="text-cyan-300" series={oxygenSeriesDisplay} icon={<Activity className="h-4 w-4 text-cyan-300" />} />
            <VitalCard label="Heart Rate" value={heartRateDisplay} unit="bpm" tone="text-rose-300" series={heartSeriesDisplay} icon={<Heart className="h-4 w-4 text-rose-300" />} />
            <VitalCard label="Respiratory Rate" value={respiratoryDisplay} unit="bpm" tone="text-emerald-300" series={respiratorySeriesDisplay} icon={<Wind className="h-4 w-4 text-emerald-300" />} />
            <VitalCard label="Temperature" value={temperatureDisplay} unit="°C" tone="text-amber-300" series={temperatureSeriesDisplay} icon={<Thermometer className="h-4 w-4 text-amber-300" />} />
            <VitalCard label="Blood Pressure" value={bloodPressureDisplay} unit="mmHg" tone="text-violet-300" series={bloodPressureSeriesDisplay} icon={<Droplets className="h-4 w-4 text-violet-300" />} />

            {/* Additional Indicators */}
            {activeVitals.pr !== undefined && activeVitals.pr !== -1 && (
              <VitalCard label="Pulse Rate" value={prDisplay} unit="bpm" tone="text-fuchsia-300" series={prSeriesDisplay} icon={<Zap className="h-4 w-4 text-fuchsia-300" />} />
            )}
            {activeVitals.pi !== undefined && activeVitals.pi !== -1 && (
              <VitalCard label="Perfusion Index" value={piDisplay} unit="%" tone="text-teal-300" series={piSeriesDisplay} icon={<Percent className="h-4 w-4 text-teal-300" />} />
            )}
            {activeVitals.pvcs !== undefined && activeVitals.pvcs !== -1 && (
              <VitalCard label="PVCs" value={pvcsDisplay} unit="/min" tone="text-red-400" series={pvcsSeriesDisplay} icon={<HeartOff className="h-4 w-4 text-red-400" />} />
            )}
            {activeVitals.ews !== undefined && activeVitals.ews !== -1 && (
              <VitalCard label="EWS Score" value={ewsDisplay} unit="" tone="text-amber-400" series={ewsSeriesDisplay} icon={<ShieldAlert className="h-4 w-4 text-amber-400" />} />
            )}
            {activeVitals.gcs !== undefined && activeVitals.gcs !== -1 && (
              <VitalCard label="GCS Score" value={gcsDisplay} unit="" tone="text-violet-400" series={gcsSeriesDisplay} icon={<Brain className="h-4 w-4 text-violet-400" />}>
                <div className="flex justify-between items-center h-full px-1 text-[9px] font-bold text-white/80">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[7.5px] uppercase tracking-wider text-muted-foreground font-semibold">Eye</span>
                    <span className="text-violet-300 font-black text-xs leading-none mt-0.5">{activeVitals.gcsEye ?? '--'}</span>
                  </div>
                  <div className="h-5 w-px bg-white/10" />
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[7.5px] uppercase tracking-wider text-muted-foreground font-semibold">Verbal</span>
                    <span className="text-violet-300 font-black text-xs leading-none mt-0.5">{activeVitals.gcsVerbal ?? '--'}</span>
                  </div>
                  <div className="h-5 w-px bg-white/10" />
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[7.5px] uppercase tracking-wider text-muted-foreground font-semibold">Motor</span>
                    <span className="text-violet-300 font-black text-xs leading-none mt-0.5">{activeVitals.gcsMotor ?? '--'}</span>
                  </div>
                </div>
              </VitalCard>
            )}
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

                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setDataMode("real")}
                      className={`rounded-full px-3 py-1.5 transition ${dataMode === "real" ? "bg-primary text-white shadow-[0_0_18px_rgba(124,58,237,0.28)]" : "hover:text-foreground"}`}
                    >
                      Real data
                    </button>
                    <button
                      type="button"
                      onClick={() => setDataMode("dummy")}
                      className={`rounded-full px-3 py-1.5 transition ${dataMode === "dummy" ? "bg-emerald-400 text-black shadow-[0_0_18px_rgba(16,185,129,0.25)]" : "hover:text-foreground"}`}
                    >
                      Dummy data
                    </button>
                  </div>
                  <div className="flex h-9 w-[170px] shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-3 text-[11px] font-medium text-foreground/90">
                    <span className="truncate" title={`${displayPatientName}${displayPatientAge ? ` • ${displayPatientAge} yrs` : ""}`}>
                      {displayPatientName}{displayPatientAge ? ` • ${displayPatientAge} yrs` : ""}
                    </span>
                  </div>
                  <div className="flex h-9 w-[92px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 text-[11px] font-medium text-foreground/90">
                    <span className="truncate" title={displayBedLabel}>{displayBedLabel}</span>
                  </div>
                  <div className="flex h-9 w-[176px] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-[11px] font-medium text-foreground/90">
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate" title={displayShiftLabel}>{displayShiftLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 p-5">
              <div className="rounded-[1.8rem] border border-white/5 bg-[#05040a] p-4 shadow-inner shadow-black/50">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground font-mono">
                      Waveform matrix {isRealMode && `(Active: ${Object.keys(activeWaveforms).filter(k => activeWaveforms[k]).join(", ") || "None"}) [Telemetry MRNs: ${Object.keys(patientsWaveforms).filter(mrn => Object.keys(patientsWaveforms[mrn]).length > 0).join(", ") || "None"}]`}
                    </p>
                    <p className={`mt-1 text-2xl font-black ${waveformSummaryTone}`}>{waveformSummaryLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">Clinical readout</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{clinicalReadoutLabel}</p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {waveformCards.map(({ definition, packet }) => (
                    <WaveformCard key={definition.key} definition={definition} packet={packet} mode={dataMode} />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </section>

        <aside className="space-y-6 sticky top-6 self-start z-40">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-400/10 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3.5 border-b border-white/5 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">Patient Camera</p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Live ICU Feed</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <NetworkTracker />
                  <button
                    type="button"
                    onClick={handleRefreshFeed}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/85 transition hover:bg-white/10"
                    title="Reload camera feed"
                    aria-label="Reload camera feed"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </button>
                  <div className="flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-danger">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                    Live stream
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {ROOMS.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleRoomChange(room)}
                      className={`rounded-full px-2.5 py-1 transition ${selectedRoom.id === room.id
                        ? "bg-cyan-500 text-black font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        : "hover:text-foreground text-white/60"
                        }`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden bg-black">
              <iframe
                key={`${selectedRoom.id}-${streamReloadVersion}`}
                src={selectedRoom.url}
                title="Live ICU Camera Feed"
                className="absolute inset-0 h-full w-full border-0 bg-black"
                allow="autoplay; fullscreen"
                onLoad={() => setIsLiveFeedReady(true)}
                {...({ fetchPriority: "high" } as any)}
                loading="eager"
              />
              {!isLiveFeedReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] pointer-events-none">
                  <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-center shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">Connecting stream</p>
                    <p className="mt-1 text-sm font-semibold text-white/90">Loading live ICU camera feed...</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)] bg-[length:100%_7px] opacity-40 pointer-events-none" />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="glass-card relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.26)]"
          >
            <IcuCallControlPanel
              liveVitals={consultationVitals}
              patientContext={{
                patientName: displayPatientName,
                patientAge: displayPatientAge,
                bed: displayBedLabel,
                shift: displayShiftLabel,
                diagnosis: routeContext.diagnosis,
                ambRegNo: routeContext.ambRegNo || selectedPatientMrn,
              }}
            />
          </motion.section>
        </aside>
      </main>
    </div>
  )
}