export type LiveVitalsSnapshot = {
  oxygen: number
  heartRate: number
  respiratoryRate: number
  temperature: number
  systolic: number
  diastolic: number
}

export type IcuPatientContext = {
  patientName?: string
  patientAge?: string | number
  bed?: string
  shift?: string
  diagnosis?: string
  ambRegNo?: string
}

export type IcuVitalsBroadcast = {
  wardId: string
  doctorId: string
  vitals: LiveVitalsSnapshot
  patient?: IcuPatientContext
  updatedAt: number
  source?: "intelli-icu"
}

export function formatVitalsTimestamp(updatedAt?: number | null) {
  if (!updatedAt) {
    return "Waiting"
  }

  return new Date(updatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}