"use client";

import Image from "next/image";
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
export default function SplineBackground() {
  const { theme } = useTheme();

  if (theme === "moon") {
    // Night Mode - Moon Parallax Image with Vignette
    return (
      <>
        <div className="fixed inset-0 w-full h-full -z-50">
          <Image
            src="/assets/moon-parallax.jpg"
            alt="Night Sky Background"
            fill
            priority
            quality={90}
            className="object-cover"
          />
        </div>
        {/* Radial Vignette - lighter center, darker edges */}
        <div 
          className="fixed inset-0 pointer-events-none -z-40"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 100%)"
          }}
        />
      </>
    );
  }

  // Day Mode - Sun background image with warm vignette
  return (
    <>
      <div className="fixed inset-0 w-full h-full -z-50">
        <Image
          src="/assets/world.jpg"
          alt="World Background"
          fill
          priority
          quality={90}
          className="object-cover"
        />
      </div>
      {/* Radial Vignette - warm glow center, subtle darkening at edges */}
      <div 
        className="fixed inset-0 pointer-events-none -z-40"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,251,235,0.1) 10%, transparent 40%, rgba(0,0,0,0.15) 100%)"
        }}
      />
    </>
  );
}
