"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const { theme } = useTheme();
  const isSun = theme === "sun";

  // Wait for the supabase client to pick up the recovery token from the URL hash
  // and establish a valid session before allowing the user to submit.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setIsReady(true);
        }
      }
    );

    // Also check if we already have a session (e.g. came via server-side code exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSuccess(true);
    setIsSubmitting(false);

    // Redirect to login after a brief delay
    setTimeout(() => router.push("/login"), 3000);
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
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl" />

        <div className="relative z-10">
          {isSuccess ? (
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
                Password Updated!
              </h2>
              <p className={`text-sm mb-4 ${isSun ? "text-slate-600" : "text-indigo-100/80"}`}>
                Your new password has been set. Redirecting to login...
              </p>
              <Link
                href="/login"
                className={`font-bold text-sm transition-colors ${
                  isSun ? "text-violet-600 hover:text-violet-500" : "text-violet-300 hover:text-white"
                }`}
              >
                Go to Login Now
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg mb-4"
                >
                  <ShieldCheck className="w-8 h-8" />
                </motion.div>
                <h1 className={`text-3xl font-bold mb-2 font-heading tracking-tight drop-shadow-md ${isSun ? "text-slate-800" : "text-white"}`}>
                  Set New Password
                </h1>
                <p className={`text-sm ${isSun ? "text-slate-600" : "text-indigo-100/90"}`}>
                  {isReady
                    ? "Choose a strong new password for your account."
                    : "Verifying your reset link..."}
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

                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 transition-colors ${isSun ? "text-slate-400 group-focus-within:text-emerald-500" : "text-indigo-300 group-focus-within:text-white"}`} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl focus:outline-none transition-all ${
                        isSun
                          ? "bg-white/60 border-white/50 text-slate-800 focus:border-emerald-400 focus:bg-white placeholder:text-slate-400"
                          : "bg-white/10 border-white/10 text-white focus:border-emerald-400 focus:bg-white/20 placeholder:text-indigo-200/50"
                      }`}
                      placeholder="New Password (min 6 chars)"
                      disabled={isSubmitting || !isReady}
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 transition-colors ${isSun ? "text-slate-400 group-focus-within:text-emerald-500" : "text-indigo-300 group-focus-within:text-white"}`} />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl focus:outline-none transition-all ${
                        isSun
                          ? "bg-white/60 border-white/50 text-slate-800 focus:border-emerald-400 focus:bg-white placeholder:text-slate-400"
                          : "bg-white/10 border-white/10 text-white focus:border-emerald-400 focus:bg-white/20 placeholder:text-indigo-200/50"
                      }`}
                      placeholder="Confirm New Password"
                      disabled={isSubmitting || !isReady}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || !isReady}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : !isReady ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Update Password
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className={`font-bold text-sm transition-colors ${
                    isSun ? "text-violet-600 hover:text-violet-500" : "text-violet-300 hover:text-white"
                  }`}
                >
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
