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
  title: "Brain Trails",
  description: "Your cozy gamified study companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brain Trails",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
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
