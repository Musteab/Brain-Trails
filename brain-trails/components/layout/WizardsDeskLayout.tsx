"use client";

import { useState, createContext, useContext } from "react";
import WizardsDesk from "./WizardsDesk";
import GrimoireShelf from "./GrimoireShelf";
import TravelerHotbar from "./TravelerHotbar";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Compass } from "lucide-react";

interface WizardsDeskContextType {
  isShelfVisible: boolean;
  toggleShelf: () => void;
  useMobileNav: boolean;
}

const WizardsDeskContext = createContext<WizardsDeskContextType>({
  isShelfVisible: true,
  toggleShelf: () => {},
  useMobileNav: false,
});

export const useWizardsDesk = () => useContext(WizardsDeskContext);

interface WizardsDeskLayoutProps {
  children: React.ReactNode;
  /** Show the Scholar's Advisory plaque (default true) */
  showPlaque?: boolean;
  /** Use mobile-friendly hotbar instead of shelf on small screens */
  responsiveNav?: boolean;
}

/**
 * WizardsDeskLayout
 * 
 * Combined layout wrapper that provides:
 * - WizardsDesk background (candlelight, wood texture, decorations)
 * - GrimoireShelf sidebar navigation (desktop)
 * - TravelerHotbar (mobile fallback)
 * - Proper content margins for the sidebar
 */
export default function WizardsDeskLayout({ 
  children, 
  showPlaque = true,
  responsiveNav = true,
}: WizardsDeskLayoutProps) {
  const [isShelfVisible, setIsShelfVisible] = useState(true);
  const [useMobileNav, setUseMobileNav] = useState(false);

  // Check for mobile on mount
  // useEffect(() => {
  //   const checkMobile = () => setUseMobileNav(window.innerWidth < 768);
  //   checkMobile();
  //   window.addEventListener("resize", checkMobile);
  //   return () => window.removeEventListener("resize", checkMobile);
  // }, []);

  const toggleShelf = () => setIsShelfVisible((prev) => !prev);

  return (
    <WizardsDeskContext.Provider value={{ isShelfVisible, toggleShelf, useMobileNav }}>
      <WizardsDesk>
        {/* Hide plaque if not needed */}
        {!showPlaque && (
          <style jsx global>{`
            .scholars-advisory-plaque { display: none !important; }
          `}</style>
        )}

        {/* Desktop: Grimoire Shelf */}
        <div className="hidden md:block">
          <AnimatePresence>
            {isShelfVisible && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GrimoireShelf />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile: Toggle button for shelf visibility */}
        <div className="md:hidden fixed bottom-4 left-4 z-50">
          <button
            onClick={toggleShelf}
            className="p-3 rounded-xl border transition-all"
            style={{
              background: "linear-gradient(135deg, #3d2817 0%, #2a1a10 100%)",
              borderColor: "rgba(255, 200, 150, 0.3)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 150, 50, 0.1)",
            }}
          >
            {isShelfVisible ? (
              <BookOpen className="w-5 h-5 text-amber-400" />
            ) : (
              <Compass className="w-5 h-5 text-amber-400" />
            )}
          </button>
        </div>

        {/* Mobile: Grimoire Shelf as overlay */}
        <div className="md:hidden">
          <AnimatePresence>
            {isShelfVisible && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-30"
                  onClick={toggleShelf}
                />
                {/* Shelf */}
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="z-40"
                >
                  <GrimoireShelf />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Main content area with proper margins */}
        <main 
          className={`relative z-10 min-h-screen transition-all duration-300 ${
            isShelfVisible ? "md:ml-24" : "md:ml-0"
          }`}
        >
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
        </main>

        {/* Optional: Traveler Hotbar as secondary/mobile nav */}
        {responsiveNav && (
          <div className="md:hidden">
            <TravelerHotbar />
          </div>
        )}
      </WizardsDesk>
    </WizardsDeskContext.Provider>
  );
}
