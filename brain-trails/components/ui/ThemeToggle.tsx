"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

/**
 * ☀️🌙 ThemeToggle Component
 * 
 * Toggle between Sun (day) and Moon (night) themes
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isSun = theme === "sun";

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-16 h-8 rounded-full p-1 transition-colors duration-300
        ${isSun 
          ? "bg-gradient-to-r from-amber-400 to-orange-400 border-2 border-amber-300" 
          : "bg-gradient-to-r from-indigo-800 to-slate-800 border-2 border-indigo-500/50"
        }
      `}
      aria-label={`Switch to ${isSun ? "night" : "day"} mode`}
    >
      {/* Toggle Circle */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          ${isSun 
            ? "bg-white shadow-md ml-auto" 
            : "bg-slate-700 shadow-md ml-0"
          }
        `}
      >
        {isSun ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-300" />
        )}
      </motion.div>

      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Moon className={`w-3 h-3 transition-opacity ${isSun ? "opacity-30 text-amber-600" : "opacity-0"}`} />
        <Sun className={`w-3 h-3 transition-opacity ${isSun ? "opacity-0" : "opacity-30 text-indigo-400"}`} />
      </div>
    </motion.button>
  );
}
