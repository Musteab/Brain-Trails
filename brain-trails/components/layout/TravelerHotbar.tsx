"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gameText } from "@/constants/gameText";

/**
 * Hotbar item configuration with emoji/sticker-style icons
 */
interface HotbarItem {
  id: string;
  emoji: string;
  label: string;
  href: string;
}

// ── Primary bar: always visible (5 items) ────────────────
const primaryItems: HotbarItem[] = [
  { id: "dashboard", emoji: "⛺", label: gameText.hotbar.home, href: "/" },
  { id: "focus", emoji: "🌿", label: gameText.hotbar.focus, href: "/focus" },
  { id: "battle", emoji: "⚔️", label: gameText.hotbar.battle, href: "/battle" },
  { id: "flashcards", emoji: "🃏", label: gameText.hotbar.cards, href: "/flashcards" },
  { id: "settings", emoji: "⚙️", label: gameText.navigation.settings, href: "/settings" },
];

// ── Overflow: shown in pop-up grid (6 items) ─────────────
const overflowItems: HotbarItem[] = [
  { id: "notes", emoji: "📜", label: gameText.study.notes, href: "/notes" },
  { id: "knowledge", emoji: "🗺️", label: gameText.hotbar.knowledge, href: "/knowledge" },
  { id: "guild", emoji: "🛡️", label: gameText.hotbar.guild, href: "/guild" },
  { id: "achievements", emoji: "🏆", label: gameText.hotbar.achievements, href: "/achievements" },
  { id: "shop", emoji: "🛒", label: gameText.hotbar.shop, href: "/shop" },
  { id: "report", emoji: "📊", label: gameText.hotbar.report, href: "/report" },
];

const allItems = [...primaryItems, ...overflowItems];

/**
 * Individual hotbar button with bounce animation
 */
function HotbarButton({
  item,
  isActive,
  onClick,
}: {
  item: HotbarItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-11 h-11 rounded-2xl transition-colors duration-200
        ${isActive
          ? "bg-gradient-to-b from-amber-300 to-amber-400 shadow-lg shadow-amber-200/50"
          : "hover:bg-white/60"
        }
      `}
      whileHover={{ y: -3, scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      title={item.label}
    >
      <motion.span
        className="text-lg drop-shadow-sm"
        animate={isActive ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {item.emoji}
      </motion.span>

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500"
          layoutId="activeDot"
        />
      )}

      {/* Active glow ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/50"
          layoutId="activeRing"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

/**
 * Overflow grid item (compact, with label)
 */
function OverflowButton({
  item,
  isActive,
  onClick,
}: {
  item: HotbarItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={`
        flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-colors
        ${isActive
          ? "bg-gradient-to-b from-amber-300 to-amber-400 shadow-md shadow-amber-200/40"
          : "hover:bg-white/60"
        }
      `}
    >
      <span className="text-lg drop-shadow-sm">{item.emoji}</span>
      <span
        className={`text-[10px] font-bold leading-none ${
          isActive ? "text-amber-800" : "text-slate-500"
        }`}
      >
        {item.label}
      </span>
    </motion.button>
  );
}

/**
 * Traveler Hotbar
 *
 * Compact floating dock with 5 primary items + a "..." toggle
 * that reveals a pop-up grid for the remaining items.
 */
export default function TravelerHotbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showOverflow, setShowOverflow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeId =
    allItems.find((item) => item.href === pathname)?.id || "dashboard";

  // Is the active item in the overflow group?
  const overflowActive = overflowItems.some((i) => i.id === activeId);

  const handleNavigation = (item: HotbarItem) => {
    router.push(item.href);
    setShowOverflow(false);
  };

  // Close overflow when clicking outside
  useEffect(() => {
    if (!showOverflow) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showOverflow]);

  return (
    <div ref={containerRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Overflow pop-up grid */}
      <AnimatePresence>
        {showOverflow && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`
              absolute bottom-full mb-3 left-1/2 -translate-x-1/2
              grid grid-cols-3 gap-1 p-2
              bg-[#FDFCF5]/95 backdrop-blur-xl
              border border-white/60
              rounded-2xl
              shadow-[0_8px_40px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.08)]
            `}
          >
            {overflowItems.map((item) => (
              <OverflowButton
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                onClick={() => handleNavigation(item)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main hotbar */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      >
        <motion.div
          className={`
            flex items-center gap-1 px-3 py-2
            bg-[#FDFCF5]/90 backdrop-blur-xl
            border border-white/60
            rounded-[50px]
            shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
          `}
        >
          {/* Inner soft glow */}
          <div className="absolute inset-0 rounded-[50px] bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />

          {primaryItems.map((item) => (
            <HotbarButton
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={() => handleNavigation(item)}
            />
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200/60 mx-0.5" />

          {/* More toggle */}
          <motion.button
            onClick={() => setShowOverflow((v) => !v)}
            className={`
              relative flex items-center justify-center
              w-11 h-11 rounded-2xl transition-colors duration-200
              ${showOverflow || overflowActive
                ? "bg-gradient-to-b from-purple-300 to-purple-400 shadow-md shadow-purple-200/40"
                : "hover:bg-white/60"
              }
            `}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            title="More"
          >
            <motion.span
              className="text-lg drop-shadow-sm"
              animate={showOverflow ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              {overflowActive && !showOverflow
                ? overflowItems.find((i) => i.id === activeId)?.emoji || "..."
                : "..."}
            </motion.span>

            {/* Dot indicator when an overflow page is active */}
            {overflowActive && !showOverflow && (
              <motion.div
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-purple-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            )}
          </motion.button>
        </motion.div>
      </motion.nav>
    </div>
  );
}
