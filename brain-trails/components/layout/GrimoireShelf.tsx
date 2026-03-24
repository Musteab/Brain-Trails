"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Book, Scroll, Brain, Clock, Swords, Users, Settings, 
  ChevronLeft, ChevronRight, Map, Home, Trophy, ShoppingBag,
  HelpCircle, Sparkles
} from "lucide-react";

interface GrimoireItem {
  id: string;
  name: string;
  shortName: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  spineColor: string;
  accentColor: string;
}

const GRIMOIRE_ITEMS: GrimoireItem[] = [
  {
    id: "home",
    name: "Scholar's Desk",
    shortName: "Home",
    href: "/",
    icon: <Home className="w-4 h-4" />,
    color: "#4a3728",
    spineColor: "linear-gradient(180deg, #5c4a3d 0%, #3d2817 50%, #4a3728 100%)",
    accentColor: "#fbbf24",
  },
  {
    id: "archive",
    name: "Arcane Archive",
    shortName: "Archive",
    href: "/arcane-archive",
    icon: <Map className="w-4 h-4" />,
    color: "#8B4513",
    spineColor: "linear-gradient(180deg, #654321 0%, #3d2817 50%, #4a3728 100%)",
    accentColor: "#ffd700",
  },
  {
    id: "spellbook",
    name: "Spellbook",
    shortName: "Notes",
    href: "/notes",
    icon: <Book className="w-4 h-4" />,
    color: "#1e3a5f",
    spineColor: "linear-gradient(180deg, #1e3a5f 0%, #0d1f3c 50%, #162d4d 100%)",
    accentColor: "#87ceeb",
  },
  {
    id: "flashcards",
    name: "Memory Cards",
    shortName: "Cards",
    href: "/flashcards",
    icon: <Brain className="w-4 h-4" />,
    color: "#4a1f5c",
    spineColor: "linear-gradient(180deg, #4a1f5c 0%, #2d1038 50%, #3d1a4d 100%)",
    accentColor: "#da70d6",
  },
  {
    id: "focus",
    name: "Focus Crystal",
    shortName: "Focus",
    href: "/focus",
    icon: <Clock className="w-4 h-4" />,
    color: "#0d3d3d",
    spineColor: "linear-gradient(180deg, #0d3d3d 0%, #062626 50%, #0a3030 100%)",
    accentColor: "#00ffff",
  },
  {
    id: "quests",
    name: "Quest Tome",
    shortName: "Quests",
    href: "/quiz",
    icon: <Scroll className="w-4 h-4" />,
    color: "#5c3d1e",
    spineColor: "linear-gradient(180deg, #5c3d1e 0%, #3d2810 50%, #4d3318 100%)",
    accentColor: "#ffb347",
  },
  {
    id: "arena",
    name: "Trial Arena",
    shortName: "Battle",
    href: "/battle",
    icon: <Swords className="w-4 h-4" />,
    color: "#5c1e1e",
    spineColor: "linear-gradient(180deg, #5c1e1e 0%, #3d1010 50%, #4d1818 100%)",
    accentColor: "#ff6b6b",
  },
  {
    id: "guild",
    name: "Guild Hall",
    shortName: "Guild",
    href: "/guild",
    icon: <Users className="w-4 h-4" />,
    color: "#1e4d1e",
    spineColor: "linear-gradient(180deg, #1e4d1e 0%, #0d2d0d 50%, #163d16 100%)",
    accentColor: "#98fb98",
  },
  {
    id: "trophies",
    name: "Trophy Hall",
    shortName: "Trophies",
    href: "/achievements",
    icon: <Trophy className="w-4 h-4" />,
    color: "#5c4a1e",
    spineColor: "linear-gradient(180deg, #5c4a1e 0%, #3d3210 50%, #4d4018 100%)",
    accentColor: "#ffd700",
  },
  {
    id: "merchant",
    name: "Arcane Merchant",
    shortName: "Shop",
    href: "/shop",
    icon: <ShoppingBag className="w-4 h-4" />,
    color: "#3d1e5c",
    spineColor: "linear-gradient(180deg, #3d1e5c 0%, #251038 50%, #301848 100%)",
    accentColor: "#e879f9",
  },
  {
    id: "about",
    name: "Realm Lore",
    shortName: "About",
    href: "/about",
    icon: <HelpCircle className="w-4 h-4" />,
    color: "#2d3d4d",
    spineColor: "linear-gradient(180deg, #2d3d4d 0%, #1a2530 50%, #243040 100%)",
    accentColor: "#94a3b8",
  },
  {
    id: "settings",
    name: "Arcane Config",
    shortName: "Settings",
    href: "/settings",
    icon: <Settings className="w-4 h-4" />,
    color: "#3d3d3d",
    spineColor: "linear-gradient(180deg, #3d3d3d 0%, #252525 50%, #333333 100%)",
    accentColor: "#c0c0c0",
  },
];

/**
 * Grimoire Shelf - Sidebar Navigation
 * 
 * A vertical wooden shelf displaying mini-grimoire book spines.
 * Each book represents a navigation destination and slides out on hover/click.
 */
