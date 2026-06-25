"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  // into onboarding — show a quiet loader instead (avoids the jarring blink).
  if (isLoading || needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
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
