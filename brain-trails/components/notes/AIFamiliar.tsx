"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2, Wand2, BookOpen, HelpCircle, PenTool } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

interface AIFamiliarProps {
  noteContent?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const quickActions: QuickAction[] = [
  { icon: <Wand2 className="w-3.5 h-3.5" />, label: "Summarize", prompt: "Summarize my notes concisely" },
  { icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Quiz Me", prompt: "Generate 3 quiz questions from my notes" },
  { icon: <PenTool className="w-3.5 h-3.5" />, label: "Exam Prep", prompt: "Rewrite my notes in a format optimized for exam preparation" },
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Explain", prompt: "Explain the key concepts in my notes in simpler terms" },
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function AIFamiliar({ noteContent = "", isOpen = false, onToggle }: AIFamiliarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "✨ Greetings, traveler! I'm your AI Familiar. Ask me to summarize your notes, generate quiz questions, or help with studying!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          noteContent: noteContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMsg = errData?.error || `Backend returned ${response.status}`;

        const errorMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);

      // Network error — backend is unreachable
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "🔌 I can't reach the backend right now. Make sure the Flask server is running on port 5000.\n\n```\ncd backend\npip install -r requirements.txt\npython app.py\n```",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Floating toggle button when not open
  if (!isOpen) {
    return (
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-violet-500 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center hover:bg-violet-600 transition-colors"
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">AI Familiar</h3>
                <p className="text-xs text-slate-500">Study companion</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-slate-100 flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(action.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {action.icon}
              {action.label}
            </motion.button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-violet-500 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-700 rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span className="text-xs text-slate-500">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your familiar..."
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
