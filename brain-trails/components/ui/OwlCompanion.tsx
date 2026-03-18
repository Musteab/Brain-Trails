"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

const TIPS = [
  "💡 Break big tasks into small quests!",
  "🧠 Spaced repetition boosts memory 3x!",
  "⏰ The Pomodoro technique: 25 min focus, 5 min break",
  "📖 Teaching a concept helps you learn it better",
  "🌟 Consistency beats intensity — study daily!",
  "🎯 Set clear goals before each study session",
  "💪 You're doing great, keep going!",
  "🔥 Your streak is your superpower!",
  "📝 Writing notes by hand improves retention",
  "🧘 Take deep breaths between sessions",
  "🌈 Celebrate small wins — they add up!",
  "⚡ Review before bed for better memory",
];

type OwlMood = "idle" | "studying" | "celebrating" | "sleepy";

interface OwlCompanionProps {
  mood?: OwlMood;
  className?: string;
  /** Show the owl's name plate */
  showName?: boolean;
}

/**
 * Animated owl scholar companion built with SVG + Framer Motion.
 * Replaces the heavy Spline 3D companion (~1.5MB+ runtime) with a
 * lightweight, theme-aware, interactive animated owl (~0KB extra deps).
 *
 * Moods:
 * - idle: gentle bob, occasional blinking
 * - studying: eyes focused, book-reading motion
 * - celebrating: happy bounce, sparkle eyes
 * - sleepy: droopy eyes, slow breathing
 */
