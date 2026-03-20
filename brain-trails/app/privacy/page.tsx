"use client";

import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { useCardStyles } from "@/hooks/useCardStyles";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className={`text-3xl font-black font-[family-name:var(--font-nunito)] ${title}`}>
              Privacy Policy
            </h1>
          </div>

          <div className={`space-y-6 leading-relaxed ${isSun ? "text-slate-600" : "text-slate-300"}`}>
            <p><strong>Last Updated:</strong> March 2026</p>
            
            <p>
              Welcome to Brain Trails! This Privacy Policy outlines how your personal information is collected, used, and protected when you use our service. Currently, Brain Trails is in a closed Beta state.
            </p>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>1. Information We Collect</h2>
            <p>We only collect the absolute minimum data required to power your study experience:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Your email address and a custom username so you can save progress.</li>
              <li><strong>Study Data:</strong> Your Syllabus, Flashcards, Topics, and progress data logic which is required to use the app.</li>
              <li><strong>No third-party tracking:</strong> We do not sell, trade, or share your data with advertising networks.</li>
            </ul>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>2. Security Measures</h2>
            <p>
              Your data is secured using Supabase&apos;s enterprise-grade security protocols with strict Row-Level Security (RLS) policies. Only you have the cryptographic clearance to read or alter your own study progress.
            </p>

            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>3. Third-Party AI Services</h2>
            <p>
              When you use the "AI Generate" features, the names of your subjects and topics are sent contextually to Google Gemini or Groq to generate flashcards. No personally identifying information is attached to these prompts.
            </p>
            
            <h2 className={`text-xl font-bold mt-8 mb-4 ${title}`}>4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please open a ticket on our Support page.
            </p>
          </div>
        </div>

        <Footer />
      </div>

      {user && <TravelerHotbar />}
    </div>
  );
}
