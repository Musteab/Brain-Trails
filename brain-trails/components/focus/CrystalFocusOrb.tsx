"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from "lucide-react";

interface CrystalFocusOrbProps {
  totalMinutes: number;
  onComplete?: () => void;
  onTick?: (remainingSeconds: number) => void;
  variant?: "cyan" | "purple" | "fire";
  size?: "sm" | "md" | "lg";
}

/**
 * Crystal Focus Orb - Pomodoro Timer Visualization
 * 
 * A pulsating, translucent crystal sphere that acts as a focus timer.
 * Features:
 * - Glass orb effect with inner glow
 * - Dynamic energy particles inside
 * - Progress ring showing time remaining
 * - Orbiting mana particles
 */
export default function CrystalFocusOrb({
  totalMinutes = 25,
  onComplete,
  onTick,
  variant = "cyan",
  size = "lg",
}: CrystalFocusOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(totalMinutes * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const totalSeconds = totalMinutes * 60;
  const progress = (totalSeconds - remainingSeconds) / totalSeconds;

  const sizeMap = {
    sm: { orb: 160, canvas: 200 },
    md: { orb: 220, canvas: 280 },
    lg: { orb: 280, canvas: 360 },
  };

  const colorSchemes = {
    cyan: {
      primary: "#00ffff",
      secondary: "#0891b2",
      glow: "rgba(0, 255, 255, 0.4)",
      inner: "rgba(6, 182, 212, 0.3)",
      particles: ["#00ffff", "#06b6d4", "#22d3ee", "#67e8f9"],
    },
    purple: {
      primary: "#a855f7",
      secondary: "#7c3aed",
      glow: "rgba(168, 85, 247, 0.4)",
      inner: "rgba(139, 92, 246, 0.3)",
      particles: ["#a855f7", "#8b5cf6", "#c084fc", "#d946ef"],
    },
    fire: {
      primary: "#f97316",
      secondary: "#dc2626",
      glow: "rgba(249, 115, 22, 0.4)",
      inner: "rgba(234, 88, 12, 0.3)",
      particles: ["#f97316", "#ef4444", "#fbbf24", "#fb923c"],
    },
  };

  const colors = colorSchemes[variant];
  const dimensions = sizeMap[size];

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newValue = prev - 1;
          onTick?.(newValue);
          
          if (newValue <= 0) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, onComplete, onTick]);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      life: number;
    }> = [];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const orbRadius = dimensions.orb / 2 - 20;

    // Initialize particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * orbRadius * 0.8;
      particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        color: colors.particles[Math.floor(Math.random() * colors.particles.length)],
        alpha: Math.random() * 0.5 + 0.3,
        life: Math.random() * 100,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((p) => {
        p.life += 0.02;
        
        if (isRunning) {
          p.x += p.vx;
          p.y += p.vy;

          // Bounce off orb boundary
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > orbRadius) {
            const angle = Math.atan2(dy, dx);
            p.x = centerX + Math.cos(angle) * orbRadius;
            p.y = centerY + Math.sin(angle) * orbRadius;
            p.vx = -p.vx * 0.8;
            p.vy = -p.vy * 0.8;
          }

          // Add some randomness
          p.vx += (Math.random() - 0.5) * 0.2;
          p.vy += (Math.random() - 0.5) * 0.2;

          // Damping
          p.vx *= 0.99;
          p.vy *= 0.99;
        }

        // Pulsing alpha
        const pulseAlpha = p.alpha * (0.5 + Math.sin(p.life) * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${pulseAlpha})`).replace("rgb", "rgba");
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        gradient.addColorStop(0, p.color.replace(")", `, ${pulseAlpha * 0.5})`).replace("rgb", "rgba"));
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [isRunning, variant, dimensions, colors.particles]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const reset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalMinutes * 60);
  };

  return (
    <div className="flex flex-col items-center">
      {/* The Crystal Orb */}
      <div 
        className="relative"
        style={{ width: dimensions.canvas, height: dimensions.canvas }}
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: isRunning
              ? [
                  `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}, 0 0 90px ${colors.inner}`,
                  `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}, 0 0 120px ${colors.inner}`,
                  `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}, 0 0 90px ${colors.inner}`,
                ]
              : `0 0 20px ${colors.glow}, 0 0 40px ${colors.inner}`,
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            top: (dimensions.canvas - dimensions.orb) / 2,
            left: (dimensions.canvas - dimensions.orb) / 2,
            width: dimensions.orb,
            height: dimensions.orb,
          }}
        />

        {/* Glass orb body */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            top: (dimensions.canvas - dimensions.orb) / 2,
            left: (dimensions.canvas - dimensions.orb) / 2,
            width: dimensions.orb,
            height: dimensions.orb,
            background: `
              radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 70%, ${colors.inner} 0%, transparent 50%),
              radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)
            `,
            boxShadow: `
              inset 0 -20px 40px ${colors.inner},
              inset 0 20px 40px rgba(255, 255, 255, 0.2),
              0 10px 30px rgba(0, 0, 0, 0.3)
            `,
            border: `2px solid ${colors.primary}40`,
          }}
        >
          {/* Inner glass reflection */}
          <div 
            className="absolute top-4 left-4 w-1/3 h-1/4 rounded-full opacity-60"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
              filter: "blur(8px)",
            }}
          />
        </div>

        {/* Canvas for particles */}
        <canvas
          ref={canvasRef}
          width={dimensions.canvas}
          height={dimensions.canvas}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Progress ring */}
        <svg
          className="absolute inset-0"
          style={{
            width: dimensions.canvas,
            height: dimensions.canvas,
          }}
        >
          <defs>
            <linearGradient id={`progressGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="50%" stopColor={colors.secondary} />
              <stop offset="100%" stopColor={colors.primary} />
            </linearGradient>
          </defs>
          <circle
            cx={dimensions.canvas / 2}
            cy={dimensions.canvas / 2}
            r={(dimensions.orb / 2) + 15}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="4"
          />
          <motion.circle
            cx={dimensions.canvas / 2}
            cy={dimensions.canvas / 2}
            r={(dimensions.orb / 2) + 15}
            fill="none"
            stroke={`url(#progressGradient-${variant})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * ((dimensions.orb / 2) + 15)}
            strokeDashoffset={2 * Math.PI * ((dimensions.orb / 2) + 15) * (1 - progress)}
            transform={`rotate(-90 ${dimensions.canvas / 2} ${dimensions.canvas / 2})`}
            style={{ filter: `drop-shadow(0 0 6px ${colors.primary})` }}
          />
        </svg>

        {/* Orbiting particles */}
        {isRunning && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: colors.particles[i],
                  boxShadow: `0 0 10px ${colors.particles[i]}, 0 0 20px ${colors.particles[i]}`,
                  top: "50%",
                  left: "50%",
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  transformOrigin: `0 ${(dimensions.orb / 2) + 25 + i * 10}px`,
                }}
              />
            ))}
          </>
        )}

        {/* Time Display */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: "none" }}
        >
          <div className="text-center">
            <motion.span
              className="font-bold font-mono"
              style={{
                fontSize: size === "lg" ? "3rem" : size === "md" ? "2.5rem" : "2rem",
                color: colors.primary,
                textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
              }}
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {formatTime(remainingSeconds)}
            </motion.span>
            <p 
              className="text-sm mt-1 opacity-60"
              style={{ color: colors.primary }}
            >
              {isRunning ? "Focus Mode Active" : "Ready to Focus"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={reset}
          className="p-3 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          <RotateCcw className="w-5 h-5 text-white/60" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning(!isRunning)}
          className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3"
          style={{
            background: isRunning
              ? `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`
              : `linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)`,
            border: `2px solid ${colors.primary}`,
            boxShadow: isRunning
              ? `0 0 30px ${colors.glow}, 0 4px 20px rgba(0, 0, 0, 0.3)`
              : "0 4px 20px rgba(0, 0, 0, 0.3)",
            color: isRunning ? "white" : colors.primary,
          }}
        >
          {isRunning ? (
            <>
              <Pause className="w-6 h-6" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Start Focus
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-white/60" />
          ) : (
            <VolumeX className="w-5 h-5 text-white/60" />
          )}
        </motion.button>
      </div>

      {/* Completion celebration */}
      <AnimatePresence>
        {remainingSeconds === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              className="px-8 py-6 rounded-3xl text-center"
              style={{
                background: `linear-gradient(135deg, ${colors.secondary}ee 0%, ${colors.primary}ee 100%)`,
                boxShadow: `0 0 60px ${colors.glow}`,
              }}
            >
              <span className="text-4xl mb-2 block">🎉</span>
              <h3 className="text-2xl font-bold text-white mb-1">Focus Complete!</h3>
              <p className="text-white/80">Great work, scholar!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
