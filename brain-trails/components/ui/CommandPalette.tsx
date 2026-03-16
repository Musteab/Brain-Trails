"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  Timer,
  FileText,
  Layers,
  Swords,
  Map,
  Users,
  Trophy,
  ShoppingBag,
  Settings,
  BarChart3,
  Play,
  FilePlus,
  Sun,
  Moon,
  Volume2,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  TerminalSquare,
  Zap,
  Coins,
  RefreshCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { getMuted, toggleMute } from "@/hooks/useSoundEffects";
import { useGameStore, useUIStore } from "@/stores";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Action definitions ───────────────────────────────────
interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: "navigate" | "action" | "dev";
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isSun } = useCardStyles();
  const { awardXp, awardGold } = useGameStore();
  const { user, refreshProfile } = useAuth();
  const { addToast } = useUIStore();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Actions ────────────────────────────────────────────
  const actions: CommandAction[] = useMemo(
    () => [
      // Navigation
      { id: "nav-dashboard",    label: "Dashboard",     icon: <Home className="w-4 h-4" />,        category: "navigate", action: () => router.push("/") },
      { id: "nav-focus",        label: "Focus Timer",   icon: <Timer className="w-4 h-4" />,       category: "navigate", action: () => router.push("/focus") },
      { id: "nav-notes",        label: "Notes",         icon: <FileText className="w-4 h-4" />,    category: "navigate", action: () => router.push("/notes") },
      { id: "nav-flashcards",   label: "Flashcards",    icon: <Layers className="w-4 h-4" />,      category: "navigate", action: () => router.push("/flashcards") },
      { id: "nav-battle",       label: "Battle",        icon: <Swords className="w-4 h-4" />,      category: "navigate", action: () => router.push("/battle") },
      { id: "nav-knowledge",    label: "Knowledge Map", icon: <Map className="w-4 h-4" />,         category: "navigate", action: () => router.push("/knowledge") },
      { id: "nav-guild",        label: "Guild",         icon: <Users className="w-4 h-4" />,       category: "navigate", action: () => router.push("/guild") },
      { id: "nav-achievements", label: "Achievements",  icon: <Trophy className="w-4 h-4" />,      category: "navigate", action: () => router.push("/achievements") },
      { id: "nav-shop",         label: "Shop",          icon: <ShoppingBag className="w-4 h-4" />, category: "navigate", action: () => router.push("/shop") },
      { id: "nav-settings",     label: "Settings",      icon: <Settings className="w-4 h-4" />,    category: "navigate", action: () => router.push("/settings") },
      { id: "nav-report",       label: "Weekly Report", icon: <BarChart3 className="w-4 h-4" />,   category: "navigate", action: () => router.push("/report") },
      // Quick actions
      { id: "act-focus",        label: "Start Focus Session", icon: <Play className="w-4 h-4" />,    category: "action", action: () => router.push("/focus") },
      { id: "act-note",         label: "Create Note",         icon: <FilePlus className="w-4 h-4" />, category: "action", action: () => router.push("/notes") },
      {
        id: "act-theme",
        label: `Toggle Theme (${theme === "sun" ? "Dark" : "Light"})`,
        icon: theme === "sun" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
        category: "action",
        action: () => { toggleTheme(); },
      },
      {
        id: "act-sound",
        label: `Toggle Sound (${getMuted() ? "On" : "Off"})`,
        icon: <Volume2 className="w-4 h-4" />,
        category: "action",
        action: () => { toggleMute(); },
      },
      // Dev Commands / Superuser Tools
      {
        id: "dev-xp",
        label: "Dev: Add 5000 XP (Level Up)",
        icon: <Zap className="w-4 h-4 text-amber-500" />,
        category: "dev",
        action: () => {
          if (user) {
            awardXp(user.id, 5000);
            addToast("Dev Mode: Granted 5000 XP!", "success");
          }
        },
      },
      {
        id: "dev-gold",
        label: "Dev: Add 10000 Gold",
        icon: <Coins className="w-4 h-4 text-yellow-500" />,
        category: "dev",
        action: () => {
          if (user) {
            awardGold(user.id, 10000);
            addToast("Dev Mode: Granted 10000 Gold!", "success");
          }
        },
      },
      {
        id: "dev-reset-onboarding",
        label: "Dev: Reset Onboarding (Re-run Wizard)",
        icon: <RefreshCcw className="w-4 h-4 text-red-500" />,
        category: "dev",
        action: async () => {
          if (user) {
            await supabase.from("profiles").update({ onboarding_completed: false }).eq("id", user.id);
            await refreshProfile();
            addToast("Onboarding reset!", "info");
            router.push("/onboarding");
          }
        },
      },
    ],
    [router, theme, toggleTheme, user, awardXp, awardGold, addToast, refreshProfile]
  );

  // ── Filtered results ───────────────────────────────────
  const filteredActions = useMemo(() => {
    if (!search.trim()) return actions;
    const q = search.toLowerCase();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [actions, search]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredActions.length, search]);

  // ── Execute selected action ────────────────────────────
  const executeAction = useCallback(
    (action: CommandAction) => {
      setIsOpen(false);
      setSearch("");
      // Small delay so the modal closes before navigation
      setTimeout(() => action.action(), 50);
    },
    []
  );

  // ── Global keyboard shortcut & custom event ───────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+/ or Ctrl+/ to open
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
      }
    };

    const handleOpenCommandPalette = () => {
      setIsOpen(true);
      setSearch("");
      setSelectedIndex(0);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenCommandPalette);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenCommandPalette);
    };
  }, []);

  // ── Focus input when opened ────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── Keyboard navigation inside palette ─────────────────
  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          executeAction(filteredActions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        break;
    }
  };

  // ── Scroll selected item into view ─────────────────────
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // ── Separate navigate vs action groups ─────────────────
  const navActions = filteredActions.filter((a) => a.category === "navigate");
  const quickActions = filteredActions.filter((a) => a.category === "action");
  const devActions = filteredActions.filter((a) => a.category === "dev");

  let cumulativeIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
          onClick={() => {
            setIsOpen(false);
            setSearch("");
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${
              isSun ? "bg-black/20" : "bg-black/50"
            } backdrop-blur-sm`}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handlePaletteKeyDown}
            className={`
              relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border
              ${isSun
                ? "bg-white/95 backdrop-blur-xl border-slate-200 shadow-slate-200/50"
                : "bg-slate-900/95 backdrop-blur-xl border-white/10 shadow-black/50"
              }
            `}
          >
            {/* Search input */}
            <div
              className={`flex items-center gap-3 px-4 py-4 border-b ${
                isSun ? "border-slate-200" : "border-white/10"
              }`}
            >
              <Search className={`w-5 h-5 shrink-0 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a command or search..."
                className={`flex-1 bg-transparent outline-none text-sm font-[family-name:var(--font-quicksand)] ${
                  isSun
                    ? "text-slate-800 placeholder:text-slate-400"
                    : "text-white placeholder:text-slate-500"
                }`}
              />
              <kbd
                className={`hidden sm:flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isSun
                    ? "bg-slate-100 text-slate-400 border border-slate-200"
                    : "bg-white/10 text-slate-500 border border-white/10"
                }`}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[320px] overflow-y-auto py-2"
            >
              {filteredActions.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className={`text-sm ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                    No results found.
                  </p>
                </div>
              )}

              {/* Navigate section */}
              {navActions.length > 0 && (
                <>
                  <p
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      isSun ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Navigate
                  </p>
                  {navActions.map((action) => {
                    const idx = cumulativeIndex++;
                    return (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${selectedIndex === idx
                            ? isSun
                              ? "bg-purple-50 text-purple-700"
                              : "bg-purple-500/15 text-purple-300"
                            : isSun
                              ? "text-slate-700 hover:bg-slate-50"
                              : "text-slate-300 hover:bg-white/5"
                          }
                        `}
                      >
                        <span
                          className={`shrink-0 ${
                            selectedIndex === idx
                              ? isSun
                                ? "text-purple-500"
                                : "text-purple-400"
                              : isSun
                                ? "text-slate-400"
                                : "text-slate-500"
                          }`}
                        >
                          {action.icon}
                        </span>
                        <span className="flex-1 text-sm font-[family-name:var(--font-quicksand)] font-medium">
                          {action.label}
                        </span>
                        {action.shortcut && (
                          <kbd
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSun
                                ? "bg-slate-100 text-slate-400"
                                : "bg-white/10 text-slate-500"
                            }`}
                          >
                            {action.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Quick actions section */}
              {quickActions.length > 0 && (
                <>
                  <p
                    className={`px-4 py-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider ${
                      isSun ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Quick Actions
                  </p>
                  {quickActions.map((action) => {
                    const idx = cumulativeIndex++;
                    return (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${selectedIndex === idx
                            ? isSun
                              ? "bg-purple-50 text-purple-700"
                              : "bg-purple-500/15 text-purple-300"
                            : isSun
                              ? "text-slate-700 hover:bg-slate-50"
                              : "text-slate-300 hover:bg-white/5"
                          }
                        `}
                      >
                        <span
                          className={`shrink-0 ${
                            selectedIndex === idx
                              ? isSun
                                ? "text-purple-500"
                                : "text-purple-400"
                              : isSun
                                ? "text-slate-400"
                                : "text-slate-500"
                          }`}
                        >
                          {action.icon}
                        </span>
                        <span className="flex-1 text-sm font-[family-name:var(--font-quicksand)] font-medium">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Dev section */}
              {devActions.length > 0 && (
                <>
                  <p
                    className={`px-4 py-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider ${
                      isSun ? "text-amber-500" : "text-amber-600"
                    }`}
                  >
                    <TerminalSquare className="w-3 h-3 inline mr-1" />
                    Developer Tools
                  </p>
                  {devActions.map((action) => {
                    const idx = cumulativeIndex++;
                    return (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${selectedIndex === idx
                            ? isSun
                              ? "bg-amber-50 text-amber-700"
                              : "bg-amber-500/15 text-amber-300"
                            : isSun
                              ? "text-slate-700 hover:bg-slate-50"
                              : "text-slate-300 hover:bg-white/5"
                          }
                        `}
                      >
                        <span className="shrink-0">{action.icon}</span>
                        <span className="flex-1 text-sm font-[family-name:var(--font-quicksand)] font-medium">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer hints */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 border-t text-[10px] ${
                isSun
                  ? "border-slate-200 text-slate-400"
                  : "border-white/10 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" />
                  select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" />K to toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
