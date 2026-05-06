import { io } from "socket.io-client"

const SOCKET_URL = (import.meta.env.VITE_CONSULTATION_SOCKET_URL as string | undefined) || "/"

export const consultationSocket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: false,
  transports: ["websocket", "polling"],
})

export const connectSocket = () => {
  if (!consultationSocket.connected) {
    consultationSocket.connect()
  }

  return consultationSocket
}

export default consultationSocket
