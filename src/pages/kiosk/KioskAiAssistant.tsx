import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, Brain } from "lucide-react";
import { spring, ProgressPill, ASSETS } from "./shared";

export default function KioskAiAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", text: "Hi! I'm your AI Health Assistant. What's bothering you today?" }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTyping(true);
    const t = setTimeout(() => {
      setIsTyping(false);
      setMessages(p => [...p, { role: "bot", text: "You can speak or type your symptoms." }]);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showChips]);

  const addBotMsg = (text: string, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(p => [...p, { role: "bot", text }]);
    }, delay);
  };

  const handleMic = () => {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setMessages(p => [...p, { role: "user", text: "I have a headache and feel tired." }]);
      addBotMsg("Got it — headache and fatigue. Do you have a fever?", 1000);
      setTimeout(() => setShowChips(true), 2200);
    }, 3000);
  };

  const handleChip = (text: string) => {
    setShowChips(false);
    setMessages(p => [...p, { role: "user", text }]);
    addBotMsg("Thanks! Let me now measure your vitals.", 1000);
    setTimeout(() => navigate("/kiosk/vitals"), 3200);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages(p => [...p, { role: "user", text: inputText }]);
    setInputText("");
    addBotMsg("Understood. Can you tell me more about the duration?", 1000);
    setTimeout(() => setShowChips(true), 2400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full h-full flex flex-col relative z-20 overflow-hidden bg-background"
    >
      {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-10 pb-4 border-b border-white/5 bg-background shadow-sm z-30 shrink-0 relative">
          <button onClick={() => navigate("/kiosk")} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 overflow-hidden shrink-0">
              <img src={ASSETS.assistant} alt="AI" className="w-full h-full object-cover" />
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold leading-tight truncate">IntelliCure AI</p>
              <p className="text-[10px] text-success font-semibold tracking-widest uppercase">Online</p>
            </div>
          </div>
          <ProgressPill step={2} />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-6 space-y-4 bg-background/50 relative z-20 no-scrollbar">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={spring}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
            >
              {msg.role === "bot" && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mb-0.5">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[70%] px-5 py-4 rounded-2xl text-base leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-none shadow-xl shadow-primary/20"
                  : "glass-card text-foreground rounded-bl-sm shadow-sm"
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mb-0.5">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center h-12">
                {[0, 1, 2].map(d => (
                  <motion.div key={d} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }}
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {showChips && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2 pt-1 pl-10">
                {["Yes, with fever", "No fever", "For 2-3 days"].map((chip, i) => (
                  <motion.button
                    key={chip}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                    onClick={() => handleChip(chip)}
                    className="px-4 py-2 rounded-full border border-primary/30 text-primary text-xs font-bold bg-primary/5 hover:bg-primary hover:text-white transition-all shadow-sm shrink-0"
                  >
                    {chip}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Input footer */}
        <div className="shrink-0 bg-background/80 backdrop-blur-xl border-t border-white/5 px-4 sm:px-5 pt-4 pb-4 sm:pb-6 relative z-30 rounded-b-[2.2rem]">
          {/* Waveform during recording */}
          <AnimatePresence>
            {isRecording && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 40, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex items-center justify-center gap-1.5 mb-3 overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div key={i}
                    animate={{ scaleY: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                    className="w-1.5 bg-danger/80 rounded-full origin-center"
                    style={{ height: 28 }}
                  />
                ))}
                <span className="ml-3 text-danger text-xs font-bold uppercase tracking-wider">Listening...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type your symptoms..."
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 pr-14 text-sm font-medium text-foreground focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="absolute right-2 top-2 w-10 h-10 bg-primary/90 hover:bg-primary rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:bg-primary/90"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            {/* Mic */}
            <div className="relative shrink-0">
              {isRecording && [0, 0.5].map(d => (
                <motion.div key={d} animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                  className="absolute inset-0 rounded-2xl bg-danger/50" />
              ))}
              <button
                onClick={handleMic}
                className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isRecording ? "bg-danger shadow-xl shadow-danger/40" : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                <Mic className={`w-6 h-6 ${isRecording ? "text-white" : "text-primary/90"}`} />
              </button>
            </div>
          </div>
          {/* iOS-style bottom bar indicator */}
          <div className="w-1/3 h-1 bg-white/20 rounded-full mx-auto mt-6" />
        </div>
    </motion.div>
  );
}
