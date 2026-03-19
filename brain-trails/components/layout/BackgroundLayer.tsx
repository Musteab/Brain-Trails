/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * 🌙☀️ Background Component
 * 
 * Moon: Static parallax night sky (moon-parallax.jpg) + animated aurora + stars + shooting stars
 * Sun:  Static parallax morning sky (sun-parallax.png) + animated sparkles + golden motes
 *       + floating clouds + animated sun rays + warm dust particles
 */
export default function BackgroundLayer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any>(null);

  useEffect(() => {
    setParticles({
      // Night stars
      stars: Array.from({ length: 35 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        delay: Math.random() * 4,
        size: 1 + Math.random() * 2
      })),
      shootingStars: Array.from({ length: 3 }).map(() => ({
        left: 70 + Math.random() * 30,
        top: Math.random() * 30,
        delay: 5 + Math.random() * 15
      })),
      // Day sparkles — golden twinkling dots like the night stars
      sparkles: Array.from({ length: 30 }).map(() => ({
        left: Math.random() * 100,
        top: 5 + Math.random() * 55,
        delay: Math.random() * 8,
        duration: 2 + Math.random() * 3,
        size: 2 + Math.random() * 4
      })),
      // Floating warm dust particles
      dustMotes: Array.from({ length: 20 }).map(() => ({
        left: Math.random() * 100,
        top: 20 + Math.random() * 60,
        delay: Math.random() * 15,
        duration: 12 + Math.random() * 12,
        size: 3 + Math.random() * 5
      })),
      // Drifting clouds
      clouds: Array.from({ length: 5 }).map((_, i) => ({
        top: 15 + i * 12 + Math.random() * 8,
        width: 250 + Math.random() * 350,
        height: 30 + Math.random() * 50,
        delay: -(Math.random() * 80),
        duration: 50 + Math.random() * 40,
        opacity: 0.15 + Math.random() * 0.15,
      })),
    });
    setMounted(true);
  }, []);

  if (theme === "moon") {
    /* ══════ Night Mode ══════ */
    return (
      <>
        <div className="fixed inset-0 w-full h-full -z-50 bg-slate-900 overflow-hidden">
          <Image
            src="/assets/moon-parallax.jpg"
            alt="Night Sky Background"
            fill
            priority
            quality={90}
            className="object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-aurora opacity-70 mix-blend-screen" />
          {mounted && particles && (
            <>
              {particles.stars.map((s: any, i: number) => (
                <div key={`star-${i}`} className="particle-star" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, width: s.size, height: s.size }} />
              ))}
              {particles.shootingStars.map((s: any, i: number) => (
                <div key={`shooting-star-${i}`} className="particle-shooting-star" style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
              ))}
            </>
          )}
        </div>
        <div className="fixed inset-0 pointer-events-none -z-40" style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(15,23,42,0.6) 70%, rgba(15,23,42,0.95) 100%)" }} />
      </>
    );
  }

  /* ══════ Day / Morning Mode ══════
   * Uses the user's custom "new morning bg.jpg"
   * - Image covers the entire viewport (widescreen nature)
   * - Subtle warm color wash overlay
   * - Animated clouds and motes on top
   */
  return (
    <>
      <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-[#e6dbcf]">
        {/* Base image — cover viewport completely */}
        <Image
          src="/assets/new morning bg.jpg"
          alt="Morning Sky Background"
          fill
          priority
          quality={95}
          className="object-cover"
          style={{ objectPosition: "center center" }}
        />

        {/* Very subtle warm color wash overlay to unify tones with UI */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(175deg, rgba(200,180,230,0.05) 0%, transparent 30%, rgba(251,191,36,0.02) 70%, rgba(200,130,60,0.05) 100%)"
        }} />


        {mounted && particles && (
          <>
            {/* ★ Golden sparkle stars — twinkling like night stars but golden */}
            {particles.sparkles.map((s: any, i: number) => (
              <div
                key={`sparkle-${i}`}
                className="absolute"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  animation: `twinkle ${s.duration}s ease-in-out infinite`,
                  animationDelay: `${s.delay}s`,
                }}
              >
                {/* 4-pointed star shape using CSS */}
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 rounded-full" style={{
                    backgroundColor: "rgba(251,191,36,0.9)",
                    boxShadow: "0 0 6px rgba(251,191,36,0.7), 0 0 12px rgba(251,191,36,0.3)",
                  }} />
                </div>
              </div>
            ))}

            {/* ☁ Drifting clouds */}
            {particles.clouds.map((c: any, i: number) => (
              <div key={`cloud-${i}`} className="absolute rounded-full" style={{
                top: `${c.top}%`,
                width: `${c.width}px`,
                height: `${c.height}px`,
                background: `radial-gradient(ellipse, rgba(255,255,255,${c.opacity}) 0%, rgba(255,255,255,${c.opacity * 0.3}) 50%, transparent 70%)`,
                filter: "blur(15px)",
                animation: `cloud-drift ${c.duration}s linear infinite`,
                animationDelay: `${c.delay}s`,
              }} />
            ))}

            {/* ✨ Floating warm dust motes */}
            {particles.dustMotes.map((m: any, i: number) => (
              <div
                key={`dust-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${m.left}%`,
                  top: `${m.top}%`,
                  width: m.size,
                  height: m.size,
                  background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0) 70%)",
                  animation: `mote-float ${m.duration}s ease-in-out infinite`,
                  animationDelay: `${m.delay}s`
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Warm vignette */}
      <div className="fixed inset-0 pointer-events-none -z-40" style={{
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(180,120,60,0.08) 60%, rgba(120,70,30,0.15) 100%)"
      }} />
    </>
  );
}
