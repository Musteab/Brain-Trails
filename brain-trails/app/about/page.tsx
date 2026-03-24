"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Code2, Shield, Star, Sparkles, Heart,
  ChevronLeft, ChevronRight, Github, Linkedin, Globe, Mail, MessageSquare,
  Sword, Scroll, Flame, Crown
} from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

/* ─── Arcane Symbols ─── */
const RUNES = ["ᚱ", "ᛊ", "ᚹ", "ᛗ", "ᚲ", "ᚨ", "ᛚ", "ᛞ", "ᚠ", "ᛉ", "ᚷ", "ᛃ", "✧", "❂", "✶", "✦", "✵", "⚝", "۞", "✪"];

const PAGES = [
  { id: "cover", title: "The Grand Archive", icon: BookOpen },
  { id: "passion", title: "The Passion Project", icon: Heart },
  { id: "archmage", title: "The Arch-Mage", icon: Code2 },
  { id: "beta", title: "The Beta Realm", icon: Star },
  { id: "features", title: "The Realm's Powers", icon: Sword },
  { id: "connect", title: "Find the Arch-Mage", icon: Globe },
];

/* ─── Floating Particle ─── */
function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-t from-purple-500/90 to-fuchsia-300/60 pointer-events-none filter drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
      style={{ left: `${x}%`, bottom: "-5%", width: size, height: size }}
      animate={{ y: [0, -1000], opacity: [0, 1, 0], scale: [0.5, 1.5, 0] }}
      transition={{ duration: 4 + Math.random() * 6, delay, repeat: Infinity, ease: "easeIn" }}
    />
  );
}

