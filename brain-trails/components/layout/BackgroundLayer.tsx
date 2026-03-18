/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * 🌙☀️ Background Component
 * 
 * Switches between:
 * - Moon (night): Static parallax image with vignette
 * - Sun (day): World image with radial gradient vignette
 * 
 * Includes radial gradient overlay for focus effect
 */
export default function BackgroundLayer() {
  const { theme } = useTheme();
  
  // Prevent hydration mismatch and pure render issues for randomly positioned elements
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any>(null);

  useEffect(() => {
    setParticles({
      stars: Array.from({ length: 30 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        delay: Math.random() * 4
      })),
      shootingStars: Array.from({ length: 3 }).map(() => ({
        left: 80 + Math.random() * 20,
        top: Math.random() * 30,
        delay: Math.random() * 15
      })),
      clouds: Array.from({ length: 6 }).map(() => ({
        top: Math.random() * 40,
        width: 150 + Math.random() * 200,
        height: 60 + Math.random() * 80,
        delay: Math.random() * -40,
        duration: 30 + Math.random() * 20
      })),
      sparkles: Array.from({ length: 15 }).map(() => ({
        left: Math.random() * 100,
        bottom: Math.random() * 20 - 10,
        delay: Math.random() * -10,
        duration: 8 + Math.random() * 6
      }))
    });
    setMounted(true);
  }, []);

  if (theme === "moon") {
    // Night Mode - Moon Parallax with animated Aurora and Stars
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
          
          {/* Animated Aurora */}
          <div className="absolute inset-0 bg-aurora opacity-70 mix-blend-screen" />
          
          {mounted && particles && (
            <>
              {/* Twinkling Stars */}
              {particles.stars.map((s: any, i: number) => (
                <div
                  key={`star-${i}`}
                  className="particle-star"
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    animationDelay: `${s.delay}s`
                  }}
                />
              ))}
              
              {/* Shooting Stars */}
              {particles.shootingStars.map((s: any, i: number) => (
                <div
                  key={`shooting-star-${i}`}
                  className="particle-shooting-star"
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    animationDelay: `${s.delay}s`
                  }}
                />
              ))}
            </>
          )}
        </div>
        {/* Radial Vignette */}
        <div 
          className="fixed inset-0 pointer-events-none -z-40"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, rgba(15,23,42,0.6) 70%, rgba(15,23,42,0.95) 100%)"
          }}
        />
      </>
    );
  }

  // Day Mode - Much softer, more polished daytime vibes
  return (
    <>
      <div className="fixed inset-0 w-full h-full -z-50 bg-slate-50 overflow-hidden">
        <Image
          src="/assets/world.jpg"
          alt="World Background"
          fill
          priority
          quality={90}
          className="object-cover opacity-40 mix-blend-multiply"
        />
        
        {/* Sun Glow */}
        <div className="absolute inset-0 bg-sun-glow mix-blend-screen opacity-60" />
        
        {mounted && particles && (
          <>
            {/* Drifting Clouds */}
            {particles.clouds.map((c: any, i: number) => (
              <div
                key={`cloud-${i}`}
                className="particle-cloud"
                style={{
                  top: `${c.top}%`,
                  width: `${c.width}px`,
                  height: `${c.height}px`,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`
                }}
              />
            ))}
            
            {/* Sparkles */}
            {particles.sparkles.map((s: any, i: number) => (
              <div
                key={`sparkle-${i}`}
                className="particle-sparkle"
                style={{
                  left: `${s.left}%`,
                  bottom: `${s.bottom}%`,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.duration}s`
                }}
              />
            ))}
          </>
        )}
      </div>
      {/* Radial Vignette - very subtle warm glow */}
      <div 
        className="fixed inset-0 pointer-events-none -z-40"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(217,179,130,0.08) 75%, rgba(120,80,30,0.06) 100%)"
        }}
      />
    </>
  );
}
