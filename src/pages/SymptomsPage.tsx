import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Send, ArrowRight, Brain, ArrowLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

interface Message {
  id: number
  sender: "ai" | "user"
  text: string
  time: string
}

const aiResponses = [
  "I understand. Can you tell me more about when this started?",
  "How severe is the pain on a scale of 1-10?",
  "Are you experiencing any other symptoms like fever, nausea, or dizziness?",
  "Have you taken any medication for this?",
  "Thank you. I'm analyzing your symptoms now. Based on what you've described, I recommend we proceed to check your vitals.",
]

export default function SymptomsPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hello! I'm your AI health assistant. Please tell me what symptoms you're experiencing — you can speak or type.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [aiResponseIndex, setAiResponseIndex] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = (text: string, sender: "ai" | "user") => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  const handleSend = () => {
    if (!input.trim()) return
    addMessage(input.trim(), "user")
    setInput("")

    // Simulate AI response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      if (aiResponseIndex < aiResponses.length) {
        addMessage(aiResponses[aiResponseIndex], "ai")
        setAiResponseIndex(prev => prev + 1)
      }
    }, 1500)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Simulate voice capture
      setTimeout(() => {
        setIsRecording(false)
        const voiceTexts = ["I have a headache and feel dizzy", "The pain started yesterday", "No fever but I feel weak"]
        const randomText = voiceTexts[Math.floor(Math.random() * voiceTexts.length)]
        setInput(randomText)
      }, 2000)
    }
  }

  const isComplete = aiResponseIndex >= aiResponses.length - 1

  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between relative z-20 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/home">
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4 text-foreground/70" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Symptom Intake
            </h1>
            <p className="text-xs text-muted-foreground">Step 1 of 5</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">AI Active</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary">
        <div
          className="h-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
          style={{ width: `${Math.min((aiResponseIndex / aiResponses.length) * 100, 100)}%` }}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div className={`max-w-[80%] md:max-w-[60%] ${
              msg.sender === "user"
                ? "bg-primary/20 border border-primary/30 rounded-2xl rounded-br-md"
                : "glass-card rounded-2xl rounded-bl-md"
            } px-5 py-3.5`}>
              {msg.sender === "ai" && (
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Assistant</span>
                </div>
              )}
              <p className="text-foreground text-sm leading-relaxed">{msg.text}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-right">{msg.time}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-card rounded-2xl rounded-bl-md px-5 py-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">AI Assistant</span>
              </div>
              <div className="flex gap-1.5 py-1">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Proceed button when conversation is complete */}
      {isComplete && (
        <div className="px-4 pb-2 animate-fade-in-up">
          <Link to="/vitals">
            <Button variant="hero" className="w-full rounded-xl py-6 text-base gap-2 group">
              Proceed to Vitals Check
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pb-6 pt-3 relative z-20">
        <div className="glass-card rounded-2xl p-2 flex items-center gap-2">
          {/* Mic button */}
          <button
            onClick={toggleRecording}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              isRecording
                ? "bg-danger/20 text-danger border border-danger/30 animate-pulse"
                : "bg-white/5 text-foreground/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            placeholder="Type your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none px-2 py-2.5"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {isRecording && (
          <p className="text-center text-xs text-danger mt-2 animate-pulse">🎤 Listening — speak now...</p>
        )}
      </div>
    </div>
  )
}
