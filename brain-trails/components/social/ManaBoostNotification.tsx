"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Heart, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

interface ManaBoostNotificationProps {
  senderName: string;
  senderAvatar?: string;
  boostType: "mana" | "encouragement" | "study_together";
  message?: string;
  xpAmount?: number;
  onClose: () => void;
  onAccept?: () => void;
}

/**
 * Mana Boost Notification
 * 
 * Real-time notification when a friend sends encouragement:
 * - "Mana Boost" - Grants bonus XP
 * - "Encouragement" - Motivational message
 * - "Study Together" - Co-op study invite
 */
export default function ManaBoostNotification({
  senderName,
  senderAvatar,
  boostType,
  message,
  xpAmount = 25,
  onClose,
  onAccept,
}: ManaBoostNotificationProps) {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getBoostConfig = () => {
    switch (boostType) {
      case "mana":
        return {
          icon: <Zap className="w-6 h-6 text-purple-400" />,
          gradient: "from-purple-500 to-indigo-600",
          title: "Mana Boost!",
          description: `${senderName} sent you magical energy!`,
          accentColor: isSun ? "text-purple-600" : "text-purple-400",
          bgAccent: isSun ? "bg-purple-100" : "bg-purple-500/20",
        };
      case "encouragement":
        return {
          icon: <Heart className="w-6 h-6 text-pink-400" />,
          gradient: "from-pink-500 to-rose-600",
          title: "Words of Power!",
          description: `${senderName} is cheering you on!`,
          accentColor: isSun ? "text-pink-600" : "text-pink-400",
          bgAccent: isSun ? "bg-pink-100" : "bg-pink-500/20",
        };
      case "study_together":
        return {
          icon: <Sparkles className="w-6 h-6 text-amber-400" />,
          gradient: "from-amber-500 to-orange-600",
          title: "Co-op Ritual Invite!",
          description: `${senderName} wants to study together!`,
          accentColor: isSun ? "text-amber-600" : "text-amber-400",
          bgAccent: isSun ? "bg-amber-100" : "bg-amber-500/20",
        };
    }
  };

  const config = getBoostConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          className="fixed top-20 right-6 z-[100] max-w-sm"
        >
          <div
            className={`relative overflow-hidden rounded-2xl shadow-2xl ${
              isSun
                ? "bg-white/95 border border-slate-200"
                : "bg-slate-900/95 border border-slate-700"
            } backdrop-blur-xl`}
          >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
                isSun ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-slate-500"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Sender avatar */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                      isSun ? "bg-slate-100" : "bg-slate-800"
                    }`}
                  >
                    {senderAvatar ? (
                      <Image
                        src={senderAvatar}
                        alt={senderName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xl">🧙</span>
                    )}
                  </div>
                  {/* Icon badge */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${config.bgAccent}`}
                  >
                    {config.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <h4 className={`font-bold ${config.accentColor}`}>{config.title}</h4>
                  <p className={`text-sm ${isSun ? "text-slate-600" : "text-slate-400"}`}>
                    {config.description}
                  </p>

                  {message && (
                    <p
                      className={`mt-2 text-sm italic ${
                        isSun ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      &ldquo;{message}&rdquo;
                    </p>
                  )}

                  {boostType === "mana" && (
                    <div
                      className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-sm font-bold ${
                        isSun
                          ? "bg-purple-100 text-purple-600"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      <Zap className="w-3 h-3" />+{xpAmount} XP
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons for study_together */}
              {boostType === "study_together" && onAccept && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={handleClose}
                    className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                      isSun
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      onAccept();
                      handleClose();
                    }}
                    className={`flex-1 py-2 rounded-xl font-bold text-white bg-gradient-to-r ${config.gradient} hover:shadow-lg transition-all`}
                  >
                    Join Ritual
                  </button>
                </div>
              )}
            </div>

            {/* Sparkle particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100,
                    y: 100,
                    opacity: 0,
                  }}
                  animate={{
                    y: -20,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
