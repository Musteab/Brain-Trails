"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface XPPopupItem {
  id: number;
  xp: number;
  gold: number;
}

let popupCounter = 0;

/**
 * Animated floating "+X XP" / "+X Gold" notification.
 *
 * Usage:
 *   const { showXPPopup } = useXPPopup();
 *   showXPPopup(50, 10); // +50 XP, +10 Gold
 *
 * Mount <XPPopup /> once in your layout.
 */

// Singleton event bus for triggering popups from anywhere
type PopupListener = (xp: number, gold: number) => void;
const listeners = new Set<PopupListener>();

export function triggerXPPopup(xp: number, gold: number = 0) {
  listeners.forEach((fn) => fn(xp, gold));
}

export function useXPPopup() {
  const showXPPopup = useCallback((xp: number, gold: number = 0) => {
    triggerXPPopup(xp, gold);
  }, []);

  return { showXPPopup };
}

export default function XPPopup() {
  const { isSun } = useCardStyles();
  const [popups, setPopups] = useState<XPPopupItem[]>([]);

  useEffect(() => {
    const handler: PopupListener = (xp, gold) => {
      const id = ++popupCounter;
      setPopups((prev) => [...prev, { id, xp, gold }]);

      // Auto-remove after animation
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 2000);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <div className="fixed top-20 right-6 z-[90] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.6 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="flex flex-col items-end gap-0.5"
          >
            {popup.xp > 0 && (
              <motion.div
                initial={{ x: 10 }}
                animate={{ x: 0 }}
                className={`
                  px-4 py-2 rounded-2xl font-bold text-sm font-[family-name:var(--font-nunito)]
                  backdrop-blur-md shadow-lg
                  ${isSun
                    ? "bg-purple-500/90 text-white shadow-purple-200/50"
                    : "bg-purple-500/80 text-white shadow-purple-500/30"
                  }
                `}
              >
                +{popup.xp} XP
              </motion.div>
            )}
            {popup.gold > 0 && (
              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`
                  px-3 py-1.5 rounded-2xl font-bold text-xs font-[family-name:var(--font-nunito)]
                  backdrop-blur-md shadow-lg
                  ${isSun
                    ? "bg-amber-500/90 text-white shadow-amber-200/50"
                    : "bg-amber-500/80 text-white shadow-amber-500/30"
                  }
                `}
              >
                +{popup.gold} Gold
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
