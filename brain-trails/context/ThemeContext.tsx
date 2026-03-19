"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "sun" | "moon";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "braintrails_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("sun");
  const [mounted, setMounted] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "sun" || stored === "moon") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydrate from localStorage on mount
        setTheme(stored);
      }
    } catch {
      // localStorage unavailable (SSR or private browsing)
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "moon" ? "sun" : "moon";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  };

  // Sync dark class on <html> for CSS-based dark mode selectors
  useEffect(() => {
    if (!mounted) return;
    if (theme === "moon") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, mounted]);

  // Prevent flash of wrong theme during SSR hydration
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "sun", toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
