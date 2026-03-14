"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * 📜 Footer Component
 * 
 * Handwritten-style footer with study companion signature
 */
export default function Footer() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return (
    <footer className={`mt-16 py-8 border-t ${isSun ? "border-amber-200/50" : "border-white/10"}`}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Handwritten Quote */}
        <p className={`font-serif italic text-lg mb-4 font-[family-name:var(--font-quicksand)] ${
          isSun ? "text-slate-600" : "text-slate-300"
        }`}>
          &ldquo;Every quest completed brings you closer to mastery...&rdquo;
        </p>
        
        {/* Signature with 3D Companion */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 relative flex items-center justify-center">
            {/* Temporary emoji fallback until Spline issues are resolved */}
            <div className="text-2xl animate-pulse">
              🤖
            </div>
          </div>
          <span className={`font-serif italic text-sm font-[family-name:var(--font-quicksand)] ${
            isSun ? "text-slate-500" : "text-slate-400"
          }`}>
            — Your Study Companion
          </span>
        </div>
      </div>
    </footer>
  );
}