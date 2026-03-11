"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * 🔗 VisualConnectors Component
 * 
 * Subtle dashed SVG paths that visually connect UI elements,
 * implying a workflow/user journey from Bounties → Boss Raid
 * 
 * Positioned in the background layer to create depth
 */
export default function VisualConnectors() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const strokeColor = isSun ? "#059669" : "#34d399";

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Gradient for path fade effect */}
        <linearGradient id="pathGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="pathGradientRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Path from Left Sidebar (Bounties) curving down to Bottom (Boss Raid) */}
      <path
        d="M 18 40 Q 25 55, 35 65 Q 42 72, 50 78"
        fill="none"
        stroke="url(#pathGradientLeft)"
        strokeWidth="0.3"
        strokeDasharray="1 2"
        strokeLinecap="round"
      />

      {/* Path from Right Sidebar (Leaderboard) curving down to Bottom (Boss Raid) */}
      <path
        d="M 82 40 Q 75 55, 65 65 Q 58 72, 50 78"
        fill="none"
        stroke="url(#pathGradientRight)"
        strokeWidth="0.3"
        strokeDasharray="1 2"
        strokeLinecap="round"
      />

      {/* Subtle arc connecting left and right through center top */}
      <path
        d="M 22 25 Q 50 18, 78 25"
        fill="none"
        stroke={strokeColor}
        strokeWidth="0.2"
        strokeDasharray="0.5 1.5"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Decorative dots at key points */}
      <circle cx="18" cy="40" r="0.6" fill={strokeColor} opacity="0.6" />
      <circle cx="82" cy="40" r="0.6" fill={strokeColor} opacity="0.6" />
      <circle cx="50" cy="78" r="0.8" fill={strokeColor} opacity="0.7" />
    </svg>
  );
}
