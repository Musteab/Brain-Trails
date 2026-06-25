"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { HelpCircle, Send, ArrowLeft, Bug, MessageSquare, Plus, Loader2 } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import { motion, AnimatePresence } from "framer-motion";

export default function SupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const addToast = useUIStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState<"new" | "mytickets">("new");
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [category, setCategory] = useState<"question" | "bug" | "feature" | "other">("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast("You must be logged in to submit a ticket.", "error");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      addToast("Please fill out all fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.from("support_tickets") as any).insert({
        user_id: user.id,
        category,
        subject,
        message,
        status: "open",
        severity: category === "bug" ? "medium" : "low"
      });

      if (error) throw error;
      
      addToast("Ticket submitted successfully! The Arch-Mages will review it soon.", "success");
      setSubject("");
      setMessage("");
      setActiveTab("mytickets");
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      addToast("Failed to submit ticket. Please try again later.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen relative pb-20 ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />
      
      <div className="relative z-10 max-w-4xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className={`p-2 rounded-xl backdrop-blur-sm border transition-colors ${
              isSun 
                ? "bg-white/70 border-slate-200 hover:bg-white text-slate-600" 
                : "bg-white/10 border-white/20 hover:bg-white/20 text-slate-300"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <HelpCircle className={isSun ? "text-blue-600" : "text-blue-400"} />
              Council Support
            </h1>
            <p className={`text-sm ${muted}`}>Need help with your journey or found a glitch in the matrix?</p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "new"
                ? isSun ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : isSun ? "bg-white/50 border border-slate-200 text-slate-600 hover:bg-white/80" : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
          <button
            onClick={() => setActiveTab("mytickets")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "mytickets"
                ? isSun ? "bg-slate-800 text-white shadow-md shadow-slate-500/20" : "bg-white text-slate-900 shadow-md shadow-black/20"
                : isSun ? "bg-white/50 border border-slate-200 text-slate-600 hover:bg-white/80" : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> My Tickets
          </button>
        </div>

        {/* Content Area */}
        <div className={`p-6 md:p-8 rounded-3xl border backdrop-blur-xl ${isSun ? "bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50" : "bg-slate-900/80 border-slate-700/50 shadow-2xl"}`}>
          <AnimatePresence mode="wait">
            {activeTab === "new" ? (
              <motion.form
                key="new-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-5 flex flex-col items-center max-w-2xl mx-auto w-full"
              >
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isSun ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400"}`}>
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Send a Raven</h2>
                  <p className={`text-sm ${muted}`}>Describe your issue in detail. The more info, the faster we can help.</p>
                </div>

                <div className="w-full">
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${muted}`}>Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: "question", label: "Question", icon: HelpCircle },
                      { id: "bug", label: "Bug Report", icon: Bug },
                      { id: "feature", label: "Idea", icon: Plus },
                      { id: "other", label: "Other", icon: MessageSquare }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as "question" | "bug" | "feature" | "other")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          category === cat.id
                            ? isSun ? "border-blue-500 bg-blue-50 text-blue-700" : "border-blue-500 bg-blue-500/10 text-blue-300"
                            : isSun ? "border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <cat.icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full">
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${muted}`}>Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue..."
                    className={`w-full px-4 py-3 rounded-xl border outline-none font-medium transition-colors ${
                      isSun 
                        ? "bg-white border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400" 
                        : "bg-slate-900 border-slate-700 focus:border-blue-500 text-white placeholder-slate-500"
                    }`}
                    required
                  />
                </div>

                <div className="w-full">
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${muted}`}>Message Details</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={category === "bug" ? "Steps to reproduce, what you expected, what actually happened..." : "How can we help you today?"}
                    rows={6}
                    className={`w-full px-4 py-3 rounded-xl border outline-none font-medium transition-colors resize-y ${
                      isSun 
                        ? "bg-white border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400" 
                        : "bg-slate-900 border-slate-700 focus:border-blue-500 text-white placeholder-slate-500"
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !message.trim()}
                  className={`
                    w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${submitting || !subject.trim() || !message.trim()
                      ? "opacity-50 cursor-not-allowed bg-slate-400 text-white"
                      : isSun 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5" 
                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                    }
                  `}
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Casting Spell...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Submit Ticket</>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="mytickets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-12"
              >
                <MessageSquare className={`w-12 h-12 mx-auto mb-4 opacity-50 ${muted}`} />
                <h3 className="text-xl font-bold mb-2">My Tickets</h3>
                <p className={`max-w-md mx-auto ${muted}`}>Ticket history retrieval is still being forged by our dwarven smiths in the backend forge.</p>
                <p className={`text-xs mt-4 uppercase font-bold text-amber-500 bg-amber-500/10 inline-block px-3 py-1 rounded-full`}>
                  Coming Soon
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
