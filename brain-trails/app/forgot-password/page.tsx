"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSent(true);
    setIsSubmitting(false);
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
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border-white/20 border-2 rounded-3xl p-8 shadow-2xl overflow-hidden"
      >
        {/* Glow effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl" />

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
              <h2 className="text-2xl font-bold text-white mb-3 font-heading">
                Check Your Inbox 📬
              </h2>
              <p className="text-indigo-100/80 text-sm mb-6 leading-relaxed">
                We&apos;ve sent a password reset scroll to <strong className="text-white">{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-indigo-200/50 text-xs mb-6">
                Didn&apos;t receive it? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setIsSent(false); setEmail(""); }}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white rounded-2xl font-bold transition-all"
                >
                  Try Another Email
                </motion.button>
                <Link
                  href="/login"
                  className="block text-center text-violet-300 hover:text-white font-bold text-sm transition-colors"
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
                <h1 className="text-3xl font-bold text-white mb-2 font-heading tracking-tight drop-shadow-md">
                  Forgot Password?
                </h1>
                <p className="text-indigo-100/90 text-sm">
                  Enter your email and we&apos;ll send you a reset scroll.
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
                    <Mail className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/10 border-2 border-white/10 text-white rounded-2xl focus:outline-none focus:border-amber-400 focus:bg-white/20 transition-all placeholder:text-indigo-200/50"
                    placeholder="Email Address"
                    disabled={isSubmitting}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Reset Link
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-violet-300 hover:text-white font-bold text-sm transition-colors"
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
