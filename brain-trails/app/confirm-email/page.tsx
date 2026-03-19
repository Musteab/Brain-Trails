"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, ScrollText, RefreshCw } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const { theme } = useTheme();
  const isSun = theme === "sun";

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);

    await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResent(true);
    setIsResending(false);
    setTimeout(() => setResent(false), 5000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <BackgroundLayer />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
        className={`relative z-10 w-full max-w-md backdrop-blur-2xl border-2 rounded-3xl p-8 shadow-2xl overflow-hidden ${
          isSun ? "bg-white/50 border-white/40" : "bg-white/10 border-white/20"
        }`}
      >
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Animated scroll icon */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-500 text-white shadow-lg mb-6"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ScrollText className="w-10 h-10" />
            </motion.div>
          </motion.div>

          <h1 className={`text-2xl font-bold mb-3 font-heading tracking-tight drop-shadow-md ${isSun ? "text-slate-800" : "text-white"}`}>
            Check Your Scroll Box 📜
          </h1>

          <p className={`text-sm mb-2 leading-relaxed ${isSun ? "text-slate-600" : "text-indigo-100/80"}`}>
            We&apos;ve sent a confirmation scroll to:
          </p>

          {email && (
            <p className={`font-bold text-sm mb-4 px-4 py-2 rounded-xl inline-block ${
              isSun ? "bg-slate-200 text-slate-800" : "bg-white/10 text-white"
            }`}>
              {email}
            </p>
          )}

          <p className={`text-xs mb-8 leading-relaxed max-w-sm mx-auto ${
            isSun ? "text-slate-500" : "text-indigo-200/60"
          }`}>
            Click the link in the email to activate your account and begin your adventure.
            It may take a minute to arrive — check your spam folder too!
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResend}
            disabled={isResending || resent}
            className={`w-full py-3 px-4 border-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-4 ${
              isSun
                ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
                : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
            }`}
          >
            {isResending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : resent ? (
              <>
                <Mail className="w-5 h-5" />
                Email Resent! ✓
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Resend Confirmation Email
              </>
            )}
          </motion.button>

          <div className="space-y-3">
            <Link
              href="/login"
              className={`block text-center font-bold text-sm transition-colors ${
                isSun ? "text-teal-600 hover:text-teal-500" : "text-teal-300 hover:text-white"
              }`}
            >
              Already confirmed? Log In →
            </Link>
            <Link
              href="/register"
              className={`block text-center text-xs transition-colors ${
                isSun ? "text-indigo-500 hover:text-indigo-600" : "text-indigo-300/60 hover:text-white"
              }`}
            >
              ← Back to Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
