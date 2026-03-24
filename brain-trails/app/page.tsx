"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import WizardsDeskLayout from "@/components/layout/WizardsDeskLayout";
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
    <WizardsDeskLayout showPlaque={true} responsiveNav={true}>
      <Dashboard noBackground={true} />
    </WizardsDeskLayout>
  );
}
