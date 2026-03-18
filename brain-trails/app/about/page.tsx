"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, Code2, Shield, Star, Sparkles, Heart, Users } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

/**
 * 📜 The Grand Archive — About Page
 *
 * Fantasy-themed "about" page explaining Brain Trails'
 * origins, the developer, and the current beta status.
 */
export default function AboutPage() {
  const { card, title, isSun } = useCardStyles();

  const sectionCard = `${card} p-6 lg:p-8`;

  return (
    <div className={`min-h-screen ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8 pb-32">
        {/* Back link */}
        <Link
          href="/"
          className={`inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
            isSun ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Grand Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-3">
            <BookOpen className={`w-8 h-8 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
            <h1
              className={`text-3xl lg:text-4xl font-black font-[family-name:var(--font-nunito)] ${title}`}
            >
              The Grand Archive
            </h1>
            <BookOpen className={`w-8 h-8 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
          </div>
          <p
            className={`text-sm italic ${
              isSun ? "text-slate-500" : "text-slate-400"
            }`}
          >
            &ldquo;Within these pages lies the story of the realm…&rdquo;
          </p>
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-px w-16 ${isSun ? "bg-amber-300" : "bg-amber-600"}`} />
            <Sparkles className={`w-4 h-4 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
            <div className={`h-px w-16 ${isSun ? "bg-amber-300" : "bg-amber-600"}`} />
          </div>
        </motion.div>

        {/* Section 1 — The Passion Project */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${sectionCard} mb-6`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSun
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              <Heart className="w-5 h-5" />
            </div>
            <h2
              className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${title}`}
            >
              The Passion Project
            </h2>
          </div>

          <div className={`space-y-3 text-sm leading-relaxed ${isSun ? "text-slate-600" : "text-slate-300"}`}>
            <p>
              <strong className={isSun ? "text-slate-800" : "text-white"}>Brain Trails</strong> was born from a simple belief: studying should feel like an adventure, not a chore.
            </p>
            <p>
              Inspired by RPGs, gamified apps, and the cozy aesthetics of Stardew Valley
              and Animal Crossing, Brain Trails transforms your daily study habits into
              quests, boss battles, and guild raids — all while keeping the focus on
              genuine learning.
            </p>
            <p>
              Whether you&apos;re preparing for exams, mastering a new skill, or just trying to
              build a consistent study streak, Brain Trails gives you a companion owl,
              flashcard decks, a notes spellbook, quiz battles, and a vibrant community
              of fellow scholars in guilds.
            </p>
          </div>
        </motion.section>

        {/* Section 2 — The Arch-Mage */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${sectionCard} mb-6`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSun
                  ? "bg-amber-100 text-amber-600"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              <Code2 className="w-5 h-5" />
            </div>
            <h2
              className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${title}`}
            >
              The Arch-Mage
            </h2>
          </div>

          <div className={`space-y-3 text-sm leading-relaxed ${isSun ? "text-slate-600" : "text-slate-300"}`}>
            <p>
              Brain Trails is designed, developed, and maintained by{" "}
              <strong className={isSun ? "text-slate-800" : "text-amber-400"}>Muste</strong>{" "}
              — a passionate developer and student who wanted to build the study tool
              they wished they had.
            </p>
            <p>
              Built with Next.js, Supabase, Framer Motion, and a lot of late-night
              coding sessions, every pixel of Brain Trails is crafted with care.
              From the animated owl companion to the glassmorphism cards, the goal
              is to make every interaction feel magical.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Shield className={`w-4 h-4 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                Realm Arch-Mage · Creator & Developer
              </span>
            </div>
          </div>
        </motion.section>

        {/* Section 3 — Beta Testing Realm */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${sectionCard} mb-6`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSun
                  ? "bg-blue-100 text-blue-600"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              <Star className="w-5 h-5" />
            </div>
            <h2
              className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${title}`}
            >
              The Beta Testing Realm
            </h2>
          </div>

          <div className={`space-y-3 text-sm leading-relaxed ${isSun ? "text-slate-600" : "text-slate-300"}`}>
            <p>
              Brain Trails is currently in{" "}
              <strong className={isSun ? "text-blue-600" : "text-blue-400"}>Beta</strong>.
              This means you&apos;re among the very first travelers to walk these trails!
            </p>
            <p>
              As a beta tester, you gain an exclusive{" "}
              <span className="text-blue-500 font-semibold">Beta Pioneer</span>{" "}
              frame and title that will never be available again once the realm opens
              to the public. Your feedback shapes the future of Brain Trails.
            </p>
            <p>
              Found a bug? Have a feature idea? Visit the{" "}
              <Link href="/support" className="text-emerald-500 hover:text-emerald-600 underline underline-offset-2">
                Support & Feedback
              </Link>{" "}
              page or reach out directly — every piece of feedback is treasured.
            </p>

            <div className={`mt-3 p-4 rounded-xl border ${
              isSun
                ? "bg-blue-50 border-blue-200"
                : "bg-blue-500/10 border-blue-400/20"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-4 h-4 ${isSun ? "text-blue-600" : "text-blue-400"}`} />
                <span className={`font-bold text-sm ${isSun ? "text-blue-700" : "text-blue-300"}`}>
                  Join the Journey
                </span>
              </div>
              <p className={`text-xs ${isSun ? "text-blue-600" : "text-blue-300"}`}>
                Every traveler who joins during the beta earns a permanent place in the
                Grand Archive. Thank you for being here!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Footer decorative */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className={`h-px w-12 ${isSun ? "bg-amber-300" : "bg-amber-600"}`} />
            <Sparkles className={`w-3.5 h-3.5 ${isSun ? "text-amber-400" : "text-amber-500"}`} />
            <div className={`h-px w-12 ${isSun ? "bg-amber-300" : "bg-amber-600"}`} />
          </div>
          <p className={`text-xs ${isSun ? "text-slate-400" : "text-slate-500"}`}>
            Brain Trails v1.0 Beta &middot; Built with 💜 by Muste
          </p>
        </motion.div>
      </div>

      <TravelerHotbar />
    </div>
  );
}
