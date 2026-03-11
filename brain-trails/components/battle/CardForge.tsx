"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, X } from "lucide-react";

interface CardForgeProps {
  onForge?: () => void;
}

/**
 * ⚒️ CardForge Component
 * 
 * Magical floating action button for creating new flashcards
 */
export default function CardForge({ onForge }: CardForgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-28 right-6 z-30">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2
              px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-sm
              border border-white/10 whitespace-nowrap"
          >
            <span className="text-sm text-white font-medium">Forge New Flashcards</span>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1
              w-2 h-2 bg-slate-800/90 rotate-45 border-r border-t border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onHoverStart={() => {
          setIsHovered(true);
          setShowTooltip(true);
        }}
        onHoverEnd={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onForge}
        className="relative w-16 h-16 rounded-full
          bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500
          shadow-lg shadow-amber-500/40
          flex items-center justify-center
          overflow-hidden group"
      >
        {/* Animated glow ring */}
        <motion.div
          animate={{
            scale: isHovered ? [1, 1.5, 1] : 1,
            opacity: isHovered ? [0.5, 0, 0.5] : 0.3,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full
            bg-gradient-to-br from-amber-300 to-orange-400"
        />

        {/* Sparkle particles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0, 
                    x: 0, 
                    y: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: Math.cos(i * 60 * Math.PI / 180) * 40,
                    y: Math.sin(i * 60 * Math.PI / 180) * 40,
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  className="absolute w-2 h-2"
                >
                  <Sparkles className="w-full h-full text-amber-200" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={{ rotate: isHovered ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative z-10"
        >
          <Plus className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={3} />
        </motion.div>

        {/* Inner shine */}
        <div className="absolute inset-1 rounded-full 
          bg-gradient-to-t from-transparent to-white/20" />
      </motion.button>

      {/* Outer glow */}
      <div className="absolute inset-0 -z-10 rounded-full
        bg-amber-400/30 blur-xl scale-150 opacity-50" />
    </div>
  );
}
