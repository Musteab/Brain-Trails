"use client";

import TravelerHotbar from "@/components/layout/TravelerHotbar";
import Dashboard from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Dashboard Content */}
      <Dashboard />

      {/* Floating Hotbar */}
      <TravelerHotbar />
    </div>
  );
}
