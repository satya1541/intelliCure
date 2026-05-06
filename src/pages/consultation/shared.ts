import "@/styles/consultation.css"

export type ConsultationRole = "doctor" | "ward"

export type ConsultationPeer = {
  id: string
  name: string
}

export const doctors: ConsultationPeer[] = [
  { id: "deepak-kumar-sahoo", name: "Deepak Kumar Sahoo" },
  { id: "aditya-ray", name: "Aditya Ray" },
]

export const wards: ConsultationPeer[] = [
  { id: "ward-1", name: "Ward 1" },
  { id: "ward-2", name: "Ward 2" },
]

export const doctorById: Record<string, string> = Object.fromEntries(
  doctors.map((doctor) => [doctor.id, doctor.name])
)

export const wardById: Record<string, string> = Object.fromEntries(
  wards.map((ward) => [ward.id, ward.name])
)

export const defaultDoctorId = doctors[0].id
export const defaultWardId = wards[0].id

export function getPeerOptions(role: ConsultationRole) {
  return role === "doctor" ? wards : doctors
}

export function getPeerLabel(role: ConsultationRole, peerId: string) {
  return role === "doctor" ? wardById[peerId] || peerId : doctorById[peerId] || peerId
}

export function getCurrentLabel(role: ConsultationRole, peerId: string) {
  return role === "doctor" ? doctorById[peerId] || peerId : wardById[peerId] || peerId
}

export function getRoleTitle(role: ConsultationRole) {
  return role === "doctor" ? "Doctor Dashboard" : "Ward Dashboard"
}

export function getRoleEyebrow(role: ConsultationRole) {
  return role === "doctor" ? "Doctor Console" : "Nursing Station"
}

export function getRoleSubtitle(role: ConsultationRole, currentName: string) {
  return role === "doctor"
    ? `Welcome, Dr. ${currentName}. Monitor wards and initiate secure video calls.`
    : `Welcome, ${currentName}. Stay ready for incoming doctor calls.`
}

export function getPeerPanelTitle(role: ConsultationRole, peerName: string) {
  return role === "doctor"
    ? `${peerName} - Nursing Station`
    : `${peerName} - Doctor Console`
}

export function getPeerPanelDescription(role: ConsultationRole, peerName: string) {
  return role === "doctor"
    ? `Initiate a secure video call with ${peerName}.`
    : `Initiate a secure video call with ${peerName}.`
}

export function getIncomingLabel(role: ConsultationRole) {
  return role === "doctor" ? "Ward Request" : "Doctor Request"
}

export function getIncomingDescription(role: ConsultationRole, peerName: string) {
  return role === "doctor"
    ? `${peerName} is requesting a call.`
    : `${peerName} is requesting a call.`
}

export function getRoleThemeClass(role: ConsultationRole) {
  return role === "doctor" ? "doctor-page" : "ward-page"
}

export function getDefaultPeerId(role: ConsultationRole) {
  return role === "doctor" ? defaultWardId : defaultDoctorId
}