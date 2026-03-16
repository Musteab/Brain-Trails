"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import Dashboard from "@/components/dashboard/Dashboard";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  // Redirect to onboarding if user hasn't completed it yet
  useEffect(() => {
    if (isLoading) return;
    if (profile && profile.onboarding_completed === false) {
      router.replace("/onboarding");
    }
  }, [profile, isLoading, router]);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Dashboard Content */}
      <Dashboard />

      {/* Floating Hotbar */}
      <TravelerHotbar />
    </div>
  );
}
