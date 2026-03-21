"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("Attempting password reset for:", email);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
      );

      if (resetError) {
        console.error("Supabase Reset Error:", resetError);
        setError(resetError.message);
        setIsSubmitting(false);
        return;
      }

      console.log("Reset email sent successfully");
      setIsSent(true);
    } catch (err: any) {
      console.error("Forgot Password Catch Clause:", err);
      setError(err.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <BackgroundLayer />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
        className={`relative z-10 w-full max-w-lg backdrop-blur-3xl border border-t-white/40 border-l-white/40 rounded-[2rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden ${
          isSun ? "bg-gradient-to-br from-white/70 to-white/40 border-white/60" : "bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-slate-700/50"
        }`}
      >
        {/* Glow effects specific to Forgot Password */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/20 rounded-full blur-[80px] -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/20 rounded-full blur-[80px] -z-10" />

        <div className="relative z-10">
          {isSent ? (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg mb-6"
              >
                <CheckCircle className="w-10 h-10" />
              </motion.div>
              <h2 className={`text-2xl font-bold mb-3 font-heading ${isSun ? "text-slate-800" : "text-white"}`}>
                Check Your Inbox 📬
              </h2>
              <p className={`text-sm mb-6 leading-relaxed ${isSun ? "text-slate-600" : "text-indigo-100/80"}`}>
                We&apos;ve sent a password reset scroll to <strong className={isSun ? "text-slate-800" : "text-white"}>{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className={`text-xs mb-6 ${isSun ? "text-slate-500" : "text-indigo-200/50"}`}>
                Didn&apos;t receive it? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setIsSent(false); setEmail(""); }}
                  className={`w-full py-3 px-4 border-2 rounded-2xl font-bold transition-all ${
                    isSun
                      ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
                      : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  }`}
                >
                  Try Another Email
                </motion.button>
                <Link
                  href="/login"
                  className={`block text-center font-bold text-sm transition-colors ${
                    isSun ? "text-violet-600 hover:text-violet-500" : "text-violet-300 hover:text-white"
                  }`}
                >
                  ← Back to Login
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg mb-4"
                >
                  <KeyRound className="w-8 h-8" />
                </motion.div>
                <h1 className={`text-4xl font-extrabold mb-3 font-heading tracking-tight drop-shadow-sm ${isSun ? "text-slate-800" : "text-white"}`}>
                  Rescue Password
                </h1>
                <p className={`text-base font-medium ${isSun ? "text-slate-600" : "text-rose-100/80"}`}>
                  Enter your email and we&apos;ll dispatch a recovery scroll.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    {error}
                  </motion.div>
                )}

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${isSun ? "text-slate-400 group-focus-within:text-amber-500" : "text-indigo-300 group-focus-within:text-white"}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl focus:outline-none transition-all ${
                      isSun
                        ? "bg-white/60 border-white/50 text-slate-800 focus:border-amber-400 focus:bg-white placeholder:text-slate-400"
                        : "bg-white/10 border-white/10 text-white focus:border-amber-400 focus:bg-white/20 placeholder:text-indigo-200/50"
                    }`}
                    placeholder="Email Address"
                    disabled={isSubmitting}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-4 py-4 px-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
                    isSun ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Dispatch Recovery Link
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className={`inline-flex items-center gap-1 font-bold text-sm transition-colors ${
                    isSun ? "text-violet-600 hover:text-violet-500" : "text-violet-300 hover:text-white"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
