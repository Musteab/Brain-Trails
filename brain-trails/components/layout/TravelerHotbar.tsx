"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Hotbar item configuration with emoji/sticker-style icons
 */
interface HotbarItem {
  id: string;
  emoji: string;
  label: string;
  href: string;
}

const hotbarItems: HotbarItem[] = [
  { id: "dashboard", emoji: "⛺", label: "Camp", href: "/" },
  { id: "focus", emoji: "🌿", label: "Focus", href: "/focus" },
  { id: "battle", emoji: "⚔️", label: "Battle", href: "/battle" },
  { id: "notes", emoji: "📜", label: "Scrolls", href: "/notes" },
  { id: "flashcards", emoji: "🃏", label: "Cards", href: "/flashcards" },
];

/**
 * Individual hotbar button with bounce animation
 */
function HotbarButton({ 
  item, 
  isActive, 
  isExpanded,
  onClick 
}: { 
  item: HotbarItem; 
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center justify-center gap-2
        rounded-2xl transition-colors duration-200
        ${isExpanded ? "px-4 py-3" : "w-12 h-12"}
        ${isActive 
          ? "bg-gradient-to-b from-amber-300 to-amber-400 shadow-lg shadow-amber-200/50" 
          : "hover:bg-white/60"
        }
      `}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      {/* Emoji Icon */}
      <motion.span 
        className="text-xl drop-shadow-sm"
        animate={isActive ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {item.emoji}
      </motion.span>

      {/* Label - Only visible when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-bold whitespace-nowrap overflow-hidden ${
              isActive ? "text-amber-800" : "text-slate-600"
            }`}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active indicator dot (collapsed state) */}
      {isActive && !isExpanded && (
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
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
    </motion.button>
  );
}

/**
 * 🎮 Traveler Hotbar
 * 
 * A floating pill-shaped dock fixed at the bottom center.
 * 
 * Behavior:
 * - Default (Idle): Compact pill with icons only
 * - Hover (Active): Expands with spring animation to show labels
 * 
 * Visual: Glassmorphism "Soft Clay" background
 * Position: Fixed 32px from bottom edge
 * Shape: Heavy border-radius (50px pill)
 */
export default function TravelerHotbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine active item based on current path
  const getActiveItem = () => {
    const item = hotbarItems.find((item) => item.href === pathname);
    return item?.id || "dashboard";
  };

  const handleNavigation = (item: HotbarItem) => {
    router.push(item.href);
  };

  return (
    <motion.nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <motion.div
        className={`
          flex items-center
          bg-[#FDFCF5]/90 backdrop-blur-xl
          border border-white/60
          rounded-[50px]
          shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
        `}
        layout
        animate={{
          padding: isExpanded ? "12px 20px" : "8px 12px",
          gap: isExpanded ? "8px" : "4px",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      >
        {/* Inner soft glow */}
        <div className="absolute inset-0 rounded-[50px] bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
        
        {hotbarItems.map((item) => (
          <HotbarButton
            key={item.id}
            item={item}
            isActive={getActiveItem() === item.id}
            isExpanded={isExpanded}
            onClick={() => handleNavigation(item)}
          />
        ))}
      </motion.div>
    </motion.nav>
  );
}
