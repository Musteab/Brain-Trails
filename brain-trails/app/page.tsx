"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Compass } from "lucide-react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import Dashboard from "@/components/dashboard/Dashboard";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  const needsOnboarding = !isLoading && !!profile && profile.onboarding_completed === false;

  // Redirect to onboarding if the user hasn't completed it yet.
  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  // Don't flash the dashboard while loading or while we're about to redirect
  // into onboarding - show a warm branded loader instead (avoids the jarring
  // blink, and makes the first-run hand-off feel intentional rather than stuck).
  if (isLoading || needsOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-transparent">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
        >
          <Compass className="w-8 h-8 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">
            {needsOnboarding ? "Setting up your adventure..." : "Loading your realm..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Dashboard />
      <TravelerHotbar />
    </div>
  );
}