export default function AboutPage() {
  const { isSun } = useCardStyles();
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [introPhase, setIntroPhase] = useState<"dark" | "portal" | "reveal" | "done">("dark");

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase("portal"), 400);
    const t2 = setTimeout(() => setIntroPhase("reveal"), 2800);
    const t3 = setTimeout(() => setIntroPhase("done"), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const goTo = useCallback((page: number) => {
    if (page < 0 || page >= PAGES.length) return;
    setDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
  }, [currentPage]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
  };

  // Dark immersive color palette
  const textPrimary = "text-slate-100";
  const textSecondary = "text-slate-300";
  const textMuted = "text-slate-400";
  const cardBg = "bg-white/5 border-white/10 backdrop-blur-md";
  const accentGold = "text-amber-400";
  const accentPurple = "text-purple-400";

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ─── FULL SCREEN DARK BACKGROUND ─── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070512] via-[#100620] to-[#250540]" />
      
      {/* Heavy arcane glow at bottom */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-[80vh] bg-gradient-to-t from-purple-700/40 via-fuchsia-600/10 to-transparent pointer-events-none mix-blend-color-dodge"
        animate={{ opacity: [0.4, 0.9, 0.4], scaleY: [1, 1.05, 1] }}
        style={{ transformOrigin: "bottom" }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(168,85,247,0.5) 1px, transparent 0)`,
        backgroundSize: "40px 40px"
      }} />

      {/* Ambient glow orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/[0.08] blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/[0.08] blur-[90px] pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Slow spinning giant magic circles */}
      <motion.div 
        className="absolute w-[800px] h-[800px] border-[2px] border-purple-500/10 rounded-full border-dashed pointer-events-none mix-blend-screen"
        style={{ top: "-10%", right: "-10%" }}
        animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-10 border border-fuchsia-500/10 rounded-full" />
        <div className="absolute inset-20 border-[8px] border-double border-purple-400/5 rounded-full" />
      </motion.div>
      <motion.div 
        className="absolute w-[600px] h-[600px] border border-fuchsia-400/10 rounded-full pointer-events-none mix-blend-screen"
        style={{ bottom: "-10%", left: "-5%" }}
        animate={{ rotate: -360 }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-4 border-[2px] border-dashed border-purple-500/10 rounded-full" />
        <div className="absolute inset-12 border border-purple-300/10 rounded-full" />
      </motion.div>

      {/* Floating magical sparkles */}
      {Array.from({ length: 60 }).map((_, i) => (
        <FloatingParticle key={i} delay={Math.random() * 3} x={Math.random() * 100} size={2 + Math.random() * 6} />
      ))}

      {/* Floating arcane symbols */}
      {RUNES.slice(0, 20).map((rune, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl text-purple-400/30 font-bold pointer-events-none select-none drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
          style={{ left: `${5 + (i * 12) % 90}%`, top: `${10 + (i * 18) % 80}%` }}
          animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -40, 0], rotate: [0, 25, 0] }}
          transition={{ duration: 4 + Math.random() * 4, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
        >
          {rune}
        </motion.span>
      ))}

      {/* ─── CINEMATIC INTRO ─── */}
      <AnimatePresence>
        {introPhase !== "done" && (
          <motion.div className="absolute inset-0 z-[100] flex items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <motion.div className="absolute inset-0 bg-black" initial={{ opacity: 1 }} animate={{ opacity: introPhase === "reveal" ? 0 : 1 }} transition={{ duration: 1 }} />

            {(introPhase === "portal" || introPhase === "reveal") && (
              <motion.div className="relative z-10" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: introPhase === "reveal" ? 0 : 1 }} transition={{ duration: 1.5, ease: "easeOut" }}>
                <motion.div
                  className="w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-purple-400/60 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ boxShadow: "0 0 60px rgba(168,85,247,0.3), inset 0 0 40px rgba(168,85,247,0.15)" }}
                >
                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-full" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)" }} />
                </motion.div>
                {RUNES.slice(0, 8).map((rune, i) => (
                  <motion.span key={i} className="absolute text-xl md:text-2xl font-bold text-purple-300" style={{ top: "50%", left: "50%" }}
                    initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], rotate: [i * 45, i * 45 + 360], x: Math.cos((i * Math.PI * 2) / 8) * 160, y: Math.sin((i * Math.PI * 2) / 8) * 160 }}
                    transition={{ duration: 3, delay: 0.2 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}>
                    {rune}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {introPhase === "portal" && (
              <motion.div className="absolute z-20 text-center" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
                <BookOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-purple-400" strokeWidth={1.5} />
                <h1 className="text-3xl md:text-5xl font-black tracking-[0.3em] font-[family-name:var(--font-nunito)] text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-500">BRAIN TRAILS</h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-sm tracking-[0.5em] mt-3 text-purple-300">THE GRAND ARCHIVE</motion.p>
              </motion.div>
            )}

            {introPhase === "reveal" && Array.from({ length: 20 }).map((_, i) => (
              <motion.div key={`burst-${i}`} className="absolute w-2 h-2 rounded-full bg-purple-400" style={{ top: "50%", left: "50%" }}
                initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 0, x: Math.cos((i * Math.PI * 2) / 20) * (200 + Math.random() * 200), y: Math.sin((i * Math.PI * 2) / 20) * (200 + Math.random() * 200) }}
                transition={{ duration: 1, ease: "easeOut" }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introPhase === "done" ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 z-10 flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex gap-2">
            {PAGES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage ? "bg-purple-400 scale-150 shadow-lg shadow-purple-400/40" : "bg-slate-600 hover:bg-slate-500"
              }`} />
            ))}
          </div>
          <span className={`text-xs font-serif italic ${textMuted}`}>— {currentPage + 1} / {PAGES.length} —</span>
        </div>

        {/* Page content area */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-16 pb-20 overflow-hidden">
          <div className="w-full max-w-3xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {/* Page header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const Icon = PAGES[currentPage].icon;
                      return (
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-amber-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                          <Icon className={`w-6 h-6 ${accentPurple}`} />
                        </motion.div>
                      );
                    })()}
                    <h1 className={`text-3xl lg:text-4xl font-black font-[family-name:var(--font-nunito)] ${textPrimary}`}>
                      {PAGES[currentPage].title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-purple-500/50 to-transparent" />
                    <Sparkles className="w-3 h-3 text-amber-400/60" />
                    <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-amber-500/50 to-transparent" />
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>

                  {/* ── COVER ── */}
                  {currentPage === 0 && (
                    <div className="text-center py-8">
                      <motion.div animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity }} className="text-7xl mb-8">📚</motion.div>
                      <h2 className={`text-3xl font-bold font-[family-name:var(--font-nunito)] mb-5 ${textPrimary}`}>Welcome, Traveler</h2>
                      <p className={`text-base leading-relaxed max-w-lg mx-auto mb-3 ${textSecondary}`}>
                        Within these ancient pages lies the story of <span className={accentPurple}>Brain Trails</span> — a realm
                        where knowledge is power, studying is an adventure, and every scholar&apos;s journey is legendary.
                      </p>
                      <p className={`text-sm italic mt-6 ${textMuted}`}>&quot;Turn the pages to discover the secrets of the realm...&quot;</p>
                      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => goTo(1)}
                        className="mt-10 px-10 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 mx-auto bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow">
                        Begin Reading <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}

                  {/* ── PASSION ── */}
                  {currentPage === 1 && (
                    <div className={`space-y-5 text-base leading-relaxed ${textSecondary}`}>
                      <p><strong className={textPrimary}>Brain Trails</strong> was born from a simple belief: <em className={accentGold}>studying should feel like an adventure, not a chore.</em></p>
                      <p>Inspired by RPGs like Final Fantasy, gamified experiences like Habitica, and the cozy aesthetics of Stardew Valley — Brain Trails transforms your daily study habits into <strong className={textPrimary}>quests, boss battles, guild raids</strong>, and knowledge maps.</p>
                      <p className={`text-xs italic pt-2 ${textMuted}`}>&ldquo;Every quest completed brings you closer to mastery...&rdquo;</p>
                    </div>
                  )}

                  {/* ── ARCH-MAGE ── */}
                  {currentPage === 2 && (
                    <div className={`space-y-5 text-base leading-relaxed ${textSecondary}`}>
                      <p>Brain Trails is designed and maintained by <strong className={accentGold}>Muste</strong> — a passionate developer and student who wanted to build the study tool they wished they had growing up.</p>
                      <p>What started out as a basic flashcard script evolved into a full-blown gamified universe, complete with animated owls, a glassmorphism UI, and a cosmetics shop. It’s built on Next.js, Supabase, and Framer Motion, and fueled by a heavy mix of determination and coffee.</p>
                      <motion.div whileHover={{ scale: 1.02 }} className={`mt-6 p-6 rounded-2xl border flex items-center gap-5 shadow-xl shadow-purple-500/5 ${cardBg}`}>
                        <div className="w-18 h-18 rounded-full flex items-center justify-center text-4xl flex-shrink-0 bg-amber-500/10 ring-2 ring-amber-400/30 shadow-inner w-[72px] h-[72px]">👑</div>
                        <div>
                          <div className={`font-bold text-xl font-[family-name:var(--font-nunito)] ${textPrimary}`}>Muste</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Shield className={`w-3.5 h-3.5 ${accentGold}`} />
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${accentGold}`}>Realm Arch-Mage · Creator & Lead Developer</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ── BETA ── */}
                  {currentPage === 3 && (
                    <div className={`space-y-5 text-base leading-relaxed ${textSecondary}`}>
                      <p>Brain Trails is currently in <strong className="text-blue-400">Open Beta</strong>. You&apos;re among the very first travelers to walk these trails!</p>
                      <p>As a beta tester, you earn exclusive rewards that will <em>never</em> be available again:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <motion.div whileHover={{ scale: 1.03, y: -2 }} className={`p-5 rounded-xl border shadow-lg shadow-blue-500/5 ${cardBg}`}>
                          <div className="flex items-center gap-2 mb-2"><Crown className="w-5 h-5 text-blue-400" /><span className={`font-bold ${textPrimary}`}>Beta Pioneer Frame</span></div>
                          <p className={`text-sm ${textMuted}`}>An exclusive animated avatar frame featuring a blue shimmer effect.</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03, y: -2 }} className={`p-5 rounded-xl border shadow-lg shadow-blue-500/5 ${cardBg}`}>
                          <div className="flex items-center gap-2 mb-2"><Scroll className="w-5 h-5 text-blue-400" /><span className={`font-bold ${textPrimary}`}>Beta Trailblazer Title</span></div>
                          <p className={`text-sm ${textMuted}`}>A permanent title stamped on your profile and on the leaderboards.</p>
                        </motion.div>
                      </div>
                      <p>Your feedback directly shapes the future of this realm. If you find a bug or have a feature idea,</p>
                      <Link href="/support" className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 transition-all shadow-sm">
                        <Flame className="w-4 h-4" /> Submit Feedback
                      </Link>
                    </div>
                  )}

                  {/* ── FEATURES ── */}
                  {currentPage === 4 && (
                    <div className={`space-y-4 ${textSecondary}`}>
                      <p className="text-base leading-relaxed mb-6">The realm is vast, and its powers are many:</p>
                      <div className="space-y-3">
                        {[
                          { emoji: "⏳", title: "Focus Timer", desc: "Pomodoro-style sessions with XP rewards, ambient sounds, and cram mode" },
                          { emoji: "📖", title: "Spellbook Notes", desc: "Dual-page editor with slash commands, task lists, tables, and AI summaries" },
                          { emoji: "🃏", title: "Flashcard System", desc: "Spaced repetition with mastery tracking and boss battle integration" },
                          { emoji: "⚔️", title: "Boss Battles", desc: "Test your knowledge against legendary bosses — answer flashcards to deal damage" },
                          { emoji: "🛡️", title: "Guild System", desc: "Form study groups, compete in weekly raids, and climb the leaderboard" },
                          { emoji: "🗺️", title: "Knowledge Maps", desc: "Visual skill trees that track your progress across subjects" },
                        ].map((f, i) => (
                          <motion.div key={f.title} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                            whileHover={{ x: 6, scale: 1.01 }} className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-lg hover:shadow-purple-500/10 ${cardBg}`}>
                            <span className="text-2xl shrink-0 mt-0.5">{f.emoji}</span>
                            <div>
                              <span className={`text-sm font-bold ${textPrimary}`}>{f.title}</span>
                              <p className={`text-sm mt-0.5 ${textMuted}`}>{f.desc}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── CONNECT ── */}
                  {currentPage === 5 && (
                    <div className={`space-y-5 text-base leading-relaxed ${textSecondary}`}>
                      <p>Want to follow the development, report bugs, or just say hello?</p>
                      <div className="space-y-3 mt-4">
                        {[
                          { icon: Github, label: "GitHub", handle: "@musteab", color: "text-white", href: "https://github.com/musteab" },
                          { icon: Linkedin, label: "LinkedIn", handle: "Mustafa Ahmed", color: "text-sky-500", href: "https://www.linkedin.com/in/mustafe-ahmed-421006319" },
                          { icon: Globe, label: "Website", handle: "braintrails.dev", color: "text-emerald-400", href: "https://braintrails.dev" },
                          { icon: Mail, label: "Email", handle: "muste@braintrails.dev", color: "text-rose-400", href: "mailto:muste@braintrails.dev" },
                          { icon: MessageSquare, label: "Discord", handle: "@afromuste", color: "text-indigo-400", href: "https://discordapp.com/users/afromuste" },
                        ].map((s) => (
                          <motion.a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02, x: 4 }}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm hover:shadow-xl hover:shadow-purple-500/5 ${cardBg}`}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 shadow-sm">
                              <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${textPrimary}`}>{s.label}</div>
                              <div className={`text-xs ${textMuted}`}>{s.handle}</div>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                      <div className="text-center pt-10">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/40" />
                          <Sparkles className="w-3.5 h-3.5 text-amber-400/50" />
                          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/40" />
                        </div>
                        <p className={`text-xs ${textMuted}`}>Brain Trails v1.0.0.0 · Built with 💜 by Muste</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-6 md:px-16 z-20">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => goTo(currentPage - 1)} disabled={currentPage === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-20 disabled:cursor-not-allowed bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => goTo(currentPage + 1)} disabled={currentPage === PAGES.length - 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-20 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      <TravelerHotbar />
    </div>
  );
}
