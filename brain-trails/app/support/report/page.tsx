"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Bug, ArrowLeft, Loader2, AlertTriangle, Info } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

function ReportIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const addToast = useUIStore(s => s.addToast);

  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("low");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    // Auto-capture the URL the user came from if passed via query, else use current hostname as fallback
    const fromUrl = searchParams?.get("from") || window.location.origin;
    setPageUrl(fromUrl);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast("You must be logged in to report an issue.", "error");
      return;
    }

    if (!description.trim()) {
      addToast("Please provide a description of the issue.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.from("support_tickets") as any).insert({
        user_id: user.id,
        category: "bug",
        subject: `Automated Bug Report: ${pageUrl}`,
        message: description,
        page_url: pageUrl,
        severity,
        status: "open"
      });

      if (error) throw error;
      
      addToast("Bug reported! Our mages will investigate.", "success");
      setDescription("");
      router.back();
    } catch (err) {
      console.error("Failed to submit bug report:", err);
      addToast("Failed to submit report. Please try again later.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen relative pb-20 ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />
      
      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4">
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
              <Bug className={isSun ? "text-rose-600" : "text-rose-400"} />
              Report an Issue
            </h1>
            <p className={`text-sm ${muted}`}>Help us squish bugs and improve the realm.</p>
          </div>
        </div>

        {/* Form Content */}
        <div className={`p-6 md:p-8 rounded-3xl border backdrop-blur-xl ${isSun ? "bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50" : "bg-slate-900/80 border-slate-700/50 shadow-2xl"}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className={`p-4 rounded-xl border flex gap-3 ${isSun ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-blue-500/10 border-blue-500/20 text-blue-300"}`}>
              <Info className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold mb-1">Automated Capture</p>
                <p>We&apos;ve recorded the URL where you encountered the issue: <span className="font-mono bg-black/10 px-1 rounded">{pageUrl}</span></p>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${muted}`}>Severity</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "low", label: "Minor/Visual", color: "blue" },
                  { id: "medium", label: "Annoying", color: "amber" },
                  { id: "high", label: "Broken Feature", color: "orange" },
                  { id: "critical", label: "Game-breaking", color: "rose" }
                ].map(sev => (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setSeverity(sev.id as "low" | "medium" | "high" | "critical")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      severity === sev.id
                        ? isSun ? `border-${sev.color}-500 bg-${sev.color}-50 text-${sev.color}-700 ring-2 ring-${sev.color}-500/50` : `border-${sev.color}-500 bg-${sev.color}-500/20 text-${sev.color}-300 ring-2 ring-${sev.color}-500/50`
                        : isSun ? "border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300" : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-xs font-bold">{sev.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${muted}`}>What happened?</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="I was trying to equip a title, but the save button didn't do anything..."
                rows={6}
                className={`w-full px-4 py-3 rounded-xl border outline-none font-medium transition-colors resize-y ${
                  isSun 
                    ? "bg-white border-slate-200 focus:border-rose-500 text-slate-800 placeholder-slate-400" 
                    : "bg-slate-900 border-slate-700 focus:border-rose-500 text-white placeholder-slate-500"
                }`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                ${submitting || !description.trim()
                  ? "opacity-50 cursor-not-allowed bg-slate-400 text-white"
                  : isSun 
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 hover:-translate-y-0.5" 
                    : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:-translate-y-0.5"
                }
              `}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Report...</>
              ) : (
                <><AlertTriangle className="w-5 h-5" /> Submit Bug Report</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative pb-20 bg-slate-900">
          <BackgroundLayer />
          <div className="flex items-center justify-center h-full pt-40">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        </div>
      }
    >
      <ReportIssueForm />
    </Suspense>
  );
}
