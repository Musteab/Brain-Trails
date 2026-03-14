"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

interface LevelUpData {
  level: number;
  rewards?: string[];
}

// Singleton event bus
type LevelUpListener = (data: LevelUpData) => void;
const levelUpListeners = new Set<LevelUpListener>();

export function triggerLevelUp(level: number, rewards?: string[]) {
  levelUpListeners.forEach((fn) => fn({ level, rewards }));
}

export function useLevelUpCelebration() {
  const showLevelUp = useCallback((level: number, rewards?: string[]) => {
    triggerLevelUp(level, rewards);
  }, []);

  return { showLevelUp };
}

// ── Particle component ──────────────────────────────────
function Particle({ delay, isSun }: { delay: number; isSun: boolean }) {
  const x = Math.random() * 100; // vw percentage
  const size = 4 + Math.random() * 8;
  const duration = 2 + Math.random() * 2;
  const colors = isSun
    ? ["bg-amber-400", "bg-purple-400", "bg-emerald-400", "bg-pink-400", "bg-blue-400"]
    : ["bg-amber-300", "bg-purple-300", "bg-emerald-300", "bg-pink-300", "bg-blue-300"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: "100vh", x: `${x}vw` }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [100, -200 - Math.random() * 400],
        x: `${x + (Math.random() - 0.5) * 20}vw`,
        rotate: Math.random() * 720,
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={`absolute rounded-full ${color}`}
      style={{ width: size, height: size }}
    />
  );
}

// ── Main component ──────────────────────────────────────
export default function LevelUpCelebration() {
  const { isSun } = useCardStyles();
  const [data, setData] = useState<LevelUpData | null>(null);

  useEffect(() => {
    const handler: LevelUpListener = (d) => {
      setData(d);
    };

    levelUpListeners.add(handler);
    return () => {
      levelUpListeners.delete(handler);
    };
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => setData(null), 4000);
    return () => clearTimeout(timer);
  }, [data]);

  const handleDismiss = () => setData(null);

  // Generate particle indices
  const particles = Array.from({ length: 40 }, (_, i) => i);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[110] flex items-center justify-center cursor-pointer"
        >
          {/* Dark overlay */}
          <div
            className={`absolute inset-0 ${
              isSun ? "bg-black/40" : "bg-black/60"
            }`}
          />

          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((i) => (
              <Particle key={i} delay={i * 0.05} isSun={isSun} />
            ))}
          </div>

          {/* Central content */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Glow ring */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 60px 20px rgba(168, 85, 247, 0.3)",
                  "0 0 100px 40px rgba(168, 85, 247, 0.5)",
                  "0 0 60px 20px rgba(168, 85, 247, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-48 h-48 rounded-full"
            />

            {/* Stars */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute"
            >
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <motion.div
                  key={angle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: angle / 360 }}
                  className="absolute"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-80px)`,
                  }}
                >
                  <Star
                    className="w-4 h-4 text-amber-400 fill-amber-400"
                    style={{ filter: "drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))" }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* LEVEL UP text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles
                className="w-6 h-6 text-amber-400"
                style={{ filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))" }}
              />
              <h2
                className="text-2xl font-bold font-[family-name:var(--font-nunito)] text-amber-400 uppercase tracking-widest"
                style={{
                  textShadow: "0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)",
                }}
              >
                Level Up!
              </h2>
              <Sparkles
                className="w-6 h-6 text-amber-400"
                style={{ filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))" }}
              />
            </motion.div>

            {/* Level number */}
            <motion.div
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.4,
              }}
              className="relative mb-6"
            >
              <span
                className="text-8xl font-bold font-[family-name:var(--font-nunito)] text-white"
                style={{
                  textShadow:
                    "0 0 30px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.4), 0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {data.level}
              </span>
            </motion.div>

            {/* Rewards list */}
            {data.rewards && data.rewards.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className={`
                  px-6 py-3 rounded-2xl backdrop-blur-md
                  ${isSun
                    ? "bg-white/80 border border-white/60"
                    : "bg-white/10 border border-white/20"
                  }
                `}
              >
                <p
                  className={`text-xs font-bold mb-2 text-center uppercase tracking-wider ${
                    isSun ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Rewards Unlocked
                </p>
                <div className="flex flex-col gap-1">
                  {data.rewards.map((reward, i) => (
                    <motion.p
                      key={i}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className={`text-sm font-medium text-center font-[family-name:var(--font-quicksand)] ${
                        isSun ? "text-slate-700" : "text-white"
                      }`}
                    >
                      {reward}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tap to dismiss */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-6 text-xs text-white/50 font-[family-name:var(--font-quicksand)]"
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
