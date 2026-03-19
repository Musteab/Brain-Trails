import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type NavItem = {
  href: string;
  label: string;
  emoji: string;
};

// All 11 navigation items
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', emoji: '🏕️' },
  { href: '/knowledge', label: 'Knowledge Map', emoji: '🗺️' },
  { href: '/notes', label: 'Spellbook', emoji: '📖' },
  { href: '/flashcards', label: 'Deck', emoji: '🃏' },
  { href: '/focus', label: 'Focus', emoji: '⏳' },
  { href: '/quiz', label: 'Trials', emoji: '📝' },
  { href: '/battle', label: 'Battle', emoji: '⚔️' },
  { href: '/guild', label: 'Guilds', emoji: '🛡️' },
  { href: '/achievements', label: 'Trophies', emoji: '🏆' },
  { href: '/shop', label: 'Merchant', emoji: '💰' },
  { href: '/about', label: 'Archive', emoji: '📚' },
  { href: '/report', label: 'Reports', emoji: '📜' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
];

export default function TravelerHotbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isSun = theme === 'sun';

  const [isOpen, setIsOpen] = useState(false);

  // Close when clicking outside or hitting Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Find the active item for the collapsed orb
  const activeItem = NAV_ITEMS.find((item) => item.href === pathname) || {
    href: '',
    label: 'Explore',
    emoji: '🧭',
  };

  // NavItem component
  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    return (
      <motion.button
        key={item.href}
        onClick={() => {
          setIsOpen(false);
          router.push(item.href);
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors ${
          isActive
            ? isSun
              ? 'bg-amber-100 border-amber-300 shadow-inner'
              : 'bg-amber-900/40 border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)]'
            : isSun
            ? 'bg-white/60 border-transparent hover:bg-white hover:border-slate-200'
            : 'bg-slate-800/60 border-transparent hover:bg-slate-700 hover:border-slate-600'
        }`}
      >
        <span className="text-2xl mb-1 drop-shadow-sm">{item.emoji}</span>
        <span
          className={`text-[10px] font-bold tracking-tight text-center leading-tight ${
            isActive
              ? isSun
                ? 'text-amber-800'
                : 'text-amber-200'
              : isSun
              ? 'text-slate-600'
              : 'text-slate-300'
          }`}
        >
          {item.label}
        </span>
        {isActive && (
          <motion.div
            layoutId="active-nav-glow"
            className="absolute inset-0 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)] pointer-events-none"
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* Backdrop overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Floating UI Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        {/* Expanded Grid Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`mb-4 p-4 rounded-[28px] border-[3px] shadow-2xl max-w-[320px] sm:max-w-[400px] ${
                isSun
                  ? 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-slate-300/50'
                  : 'bg-slate-900/90 backdrop-blur-xl border-slate-700 shadow-black/50'
              }`}
            >
              <div className="mb-3 px-2 flex justify-between items-center">
                <h3
                  className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Travel Menu
                </h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {NAV_ITEMS.map(renderItem)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Orb (Toggle Button) */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full border-[3px] shadow-2xl transition-colors z-50 overflow-hidden ${
            isOpen
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-purple-400 shadow-purple-500/40'
              : 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 shadow-orange-500/40'
          }`}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-md pointer-events-none" />

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                className="text-white drop-shadow-md"
              >
                <X className="w-8 h-8" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                className="flex items-center justify-center text-3xl drop-shadow-md"
              >
                {activeItem.emoji}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

