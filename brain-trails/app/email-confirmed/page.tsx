"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { CheckCircle, Sparkles } from "lucide-react";
import BackgroundLayer from "@/components/layout/BackgroundLayer";

export default function EmailConfirmedPage() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

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
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, bounce: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg mb-6"
          >
            <CheckCircle className="w-10 h-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1
              className={`text-2xl font-bold mb-3 font-heading tracking-tight drop-shadow-md ${
                isSun ? "text-slate-800" : "text-white"
              }`}
            >
              Email Confirmed! ✨
            </h1>

            <p
              className={`text-sm mb-2 leading-relaxed ${
                isSun ? "text-slate-600" : "text-indigo-100/80"
              }`}
            >
              Your account has been activated successfully.
            </p>

            <p
              className={`text-xs mb-8 leading-relaxed max-w-sm mx-auto ${
                isSun ? "text-slate-500" : "text-indigo-200/60"
              }`}
            >
              Your adventure awaits, traveler! Log in to start exploring.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 w-full justify-center py-3.5 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white rounded-2xl font-bold shadow-lg transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Continue to Login
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
