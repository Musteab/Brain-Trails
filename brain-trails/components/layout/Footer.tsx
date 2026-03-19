"use client";

import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

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
        {/* Footer Navigation */}
        <nav className="mb-8">
          <ul className="flex justify-center space-x-6 text-sm font-medium">
            <li><Link href="/shop" className={`hover:underline ${isSun ? "text-slate-600 hover:text-amber-500" : "text-slate-300 hover:text-amber-400"}`}>Merchant</Link></li>
            <li><Link href="/about" className={`hover:underline ${isSun ? "text-slate-600 hover:text-amber-500" : "text-slate-300 hover:text-amber-400"}`}>Grand Archive</Link></li>
            <li><Link href="/support" className={`hover:underline ${isSun ? "text-slate-600 hover:text-amber-500" : "text-slate-300 hover:text-amber-400"}`}>Support</Link></li>
          </ul>
        </nav>

        {/* Handwritten Quote */}
        <p className={`font-serif italic text-lg mb-4 font-[family-name:var(--font-quicksand)] ${
          isSun ? "text-slate-600" : "text-slate-300"
        }`}>
          &ldquo;Every quest completed brings you closer to mastery...&rdquo;
        </p>
        
        {/* Signature with 3D Companion */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 relative flex items-center justify-center">
            <div className="text-2xl animate-pulse">
              🦉
            </div>
          </div>
          <span className={`font-serif italic text-sm font-[family-name:var(--font-quicksand)] ${
            isSun ? "text-slate-500" : "text-slate-400"
          }`}>
            — Archie the Scholar <span className="ml-3 not-italic text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-amber-500/30">Brain Trails is still in Beta</span>
          </span>
        </div>
      </div>
    </footer>
  );
}