/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useAdmin } from "@/hooks/useAdmin";
import { Settings, LogOut, Shield, Star, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProfileHoverCardProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileHoverCard({ isOpen, onClose, onLogout }: ProfileHoverCardProps) {
  const { profile } = useAuth();
  const { isSun, muted } = useCardStyles();
  const { isAdmin, isDev, isBetaTester } = useAdmin();

  if (!profile) return null;

  // Calculate XP progress
  const nextLevelXP = profile.level * 1000;
  const xpProgress = (profile.xp / nextLevelXP) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-full right-0 mt-2 w-72 rounded-xl border object-cover shadow-2xl p-4 z-50 overflow-hidden ${
            isSun
              ? "bg-white/90 border-slate-200 text-slate-800 backdrop-blur-md"
              : "bg-slate-900/90 border-slate-700/50 text-white backdrop-blur-md"
          }`}
          onMouseLeave={onClose}
        >
          {/* Dev/Beta Border Effect */}
          {isDev && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 opacity-20 bg-[length:200%_auto] animate-gradient-x pointer-events-none" />
          )}

          <div className="relative z-10">
            {/* Header / Avatar */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  isSun ? "bg-slate-100" : "bg-slate-800"
                }`}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="avatar"
                    width={56}
                    height={56}
                    unoptimized
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className={`w-6 h-6 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
                )}
              </div>
              <div>
                <h3 className="font-bold font-[family-name:var(--font-nunito)] truncate w-40">
                  {profile.display_name}
                </h3>
                {(profile.title || isDev) && (
                  <p className={`text-xs font-bold mt-0.5 truncate w-40 ${isDev ? "text-amber-500 dark:text-amber-400" : isSun ? "text-purple-600" : "text-purple-400"}`}>
                    {isDev ? "🏛️ Realm Arch-Mage" : profile.title}
                  </p>
                )}
                {isBetaTester && !isDev && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full mt-1">
                    <Star className="w-3 h-3" /> Beta
                  </span>
                )}
                {isDev && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/20 px-1.5 py-0.5 rounded-full mt-1">
                    <Shield className="w-3 h-3" /> Dev
                  </span>
                )}
              </div>
            </div>

            {/* Level & XP */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs font-bold ${isSun ? "text-slate-700" : "text-slate-300"}`}>
                  Level {profile.level}
                </span>
                <span className={`text-xs ${muted}`}>
                  {Math.floor(profile.xp)} / {nextLevelXP} XP
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-800"}`}>
                <motion.div
                  className={`h-full ${isSun ? "bg-purple-500" : "bg-purple-400"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className={`p-2 rounded-lg ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
                <div className={`text-[10px] font-bold uppercase ${muted}`}>Gold</div>
                <div className={`text-sm font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                  {profile.gold.toLocaleString()}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
                <div className={`text-[10px] font-bold uppercase ${muted}`}>Focus</div>
                <div className={`text-sm font-bold ${isSun ? "text-emerald-600" : "text-emerald-400"}`}>
                  {((profile as any).total_focus_minutes || 0 / 60).toFixed(1)}h
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 w-full p-2 text-sm rounded-lg transition-colors ${
                    isSun ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10 text-slate-300"
                  }`}
                  onClick={onClose}
                >
                  <Shield className="w-4 h-4 text-rose-500" />
                  Admin Panel
                </Link>
              )}
              
              <Link
                href="/settings"
                className={`flex items-center gap-2 w-full p-2 text-sm rounded-lg transition-colors ${
                  isSun ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10 text-slate-300"
                }`}
                onClick={onClose}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className={`flex items-center gap-2 w-full p-2 text-sm rounded-lg transition-colors ${
                  isSun ? "hover:bg-rose-50 text-rose-600" : "hover:bg-rose-500/10 text-rose-400"
                }`}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
