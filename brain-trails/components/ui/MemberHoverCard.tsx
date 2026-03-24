/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";
import { Shield, Star, Coins, Flame, Zap, BookOpen, Sparkles, Crown, Swords } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface MemberHoverCardProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right" | "top" | "bottom";
}

interface MemberProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_frame?: string;
  role: string;
  level: number;
  xp: number;
  gold: number;
  streak_days: number;
  title: string | null;
  guild_id: string | null;
}

/** Picks the right frame class based on role / shop cosmetic */
function getFrameClass(role?: string | null, avatarFrame?: string | null) {
  if (avatarFrame && avatarFrame !== 'default') return avatarFrame;
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  return "";
}

/** Streak fire animation */
function StreakFlame({ intensity }: { intensity: number }) {
  const flameCount = Math.min(Math.floor(intensity / 7) + 1, 5);
  
  return (
    <div className="relative flex items-center justify-center">
      {Array.from({ length: flameCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{
            y: [0, -3, 0],
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 0.5 + i * 0.1,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          style={{
            left: `${50 + (i - flameCount / 2) * 3}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <Flame 
            className={`w-4 h-4 ${
              intensity >= 30 ? "text-orange-400" : 
              intensity >= 14 ? "text-orange-500" : 
              "text-orange-600"
            }`}
            style={{
              filter: intensity >= 30 
                ? "drop-shadow(0 0 6px rgba(251, 146, 60, 0.8))" 
                : intensity >= 14 
                ? "drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))"
                : "drop-shadow(0 0 2px rgba(234, 88, 12, 0.4))",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function MemberHoverCard({ userId, isOpen, onClose, position = "right" }: MemberHoverCardProps) {
  const { isSun, muted } = useCardStyles();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [guildRole, setGuildRole] = useState<"leader" | "officer" | "member" | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await (supabase.from("profiles") as any)
          .select("id, display_name, avatar_url, avatar_frame, role, level, xp, gold, streak_days, title, guild_id")
          .eq("id", userId)
          .single();

        if (data) {
          setProfile(data);
          
          // Get guild role if they're in a guild
          if (data.guild_id) {
            const { data: memberData } = await (supabase.from("guild_members") as any)
              .select("role")
              .eq("user_id", userId)
              .eq("guild_id", data.guild_id)
              .single();
            
            if (memberData) {
              setGuildRole(memberData.role);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch member profile:", err);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [isOpen, userId]);

  if (!isOpen) return null;
  if (loading || !profile) return null;

  const nextLevelXP = profile.level * 1000;
  const xpProgress = (profile.xp / nextLevelXP) * 100;
  const frameClass = getFrameClass(profile.role, profile.avatar_frame);
  const isDev = profile.role === "dev";
  const isBetaTester = profile.role === "beta_tester";

  const parsedTitle = profile.title ? profile.title.split("|") : ["", ""];
  const titleText = parsedTitle[0];
  const titleStyleClass = parsedTitle[1] || "";

  const positionClasses = {
    left: "right-full mr-2",
    right: "left-full ml-2",
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  // Get role display name and icon
  const getRoleDisplay = () => {
    if (!guildRole) return null;
    
    const roleConfig = {
      leader: { name: "Guild Master", icon: Crown, color: "text-amber-500" },
      officer: { name: "Elder", icon: Swords, color: isSun ? "text-blue-600" : "text-blue-400" },
      member: { name: "Member", icon: Shield, color: muted },
    };
    
    return roleConfig[guildRole];
  };

  const roleDisplay = getRoleDisplay();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`absolute ${positionClasses[position]} w-72 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
          isSun
            ? "bg-gradient-to-br from-white/95 via-white/90 to-amber-50/85 border-white/60 text-slate-800"
            : "bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-purple-950/85 border-slate-600/30 text-white"
        }`}
        style={{
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isSun 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
        onMouseLeave={onClose}
      >
        <div className="flex flex-col gap-3 relative">
          {/* Header / Avatar */}
          <div className={`p-4 pb-3 ${
            isSun ? "bg-gradient-to-b from-amber-50/80 to-transparent" : "bg-gradient-to-b from-slate-800/60 to-transparent"
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${frameClass} shadow-lg ${
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
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="text-2xl">🧙</div>
                  )}
                </motion.div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base font-[family-name:var(--font-nunito)] truncate">
                  {profile.display_name || "Unknown Traveler"}
                </h3>
                {(profile.title || isDev) && (
                  <p className={`text-[11px] font-bold mt-0.5 truncate ${isDev ? "cosmetic-title-dev" : titleStyleClass} ${
                    !isDev && !titleStyleClass ? muted : ""
                  }`}>
                    {isDev ? "🏛️ Realm Arch-Mage" : titleText}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {isBetaTester && !isDev && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> Beta
                    </span>
                  )}
                  {isDev && (
                    <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full">
                      <Shield className="w-3 h-3" /> Dev
                    </span>
                  )}
                  {roleDisplay && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleDisplay.color}`}>
                      <roleDisplay.icon className="w-3 h-3" />
                      {roleDisplay.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Level & XP */}
          <div className="px-4 pb-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs font-bold flex items-center gap-1 ${isSun ? "text-slate-700" : "text-slate-300"}`}>
                <Zap className="w-3 h-3 text-amber-500" /> Level {profile.level}
              </span>
              <span className={`text-xs ${muted}`}>
                {Math.floor(profile.xp)} / {nextLevelXP} XP
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-800"}`}>
              <motion.div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Badges */}
          {(() => {
            const badges: string[] = [];
            if (profile.streak_days >= 30) badges.push("🔥 Dedicated");
            else if (profile.streak_days >= 7) badges.push("🔥 On Fire");
            if (profile.level >= 25) badges.push("🎓 Master");
            else if (profile.level >= 10) badges.push("📚 Scholar");
            if (profile.role === "dev") badges.push("⚡ Creator");
            else if (profile.role === "beta_tester") badges.push("⭐ Pioneer");
            
            return badges.length > 0 ? (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {badges.slice(0, 4).map((badge, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSun
                          ? "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200/50 text-violet-700"
                          : "bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-400/30 text-violet-300"
                      }`}
                    >
                      {badge}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <motion.div 
              className={`p-2 rounded-lg text-center relative overflow-hidden ${
                isSun ? "bg-amber-50/80 border border-amber-200/50" : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              <Coins className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
              <div className={`text-xs font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                {profile.gold.toLocaleString()}
              </div>
              <div className={`text-[9px] font-bold uppercase ${muted}`}>Gold</div>
            </motion.div>
            
            <motion.div 
              className={`p-2 rounded-lg text-center relative overflow-hidden ${
                isSun ? "bg-orange-50/80 border border-orange-200/50" : "bg-orange-500/10 border border-orange-500/20"
              }`}
            >
              <div className="h-4 mb-1">
                <StreakFlame intensity={profile.streak_days || 0} />
              </div>
              <div className={`text-xs font-bold ${
                (profile.streak_days || 0) >= 30 ? "text-orange-400" :
                (profile.streak_days || 0) >= 14 ? "text-orange-500" :
                isSun ? "text-orange-600" : "text-orange-400"
              }`}>
                {profile.streak_days || 0}
              </div>
              <div className={`text-[9px] font-bold uppercase ${muted}`}>Streak</div>
            </motion.div>
            
            <motion.div 
              className={`p-2 rounded-lg text-center relative overflow-hidden ${
                isSun ? "bg-purple-50/80 border border-purple-200/50" : "bg-purple-500/10 border border-purple-500/20"
              }`}
            >
              <Star className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-purple-500" : "text-purple-400"}`} />
              <div className={`text-xs font-bold ${isSun ? "text-purple-600" : "text-purple-400"}`}>
                {Math.floor(profile.xp)}
              </div>
              <div className={`text-[9px] font-bold uppercase ${muted}`}>XP</div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