export default function OwlCompanion({
  mood = "idle",
  className = "",
  showName = true,
}: OwlCompanionProps) {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyeTarget, setEyeTarget] = useState({ x: 0, y: 0 });

  // Periodic blinking
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const interval = setInterval(() => {
      // Random blink every 2-5 seconds
      const delay = Math.random() * 3000;
      setTimeout(blink, delay);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Subtle eye tracking based on random movement (simulates "looking around")
  useEffect(() => {
    if (mood === "sleepy") return;

    const moveEyes = () => {
      setEyeTarget({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 2,
      });
    };

    const interval = setInterval(moveEyes, 2500);
    return () => clearInterval(interval);
  }, [mood]);

  // Speech bubble with rotating tips
  const [tipIndex, setTipIndex] = useState(-1);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    // Show first tip after 5 seconds
    const initialDelay = setTimeout(() => {
      setTipIndex(Math.floor(Math.random() * TIPS.length));
      setShowTip(true);
    }, 5000);

    // Rotate tips every 12 seconds
    const rotateInterval = setInterval(() => {
      setShowTip(false);
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % TIPS.length);
        setShowTip(true);
      }, 500);
    }, 12000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(rotateInterval);
    };
  }, []);

  const getBodyBob = useCallback(() => {
    const ease = "easeInOut" as const;
    switch (mood) {
      case "celebrating":
        return {
          y: [0, -8, 0],
          rotate: [0, -3, 0, 3, 0],
          transition: { duration: 0.8, repeat: Infinity, ease },
        };
      case "studying":
        return {
          y: [0, -2, 0],
          transition: { duration: 3, repeat: Infinity, ease },
        };
      case "sleepy":
        return {
          y: [0, 2, 0],
          rotate: [0, 1, 0],
          transition: { duration: 4, repeat: Infinity, ease },
        };
      default: // idle
        return {
          y: [0, -4, 0],
          transition: { duration: 3.5, repeat: Infinity, ease },
        };
    }
  }, [mood]);

  // Theme-adaptive colors
  const colors = isSun
    ? {
        body: "#8B6914",
        bodyLight: "#C4963A",
        belly: "#F5E6C8",
        eyes: "#2D1B00",
        eyeWhite: "#FFFDF7",
        beak: "#E8A020",
        feet: "#D4882A",
        blush: "#FFB5A0",
        wing: "#7A5C10",
        ear: "#6B4F0E",
        cap: "#4A2C8A",
        capAccent: "#7B52C9",
        highlight: "#FFD700",
      }
    : {
        body: "#4A3A6B",
        bodyLight: "#7B62A8",
        belly: "#D8CCE8",
        eyes: "#E8E0F0",
        eyeWhite: "#1A1030",
        beak: "#C490E4",
        feet: "#8B6BB5",
        blush: "#C490E4",
        wing: "#3D2D5C",
        ear: "#2D1F48",
        cap: "#FFD700",
        capAccent: "#FFA500",
        highlight: "#9D4EDD",
      };

  // Eye height depends on blink/mood
  const eyeOpenHeight = mood === "sleepy" ? 6 : 14;
  const eyeHeight = isBlinking ? 2 : eyeOpenHeight;

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full select-none ${className}`}
    >
      <motion.div
        animate={getBodyBob()}
        className="relative"
        style={{ width: 180, height: 220 }}
      >
        <svg
          viewBox="0 0 180 220"
          width="180"
          height="220"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ===== EAR TUFTS ===== */}
          <motion.g
            animate={
              mood === "celebrating"
                ? { rotate: [0, -8, 0, 8, 0] }
                : { rotate: [0, -3, 0] }
            }
            transition={{
              duration: mood === "celebrating" ? 0.5 : 2,
              repeat: Infinity,
            }}
            style={{ originX: "62px", originY: "55px" }}
          >
            <path
              d="M 55 55 L 45 20 L 62 45 Z"
              fill={colors.ear}
              stroke={colors.body}
              strokeWidth="1"
            />
            <path
              d="M 50 38 L 48 25 L 56 40 Z"
              fill={colors.bodyLight}
              opacity="0.5"
            />
          </motion.g>
          <motion.g
            animate={
              mood === "celebrating"
                ? { rotate: [0, 8, 0, -8, 0] }
                : { rotate: [0, 3, 0] }
            }
            transition={{
              duration: mood === "celebrating" ? 0.5 : 2,
              repeat: Infinity,
            }}
            style={{ originX: "118px", originY: "55px" }}
          >
            <path
              d="M 125 55 L 135 20 L 118 45 Z"
              fill={colors.ear}
              stroke={colors.body}
              strokeWidth="1"
            />
            <path
              d="M 130 38 L 132 25 L 124 40 Z"
              fill={colors.bodyLight}
              opacity="0.5"
            />
          </motion.g>

          {/* ===== BODY (egg shape) ===== */}
          <ellipse
            cx="90"
            cy="120"
            rx="55"
            ry="65"
            fill={colors.body}
          />
          {/* Body shading */}
          <ellipse
            cx="90"
            cy="115"
            rx="52"
            ry="60"
            fill={colors.bodyLight}
            opacity="0.3"
          />

          {/* ===== BELLY ===== */}
          <ellipse
            cx="90"
            cy="130"
            rx="35"
            ry="40"
            fill={colors.belly}
            opacity="0.9"
          />
          {/* Belly chevron pattern */}
          <g opacity="0.15" fill={colors.body}>
            <path d="M 78 115 L 90 122 L 102 115" stroke={colors.body} strokeWidth="1.5" fill="none" />
            <path d="M 75 125 L 90 133 L 105 125" stroke={colors.body} strokeWidth="1.5" fill="none" />
            <path d="M 78 135 L 90 143 L 102 135" stroke={colors.body} strokeWidth="1.5" fill="none" />
          </g>

          {/* ===== WINGS ===== */}
          <motion.path
            d="M 35 100 Q 20 120 30 155 Q 40 150 45 130 Q 42 115 38 105 Z"
            fill={colors.wing}
            animate={
              mood === "celebrating"
                ? { rotate: [0, -15, 0], x: [0, -5, 0] }
                : mood === "studying"
                ? { rotate: [0, -3, 0] }
                : { rotate: [0, -2, 0] }
            }
            transition={{
              duration: mood === "celebrating" ? 0.6 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ originX: "45px", originY: "110px" }}
          />
          <motion.path
            d="M 145 100 Q 160 120 150 155 Q 140 150 135 130 Q 138 115 142 105 Z"
            fill={colors.wing}
            animate={
              mood === "celebrating"
                ? { rotate: [0, 15, 0], x: [0, 5, 0] }
                : mood === "studying"
                ? { rotate: [0, 3, 0] }
                : { rotate: [0, 2, 0] }
            }
            transition={{
              duration: mood === "celebrating" ? 0.6 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ originX: "135px", originY: "110px" }}
          />

          {/* ===== FACIAL DISC (owl face ring) ===== */}
          <ellipse
            cx="90"
            cy="88"
            rx="38"
            ry="32"
            fill={colors.belly}
            opacity="0.95"
          />
          <ellipse
            cx="90"
            cy="88"
            rx="38"
            ry="32"
            fill="none"
            stroke={colors.bodyLight}
            strokeWidth="2"
            opacity="0.5"
          />

          {/* ===== EYES ===== */}
          {/* Left eye socket */}
          <ellipse cx="72" cy="85" rx="15" ry="14" fill={colors.eyeWhite} />
          {/* Left pupil */}
          <motion.ellipse
            cx={72 + eyeTarget.x}
            cy={85 + eyeTarget.y}
            rx="7"
            ry={eyeHeight / 2}
            fill={colors.eyes}
            animate={{ ry: eyeHeight / 2 }}
            transition={{ duration: 0.1 }}
          />
          {/* Left eye shine */}
          {!isBlinking && mood !== "sleepy" && (
            <circle cx={69 + eyeTarget.x} cy={82 + eyeTarget.y} r="2.5" fill="white" opacity="0.9" />
          )}

          {/* Right eye socket */}
          <ellipse cx="108" cy="85" rx="15" ry="14" fill={colors.eyeWhite} />
          {/* Right pupil */}
          <motion.ellipse
            cx={108 + eyeTarget.x}
            cy={85 + eyeTarget.y}
            rx="7"
            ry={eyeHeight / 2}
            fill={colors.eyes}
            animate={{ ry: eyeHeight / 2 }}
            transition={{ duration: 0.1 }}
          />
          {/* Right eye shine */}
          {!isBlinking && mood !== "sleepy" && (
            <circle cx={105 + eyeTarget.x} cy={82 + eyeTarget.y} r="2.5" fill="white" opacity="0.9" />
          )}

          {/* Blush marks */}
          {(mood === "celebrating" || mood === "idle") && (
            <>
              <ellipse cx="58" cy="95" rx="6" ry="3" fill={colors.blush} opacity="0.3" />
              <ellipse cx="122" cy="95" rx="6" ry="3" fill={colors.blush} opacity="0.3" />
            </>
          )}

          {/* ===== BEAK ===== */}
          <path
            d="M 86 95 L 90 103 L 94 95 Z"
            fill={colors.beak}
          />

          {/* ===== SCHOLAR CAP (mortarboard) ===== */}
          <g>
            {/* Cap base */}
            <polygon
              points="52,58 90,42 128,58 90,68"
              fill={colors.cap}
            />
            {/* Cap top */}
            <rect x="82" y="42" width="16" height="6" rx="2" fill={colors.cap} />
            {/* Tassel */}
            <motion.g
              animate={{ rotate: [0, 8, 0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "128px", originY: "58px" }}
            >
              <line x1="128" y1="58" x2="140" y2="68" stroke={colors.capAccent} strokeWidth="2" />
              <circle cx="140" cy="70" r="3" fill={colors.capAccent} />
            </motion.g>
          </g>

          {/* ===== FEET ===== */}
          <g>
            {/* Left foot */}
            <ellipse cx="75" cy="183" rx="12" ry="5" fill={colors.feet} />
            <line x1="68" y1="183" x2="65" y2="186" stroke={colors.feet} strokeWidth="2" strokeLinecap="round" />
            <line x1="75" y1="183" x2="75" y2="187" stroke={colors.feet} strokeWidth="2" strokeLinecap="round" />
            <line x1="82" y1="183" x2="85" y2="186" stroke={colors.feet} strokeWidth="2" strokeLinecap="round" />
            {/* Right foot */}
            <ellipse cx="105" cy="183" rx="12" ry="5" fill={colors.feet} />
            <line x1="98" y1="183" x2="95" y2="186" stroke={colors.feet} strokeWidth="2" strokeLinecap="round" />
            <line x1="105" y1="183" x2="105" y2="187" stroke={colors.feet} strokeWidth="2" strokeLinecap="round" />
            <line x1="112" y1="183" x2="115" y2="186" stroke={colors.feet} strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* ===== BOOK (studying mood) ===== */}
          {mood === "studying" && (
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Book body */}
              <rect x="65" y="148" width="50" height="8" rx="1" fill="#D4882A" />
              <rect x="66" y="142" width="24" height="8" rx="1" fill="#FFF8E7" stroke="#D4882A" strokeWidth="0.5" />
              <rect x="90" y="142" width="24" height="8" rx="1" fill="#FFFDF7" stroke="#D4882A" strokeWidth="0.5" />
              {/* Book lines */}
              <line x1="70" y1="144" x2="86" y2="144" stroke="#ccc" strokeWidth="0.5" />
              <line x1="70" y1="146" x2="84" y2="146" stroke="#ccc" strokeWidth="0.5" />
              <line x1="70" y1="148" x2="80" y2="148" stroke="#ccc" strokeWidth="0.5" />
              <line x1="94" y1="144" x2="110" y2="144" stroke="#ccc" strokeWidth="0.5" />
              <line x1="94" y1="146" x2="108" y2="146" stroke="#ccc" strokeWidth="0.5" />
              {/* Book spine */}
              <line x1="90" y1="142" x2="90" y2="156" stroke="#B37A1A" strokeWidth="1" />
            </motion.g>
          )}

          {/* ===== SPARKLES (celebrating mood) ===== */}
          {mood === "celebrating" && (
            <>
              <motion.text
                x="30"
                y="65"
                fontSize="16"
                animate={{ opacity: [0, 1, 0], y: [65, 55, 45], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              >
                ✨
              </motion.text>
              <motion.text
                x="140"
                y="55"
                fontSize="14"
                animate={{ opacity: [0, 1, 0], y: [55, 45, 35], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                ⭐
              </motion.text>
              <motion.text
                x="85"
                y="30"
                fontSize="12"
                animate={{ opacity: [0, 1, 0], y: [30, 20, 10], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              >
                🌟
              </motion.text>
            </>
          )}

          {/* ===== ZZZ (sleepy mood) ===== */}
          {mood === "sleepy" && (
            <>
              <motion.text
                x="120"
                y="65"
                fontSize="12"
                fill={colors.bodyLight}
                fontWeight="bold"
                animate={{ opacity: [0, 1, 0], y: [65, 50, 35], x: [120, 125, 130] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
              >
                z
              </motion.text>
              <motion.text
                x="130"
                y="55"
                fontSize="16"
                fill={colors.bodyLight}
                fontWeight="bold"
                animate={{ opacity: [0, 1, 0], y: [55, 38, 20], x: [130, 137, 145] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
              >
                Z
              </motion.text>
              <motion.text
                x="142"
                y="40"
                fontSize="20"
                fill={colors.bodyLight}
                fontWeight="bold"
                animate={{ opacity: [0, 1, 0], y: [40, 20, 0], x: [142, 150, 158] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1.6 }}
              >
                Z
              </motion.text>
            </>
          )}
        </svg>
      </motion.div>

      {/* Name plate */}
      <AnimatePresence>
        {showName && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 px-4 py-1.5 rounded-full text-sm font-bold font-[family-name:var(--font-quicksand)] ${
              isSun
                ? "bg-amber-100/80 text-amber-800 border border-amber-200"
                : "bg-white/10 text-white/80 border border-white/20"
            }`}
          >
            {mood === "sleepy"
              ? "Archie is resting..."
              : mood === "studying"
              ? "Archie is studying!"
              : mood === "celebrating"
              ? "Archie is proud of you!"
              : "Archie the Scholar"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showTip && tipIndex >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className={`mt-2 px-3 py-2 rounded-xl text-xs font-[family-name:var(--font-quicksand)] text-center max-w-[200px] relative ${
              isSun
                ? "bg-white/90 text-slate-700 border border-slate-200 shadow-lg"
                : "bg-slate-800/90 text-slate-200 border border-slate-700 shadow-lg"
            }`}
          >
            {/* Speech bubble triangle */}
            <div
              className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${
                isSun ? "bg-white/90 border-l border-t border-slate-200" : "bg-slate-800/90 border-l border-t border-slate-700"
              }`}
            />
            {TIPS[tipIndex]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
