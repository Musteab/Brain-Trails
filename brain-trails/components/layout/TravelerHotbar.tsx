"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Menu, LayoutGrid, Compass, NotebookPen, Layers, Timer,
  GraduationCap, Trophy, Store, LineChart, Library, Settings, Users,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Focused navigation - the notebook → test → flex loop.
// (Knowledge Map, Battle, and Guild were removed to consolidate the study loop.)
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/codex', label: 'Codex', icon: Compass },
  { href: '/notes', label: 'Notebook', icon: NotebookPen },
  { href: '/flashcards', label: 'Decks', icon: Layers },
  { href: '/focus', label: 'Focus', icon: Timer },
  { href: '/quiz', label: 'Trials', icon: GraduationCap },
  { href: '/circle', label: 'Circle', icon: Users },
  { href: '/achievements', label: 'Trophies', icon: Trophy },
  { href: '/report', label: 'Reports', icon: LineChart },
  { href: '/shop', label: 'Merchant', icon: Store },
  { href: '/about', label: 'Archive', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function TravelerHotbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isSun = theme === 'sun';

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <button
        key={item.href}
        onClick={() => {
          setIsOpen(false);
          router.push(item.href);
        }}
        className={`group relative flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl transition-colors ${
          isActive
            ? isSun
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-900'
            : isSun
            ? 'text-slate-600 hover:bg-slate-900/5'
            : 'text-slate-300 hover:bg-white/5'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
        <span className="text-[10px] font-medium tracking-tight leading-none">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              style={{ transformOrigin: 'bottom right' }}
              className={`mb-3 p-2.5 rounded-2xl border shadow-xl w-[300px] ${
                isSun
                  ? 'bg-white border-slate-200 shadow-slate-300/40'
                  : 'bg-slate-900 border-slate-700/70 shadow-black/40'
              }`}
            >
              <p className={`px-2 pt-1 pb-2 text-[11px] font-medium uppercase tracking-[0.18em] ${isSun ? 'text-slate-400' : 'text-slate-500'}`}>
                Navigate
              </p>
              <div className="grid grid-cols-4 gap-1">
                {NAV_ITEMS.map(renderItem)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.94 }}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          className={`relative flex items-center justify-center w-14 h-14 rounded-2xl border shadow-lg transition-colors ${
            isSun
              ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" strokeWidth={2} />
              </motion.span>
            ) : (
              <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Menu className="w-6 h-6" strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
