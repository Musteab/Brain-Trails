import type { Metadata, Viewport } from "next";
import { Nunito, Quicksand } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ToastContainer from "@/components/ui/ToastContainer";
import CommandPalette from "@/components/ui/CommandPalette";
import XPPopup from "@/components/ui/XPPopup";
import LevelUpCelebration from "@/components/ui/LevelUpCelebration";
import AppInitializer from "@/components/ui/AppInitializer";
import "./globals.css";

// Nunito - Playful, rounded font for headings (Nintendo feel)
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// Quicksand - Clean, friendly font for body text (Notion feel)
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brain Trails — Gamified Study Companion",
    template: "%s | Brain Trails",
  },
  description:
    "A cozy gamified study platform with RPG quests, focus timers, flashcards, AI tutoring, guilds, and more. Turn studying into an adventure.",
  keywords: [
    "study app",
    "gamified learning",
    "pomodoro",
    "flashcards",
    "RPG",
    "focus timer",
    "AI tutor",
    "brain trails",
  ],
  authors: [{ name: "Brain Trails Team" }],
  openGraph: {
    title: "Brain Trails — Gamified Study Companion",
    description:
      "Turn your study sessions into RPG adventures. Focus timers, flashcards, guilds, and AI-powered learning.",
    siteName: "Brain Trails",
    type: "website",
  },
  metadataBase: new URL("https://brain-trails.vercel.app"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${quicksand.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            <ErrorBoundary>
              {children}
              <ToastContainer />
              <CommandPalette />
              <XPPopup />
              <LevelUpCelebration />
              <AppInitializer />
            </ErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
