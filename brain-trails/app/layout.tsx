import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
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
  title: "Brain Trails 🎮",
  description: "Your cozy gamified study companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${quicksand.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
