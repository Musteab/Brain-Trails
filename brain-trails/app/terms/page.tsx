"use client";

import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { useCardStyles } from "@/hooks/useCardStyles";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

export default function TermsOfServicePage() {
  const { card, title, isSun } = useCardStyles();
  const { user } = useAuth();

  return (
    <div className={`min-h-screen ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-12 pb-32">
        <Link
          href={user ? "/" : "/login"}
          className={`inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors ${
            isSun ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {user ? "Back to Dashboard" : "Back to Login"}
        </Link>

        <div className={`p-8 md:p-12 rounded-3xl border shadow-xl ${card}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-4 rounded-xl ${isSun ? "bg-amber-100 text-amber-600" : "bg-purple-500/20 text-purple-400"}`}>
              <Scale className="w-8 h-8" />
            </div>
            <h1 className={`text-3xl font-black font-[family-name:var(--font-nunito)] ${title}`}>
              Terms of Service
            </h1>
          </div>

          <div className={`space-y-6 leading-relaxed ${isSun ? "text-slate-600" : "text-slate-300"}`}>
            <p><strong>Last Updated:</strong> March 2026</p>
            
            <p>
              Welcome to Brain Trails. By accessing or using our application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>1. Beta Status Acknowledgment</h2>
            <p>
              Brain Trails is currently in a <strong>Beta Development Phase</strong>. This means the service is provided "as is" and "as available". We reserve the right to modify, wipe, or reset player data, leaderboards, or functionality at any time during this phase without prior notice.
            </p>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>2. User Conduct</h2>
            <p>By using Brain Trails, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate email information upon registration for account recovery.</li>
              <li>Not abuse or reverse-engineer the AI endpoints or spam generation requests.</li>
              <li>Maintain respectful conduct on leaderboards and future community features (such as Guilds).</li>
            </ul>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>3. Intellectual Property</h2>
            <p>
              The visual assets, code architectures, glassmorphic UI elements, and specific gamification systems (Titles, Frames, "Brain Trails" branding) remain the intellectual property of the developer. You may not scrape, clone, or redistribute the core graphics or platform code without explicit permission.
            </p>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>4. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, attempt to exploit the backend Supabase database, or engage in malicious behavior affecting other scholars.
            </p>
          </div>
        </div>

        <Footer />
      </div>

      {user && <TravelerHotbar />}
    </div>
  );
}
