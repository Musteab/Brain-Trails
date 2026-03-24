"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Wizard's Desk - Main Wrapper Component
 * 
 * Full-screen container with dark wood texture background,
 * flickering candlelight effect, and atmospheric elements.
 */
export default function WizardsDesk({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Candlelight flicker effect
  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create multiple candlelight sources
      const candles = [
        { x: canvas.width * 0.15, y: canvas.height * 0.2, intensity: 0.6 },
        { x: canvas.width * 0.85, y: canvas.height * 0.15, intensity: 0.5 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1, intensity: 0.7 },
        { x: canvas.width * 0.25, y: canvas.height * 0.8, intensity: 0.4 },
        { x: canvas.width * 0.75, y: canvas.height * 0.85, intensity: 0.45 },
      ];

      candles.forEach((candle) => {
        // Flicker calculation
        const flicker = Math.sin(time * 3 + candle.x) * 0.15 + 
                       Math.sin(time * 5 + candle.y) * 0.1 +
                       Math.sin(time * 7) * 0.05;
        
        const radius = 300 + flicker * 100;
        const alpha = (candle.intensity + flicker * 0.3) * 0.15;

        // Warm candlelight gradient
        const gradient = ctx.createRadialGradient(
          candle.x, candle.y, 0,
          candle.x, candle.y, radius
        );
        gradient.addColorStop(0, `rgba(255, 180, 80, ${alpha * 1.5})`);
        gradient.addColorStop(0.3, `rgba(255, 140, 50, ${alpha})`);
        gradient.addColorStop(0.6, `rgba(200, 100, 30, ${alpha * 0.5})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(60, 40, 20, 0.4) 0%, transparent 50%),
          linear-gradient(180deg, #1a1025 0%, #0d0815 50%, #0a0610 100%)
        `,
      }}
    >
      {/* Wood grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(80, 50, 30, 0.1) 2px,
              rgba(80, 50, 30, 0.1) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              rgba(60, 35, 20, 0.15) 40px,
              rgba(60, 35, 20, 0.15) 42px
            ),
            repeating-linear-gradient(
              87deg,
              transparent,
              transparent 80px,
              rgba(100, 60, 30, 0.08) 80px,
              rgba(100, 60, 30, 0.08) 82px
            )
          `,
        }}
      />

      {/* Dark wood desk surface */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 100%, rgba(45, 30, 20, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 50%, rgba(30, 20, 15, 0.3) 0%, transparent 70%)
          `,
        }}
      />

      {/* Candlelight effect canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{ opacity: 0.8 }}
      />

      {/* Runic stone decorations */}
      {mounted && (
        <>
          {/* Scattered runic stones */}
          <RunicStone style={{ top: "10%", left: "5%", transform: "rotate(-15deg)" }} />
          <RunicStone style={{ top: "85%", left: "8%", transform: "rotate(25deg)" }} />
          <RunicStone style={{ top: "75%", right: "6%", transform: "rotate(-30deg)" }} />
          <RunicStone style={{ top: "15%", right: "4%", transform: "rotate(10deg)" }} />
          
          {/* Quill and inkwell */}
          <QuillInkwell style={{ bottom: "12%", left: "3%" }} />
          <QuillInkwell style={{ top: "8%", right: "2%", transform: "scaleX(-1)" }} />
          
          {/* Candle flames (decorative) */}
          <CandleFlame style={{ top: "5%", left: "12%" }} />
          <CandleFlame style={{ top: "3%", right: "15%" }} />
          <CandleFlame style={{ bottom: "8%", right: "10%" }} />
        </>
      )}

      {/* Scholar's Advisory Plaque */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="scholars-advisory-plaque absolute top-4 left-1/2 -translate-x-1/2 z-10"
      >
        <div 
          className="px-6 py-2 rounded-lg border-2 border-amber-700/50"
          style={{
            background: "linear-gradient(135deg, #3d2817 0%, #2a1a10 50%, #3d2817 100%)",
            boxShadow: `
              inset 0 1px 0 rgba(255, 200, 100, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3),
              0 4px 20px rgba(0, 0, 0, 0.5),
              0 0 40px rgba(255, 150, 50, 0.1)
            `,
          }}
        >
          <span 
            className="text-sm font-bold tracking-[0.3em] uppercase"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              background: "linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #daa520 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 20px rgba(255, 215, 0, 0.3)",
            }}
          >
            Scholar&apos;s Advisory
          </span>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(10, 6, 16, 0.4) 60%, rgba(10, 6, 16, 0.8) 100%)",
        }}
      />
    </div>
  );
}

// Decorative runic stone component
function RunicStone({ style }: { style: React.CSSProperties }) {
  const runes = ["", "", "", "", "", ""];
  const rune = runes[Math.floor(Math.random() * runes.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{ delay: Math.random() * 0.5 + 0.3, duration: 0.5 }}
      className="absolute w-8 h-10 flex items-center justify-center pointer-events-none"
      style={style}
    >
      <div 
        className="w-full h-full rounded-md flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <span 
          className="text-lg"
          style={{
            color: "#8b7355",
            textShadow: "0 0 10px rgba(139, 115, 85, 0.5)",
          }}
        >
          {rune}
        </span>
      </div>
    </motion.div>
  );
}

// Decorative quill and inkwell
function QuillInkwell({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="absolute pointer-events-none"
      style={style}
    >
      {/* Inkwell */}
      <div 
        className="w-6 h-5 rounded-b-full"
        style={{
          background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a15 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      />
      {/* Quill */}
      <div 
        className="absolute -top-8 left-1 w-1 h-12 origin-bottom"
        style={{
          background: "linear-gradient(180deg, #d4a574 0%, #8b6914 50%, #5c4a1f 100%)",
          transform: "rotate(-20deg)",
          borderRadius: "50% 50% 0 0",
        }}
      />
    </motion.div>
  );
}

// Animated candle flame
function CandleFlame({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={style}
      animate={{
        scale: [1, 1.1, 0.95, 1.05, 1],
        opacity: [0.8, 1, 0.7, 0.9, 0.8],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "loop",
      }}
    >
      {/* Candle body */}
      <div 
        className="w-3 h-8 rounded-t-sm"
        style={{
          background: "linear-gradient(180deg, #f5e6d3 0%, #d4c4a8 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      />
      {/* Flame */}
      <motion.div
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-4"
        style={{
          background: "radial-gradient(ellipse at bottom, #fff7e0 0%, #ffcc00 30%, #ff6600 60%, transparent 100%)",
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          filter: "blur(0.5px)",
        }}
        animate={{
          scaleY: [1, 1.2, 0.9, 1.1, 1],
          scaleX: [1, 0.9, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
      {/* Flame glow */}
      <div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 180, 50, 0.4) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />
    </motion.div>
  );
}
