"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, User, Lock, Mail, Loader2, Sparkles } from "lucide-react";
import SplineBackground from "@/components/layout/SplineBackground";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError("Please fill in all fields to forge your character.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { error: signUpError } = await signUp(email, password, username);

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
    } else {
      // Supabase auto logs in if email confirmations are disabled
      // Let's redirect to dashboard
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Failed to continue with Google");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <SplineBackground />
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border-white/20 border-2 rounded-3xl p-8 shadow-2xl overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-500 text-white shadow-lg mb-4"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2 font-heading tracking-tight drop-shadow-md">
              Create Character
            </h1>
            <p className="text-indigo-100/90 text-sm">
              Begin your study adventure today.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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
                  <User className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border-2 border-white/10 text-white rounded-2xl focus:outline-none focus:border-teal-400 focus:bg-white/20 transition-all placeholder:text-indigo-200/50"
                  placeholder="Traveler Name (Username)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border-2 border-white/10 text-white rounded-2xl focus:outline-none focus:border-teal-400 focus:bg-white/20 transition-all placeholder:text-indigo-200/50"
                  placeholder="Email Address"
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border-2 border-white/10 text-white rounded-2xl focus:outline-none focus:border-teal-400 focus:bg-white/20 transition-all placeholder:text-indigo-200/50"
                  placeholder="Password (min 6 chars)"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-300 hover:to-indigo-400 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Forge Destiny
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px bg-white/20 flex-1" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Or</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            type="button"
            className="w-full mt-6 py-3.5 px-4 bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
              />
              <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                fill="#4285F4"
              />
              <path
                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                fill="#FBBC05"
              />
              <path
                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                fill="#34A853"
              />
            </svg>
            Sign up with Google
          </motion.button>

          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm">
              Already have a character?{" "}
              <Link href="/login" className="text-teal-300 hover:text-white font-bold transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
