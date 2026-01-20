"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { gameText } from "@/constants/gameText";

// Lucide icons as fallbacks
import { 
  Tent, 
  Droplets, 
  Sword, 
  Backpack, 
  CreditCard 
} from "lucide-react";

/**
 * Hotbar item configuration
 * Structured to easily swap between PNG assets and Lucide icons
 */
interface HotbarItem {
  id: string;
  label: string;
  /** Path to PNG icon in public/assets/icons/ */
  iconPath?: string;
  /** Lucide icon component as fallback */
  FallbackIcon: React.ComponentType<{ className?: string; size?: number }>;
  /** Navigation path or action */
  href?: string;
}

const hotbarItems: HotbarItem[] = [
  {
    id: "camp",
    label: gameText.hotbar.home,
    iconPath: "/assests/icons/tent.png",
    FallbackIcon: Tent,
    href: "/",
  },
  {
    id: "quests",
    label: gameText.hotbar.quests,
    iconPath: "/assests/icons/paper.png", // Using paper for quests
    FallbackIcon: Droplets,
    href: "/quests",
  },
  {
    id: "battle",
    label: gameText.hotbar.battle,
    iconPath: "/assests/icons/sword.png",
    FallbackIcon: Sword,
    href: "/battle",
  },
  {
    id: "inventory",
    label: gameText.hotbar.inventory,
    iconPath: "/assests/icons/layers.png", // Using layers for bag
    FallbackIcon: Backpack,
    href: "/inventory",
  },
  {
    id: "cards",
    label: gameText.hotbar.cards,
    iconPath: "/assests/icons/puzzle.png", // Using puzzle for cards
    FallbackIcon: CreditCard,
    href: "/flashcards",
  },
];

/**
 * Individual hotbar button with bounce animation
 */
interface HotbarButtonProps {
  item: HotbarItem;
  isActive: boolean;
  onClick: () => void;
}

function HotbarButton({ item, isActive, onClick }: HotbarButtonProps) {
  const [imageError, setImageError] = useState(false);
  const { FallbackIcon } = item;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-16 h-16 rounded-2xl
        transition-colors duration-200
        ${isActive 
          ? "bg-primary/60" 
          : "hover:bg-white/40"
        }
      `}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      {/* Icon Container */}
      <div className="relative w-8 h-8 mb-1">
        {item.iconPath && !imageError ? (
          <Image
            src={item.iconPath}
            alt={item.label}
            fill
            className="object-contain drop-shadow-sm"
            onError={() => setImageError(true)}
          />
        ) : (
          <FallbackIcon 
            size={28} 
            className={`
              ${isActive ? "text-accent" : "text-foreground/70"}
              transition-colors duration-200
            `}
          />
        )}
      </div>

      {/* Label */}
      <span 
        className={`
          text-[10px] font-semibold tracking-wide
          ${isActive ? "text-accent" : "text-foreground/60"}
          transition-colors duration-200
        `}
      >
        {item.label}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 w-1.5 h-1.5 bg-accent rounded-full"
          layoutId="activeIndicator"
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
 * A floating pill-shaped dock fixed at the bottom center of the screen.
 * Features glassmorphism styling and bounce animations on hover.
 * 
 * "Nintendo meets Notion" aesthetic - cozy and playful navigation.
 */
export default function TravelerHotbar() {
  const [activeItem, setActiveItem] = useState("camp");

  return (
    <motion.nav
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-1 px-4 py-3
        bg-white/80 backdrop-blur-md
        border border-white/30
        rounded-[2rem]
        shadow-[0_8px_32px_rgba(0,0,0,0.08)]
      `}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      }}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
      
      {hotbarItems.map((item) => (
        <HotbarButton
          key={item.id}
          item={item}
          isActive={activeItem === item.id}
          onClick={() => setActiveItem(item.id)}
        />
      ))}
    </motion.nav>
  );
}