export default function GrimoireShelf() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full z-40 flex"
    >
      {/* Wooden Shelf Background */}
      <div 
        className={`relative h-full transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-24"
        }`}
        style={{
          background: `
            linear-gradient(90deg, 
              #2a1a10 0%, 
              #3d2817 20%, 
              #4a3020 50%, 
              #3d2817 80%, 
              #2a1a10 100%
            )
          `,
          boxShadow: `
            inset -4px 0 20px rgba(0, 0, 0, 0.5),
            4px 0 30px rgba(0, 0, 0, 0.6),
            inset 2px 0 0 rgba(255, 200, 150, 0.1)
          `,
        }}
      >
        {/* Wood grain texture */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                rgba(0, 0, 0, 0.1) 8px,
                rgba(0, 0, 0, 0.1) 9px
              )
            `,
          }}
        />

        {/* Shelf brackets */}
        <ShelfBracket top="15%" />
        <ShelfBracket top="45%" />
        <ShelfBracket top="75%" />

        {/* Book spines */}
        <div className="relative h-full flex flex-col items-center justify-center gap-0.5 py-16 px-2 overflow-y-auto custom-scrollbar">
          {GRIMOIRE_ITEMS.map((item, index) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isHovered = hoveredBook === item.id;
            const isSelected = selectedBook === item.id;

            return (
              <Link 
                key={item.id} 
                href={item.href}
                onClick={() => setSelectedBook(item.id)}
              >
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  onMouseEnter={() => setHoveredBook(item.id)}
                  onMouseLeave={() => setHoveredBook(null)}
                  className="relative cursor-pointer"
                >
                  {/* Book spine */}
                  <motion.div
                    animate={{
                      x: isHovered || isSelected ? 12 : 0,
                      rotateY: isHovered || isSelected ? -15 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative ${isCollapsed ? "w-10 h-12" : "w-14 h-12"} rounded-r-sm`}
                    style={{
                      background: item.spineColor,
                      boxShadow: `
                        inset 2px 0 4px rgba(255, 255, 255, 0.15),
                        inset -2px 0 4px rgba(0, 0, 0, 0.3),
                        ${isActive ? `0 0 15px ${item.accentColor}40, 0 0 30px ${item.accentColor}20` : "2px 2px 8px rgba(0, 0, 0, 0.4)"}
                      `,
                      transformStyle: "preserve-3d",
                      perspective: "500px",
                    }}
                  >
                    {/* Gold trim lines */}
                    <div 
                      className="absolute top-1 left-1 right-1 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${item.accentColor}60, transparent)` }}
                    />
                    <div 
                      className="absolute bottom-1 left-1 right-1 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${item.accentColor}60, transparent)` }}
                    />

                    {/* Spine decoration */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
                      {/* Icon */}
                      <div 
                        className="flex items-center justify-center"
                        style={{ color: item.accentColor }}
                      >
                        {item.icon}
                      </div>

                      {/* Title (vertical text) */}
                      {!isCollapsed && (
                        <span 
                          className="text-[8px] font-bold tracking-wider text-center leading-tight"
                          style={{ 
                            color: item.accentColor,
                            textShadow: `0 0 10px ${item.accentColor}80`,
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                          }}
                        >
                          {item.shortName}
                        </span>
                      )}
                    </div>

                    {/* Active glow indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBookGlow"
                        className="absolute inset-0 rounded-r-sm pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, ${item.accentColor}20, transparent)`,
                          boxShadow: `inset 0 0 15px ${item.accentColor}30`,
                        }}
                      />
                    )}

                    {/* Leather texture overlay */}
                    <div 
                      className="absolute inset-0 rounded-r-sm opacity-20 pointer-events-none"
                      style={{
                        backgroundImage: `
                          radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0%, transparent 50%)
                        `,
                      }}
                    />
                  </motion.div>

                  {/* Tooltip on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.9 }}
                        className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap"
                      >
                        <div 
                          className="px-3 py-2 rounded-lg text-sm font-bold"
                          style={{
                            background: "linear-gradient(135deg, #2a1a10 0%, #1a100a 100%)",
                            border: `1px solid ${item.accentColor}40`,
                            color: item.accentColor,
                            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px ${item.accentColor}20`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {item.icon}
                            {item.name}
                          </div>
                        </div>
                        {/* Arrow */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                          style={{
                            background: "#2a1a10",
                            borderLeft: `1px solid ${item.accentColor}40`,
                            borderBottom: `1px solid ${item.accentColor}40`,
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full transition-colors"
          style={{
            background: "linear-gradient(135deg, #3d2817 0%, #2a1a10 100%)",
            border: "1px solid rgba(255, 200, 150, 0.2)",
            color: "#c9a86c",
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Ambient dust particles */}
        <DustParticles />
      </div>
    </motion.nav>
  );
}

// Shelf bracket decoration
function ShelfBracket({ top }: { top: string }) {
  return (
    <div 
      className="absolute left-0 right-0 h-3 pointer-events-none"
      style={{ top }}
    >
      <div 
        className="w-full h-full"
        style={{
          background: "linear-gradient(180deg, #5c3d1e 0%, #3d2810 50%, #2a1a10 100%)",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 200, 150, 0.15)",
        }}
      />
      {/* Decorative nail */}
      <div 
        className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, #c9a86c 0%, #8b6914 50%, #5c4a1f 100%)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
        }}
      />
    </div>
  );
}

// Floating dust particles effect
function DustParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-200/30"
          initial={{
            x: Math.random() * 80,
            y: Math.random() * 100 + "%",
            opacity: 0,
          }}
          animate={{
            y: [null, "-20%"],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
          style={{
            left: `${10 + Math.random() * 60}%`,
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
}
