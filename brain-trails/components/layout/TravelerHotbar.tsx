"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gameText } from "@/constants/gameText";

interface HotbarItem {
  id: string;
  emoji: string;
  label: string;
  href: string;
}

const hotbarItems: HotbarItem[] = [
  { id: "dashboard", emoji: "⛺", label: gameText.hotbar.home, href: "/" },
  { id: "focus", emoji: "🌿", label: gameText.hotbar.focus, href: "/focus" },
  { id: "battle", emoji: "⚔️", label: gameText.hotbar.battle, href: "/battle" },
  { id: "notes", emoji: "📜", label: gameText.study.notes, href: "/notes" },
  { id: "flashcards", emoji: "🃏", label: gameText.hotbar.cards, href: "/flashcards" },
  { id: "knowledge", emoji: "🗺️", label: gameText.hotbar.knowledge, href: "/knowledge" },
  { id: "guild", emoji: "🛡️", label: gameText.hotbar.guild, href: "/guild" },
  { id: "achievements", emoji: "🏆", label: gameText.hotbar.achievements, href: "/achievements" },
  { id: "shop", emoji: "🛒", label: gameText.hotbar.shop, href: "/shop" },
  { id: "report", emoji: "📊", label: gameText.hotbar.report, href: "/report" },
  { id: "settings", emoji: "⚙️", label: gameText.navigation.settings, href: "/settings" },
];

/**
 * Grid menu item — emoji + label
 */
function MenuItem({
  item,
  isActive,
  index,
  onClick,
}: {
  item: HotbarItem;
  isActive: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
        delay: index * 0.03,
      }}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      className={`
        flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl transition-colors
        ${isActive
          ? "bg-gradient-to-b from-amber-300 to-amber-400 shadow-md shadow-amber-200/40"
          : "hover:bg-white/70"
        }
      `}
    >
      <span className="text-xl drop-shadow-sm">{item.emoji}</span>
      <span
        className={`text-[10px] font-bold leading-none whitespace-nowrap ${
          isActive ? "text-amber-800" : "text-slate-500"
        }`}
      >
        {item.label}
      </span>
    </motion.button>
  );
}

/**
 * Traveler Hotbar — Collapsible Dot
 *
 * Idle state: a single floating orb at the bottom-right showing the
 * current page's emoji. Clicking it fans out a grid menu with all
 * navigation items. Clicking outside or selecting an item closes it.
 */
export default function TravelerHotbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeItem =
    hotbarItems.find((item) => item.href === pathname) || hotbarItems[0];

  const handleNavigation = (item: HotbarItem) => {
    router.push(item.href);
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Expanded grid menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className={`
              absolute bottom-full right-0 mb-3
              grid grid-cols-4 gap-1 p-2.5
              bg-[#FDFCF5]/95 backdrop-blur-xl
              border border-white/60
              rounded-3xl
              shadow-[0_12px_48px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.08)]
              min-w-[260px]
            `}
          >
            {/* Inner soft glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />

            {hotbarItems.map((item, i) => (
              <MenuItem
                key={item.id}
                item={item}
                isActive={activeItem.id === item.id}
                index={i}
                onClick={() => handleNavigation(item)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The dot / orb */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.3,
        }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        className={`
          relative w-14 h-14 rounded-full
          flex items-center justify-center
          transition-shadow duration-300
          ${isOpen
            ? "bg-gradient-to-br from-purple-400 to-purple-600 shadow-[0_4px_24px_rgba(147,51,234,0.5)]"
            : "bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_4px_24px_rgba(245,158,11,0.4)]"
          }
        `}
        title={isOpen ? "Close menu" : "Open navigation"}
      >
        {/* Glow ring */}
        <motion.div
          className={`absolute inset-0 rounded-full ${
            isOpen ? "ring-2 ring-purple-300/50" : "ring-2 ring-amber-300/50"
          }`}
          animate={
            isOpen
              ? {}
              : { scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }
          }
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <AnimatePresence mode="wait">
          <motion.span
            key={isOpen ? "close" : activeItem.id}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="text-2xl drop-shadow-md"
          >
            {isOpen ? "✕" : activeItem.emoji}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
