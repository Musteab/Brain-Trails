/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useAdmin } from "@/hooks/useAdmin";
import { Settings, LogOut, Shield, Star, User as UserIcon, Search, UserPlus, Coins, Flame, Zap, Camera, Loader2, Users, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/stores";

interface ProfileHoverCardProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface ActiveSubject {
  name: string;
  color: string;
  lastStudied: string;
}

/** Picks the right frame class based on role / shop cosmetic */
function getFrameClass(role?: string | null, avatarFrame?: string | null) {
  if (avatarFrame && avatarFrame !== 'default') return avatarFrame;
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  return "";
}

/** Glassmorphic particle effect for profile card */
function GlassParticles({ count = 12 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-purple-400/40 to-cyan-400/40"
          initial={{
            x: Math.random() * 320,
            y: Math.random() * 500,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -200 - 50],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
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

export default function ProfileHoverCard({ isOpen, onClose, onLogout }: ProfileHoverCardProps) {
  const { profile, refreshProfile, user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const { isAdmin, isDev, isBetaTester } = useAdmin();
  const { addToast } = useUIStore();

  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeSubject, setActiveSubject] = useState<ActiveSubject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch the most recently studied subject/folder
  const fetchActiveSubject = useCallback(async () => {
    if (!user) return;
    try {
      // Get most recently updated folder
      const { data } = await (supabase.from("folders") as any)
        .select("name, color, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        const folder = data[0];
        const lastStudied = new Date(folder.updated_at);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - lastStudied.getTime()) / (1000 * 60 * 60));
        
        let timeAgo = "";
        if (diffHours < 1) timeAgo = "Just now";
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else timeAgo = `${Math.floor(diffHours / 24)}d ago`;
        
        setActiveSubject({
          name: folder.name,
          color: folder.color || "#a855f7",
          lastStudied: timeAgo,
        });
      }
    } catch (err) {
      console.error("Failed to fetch active subject:", err);
    }
  }, [user]);
  
  useEffect(() => {
    if (isOpen && user) {
      fetchActiveSubject();
    }
  }, [isOpen, user, fetchActiveSubject]);

  if (!profile) return null;

  const nextLevelXP = profile.level * 1000;
  const xpProgress = (profile.xp / nextLevelXP) * 100;

  const frameClass = getFrameClass(profile.role, profile.avatar_frame);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearching(true);
    try {
      const { data } = await (supabase.from("profiles") as any)
        .select("id, display_name, avatar_url, level, role")
        .ilike("display_name", `%${searchQuery}%`)
        .neq("id", profile.id)
        .limit(5);
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  /** Handle avatar upload to Supabase Storage */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      addToast("Please select an image file", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast("Image must be under 2MB", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `avatars/${user.id}.${ext}`;

      // Upload to Supabase Storage (avatars bucket)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, fallback to a data URL
        console.warn("Storage upload failed:", uploadError.message);
        // Convert to base64 as fallback
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          await (supabase.from("profiles") as any).update({ avatar_url: dataUrl }).eq("id", user.id);
          await refreshProfile();
          addToast("Avatar updated! ✨", "success");
          setUploadingAvatar(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Update profile with avatar URL
      await (supabase.from("profiles") as any).update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
      await refreshProfile();
      addToast("Avatar updated! ✨", "success");
    } catch (err) {
      console.error("Avatar upload error:", err);
      addToast("Upload failed, try again", "error");
    }
    setUploadingAvatar(false);
  };

  const parsedTitle = profile.title ? profile.title.split("|") : ["", ""];
  const titleText = parsedTitle[0];
  const titleStyleClass = parsedTitle[1] || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`absolute top-full right-0 mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
            isSun
              ? "bg-gradient-to-br from-white/90 via-white/85 to-amber-50/80 border-white/60 text-slate-800"
              : "bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-purple-950/80 border-slate-600/30 text-white"
          }`}
          style={{
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: isSun 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset, 0 0 80px -20px rgba(168, 85, 247, 0.15)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px -20px rgba(139, 92, 246, 0.3)",
          }}
          onMouseLeave={onClose}
        >
          {/* Glassmorphic particles */}
          <GlassParticles count={15} />
          
          {/* Gradient overlay for depth */}
          <div className={`absolute inset-0 pointer-events-none ${
            isSun 
              ? "bg-gradient-to-t from-amber-100/20 via-transparent to-white/30"
              : "bg-gradient-to-t from-purple-900/20 via-transparent to-slate-700/20"
          }`} />
          
          {/* Dev gradient overlay */}
          {isDev && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-indigo-600/30 animate-gradient-x pointer-events-none" />
          )}
          
          <div className="flex flex-col gap-3 relative z-10">
            {/* ― Header / Avatar with upload ― */}
            <div className={`p-5 pb-4 ${
              isSun ? "bg-gradient-to-b from-amber-50/80 to-transparent" : "bg-gradient-to-b from-slate-800/60 to-transparent"
            }`}>
              <div className="flex items-center gap-4">
                {/* Avatar with camera overlay */}
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden ${frameClass} shadow-lg ${
                      isSun ? "bg-slate-100" : "bg-slate-800"
                    }`}
                  >
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="avatar"
                        width={64}
                        height={64}
                        unoptimized
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <UserIcon className={`w-7 h-7 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
                    )}
                  </motion.div>
                  {/* Camera overlay — click to upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className={`absolute inset-0 rounded-xl flex items-center justify-center transition-opacity cursor-pointer ${
                      uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } ${isSun ? "bg-black/30" : "bg-black/50"}`}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-lg font-[family-name:var(--font-nunito)] truncate w-44">
                    {profile.display_name}
                  </h3>
                  {(profile.title || isDev) && (
                    <p className={`text-[11px] font-bold mt-0.5 truncate w-44 ${isDev ? "cosmetic-title-dev" : titleStyleClass} ${
                      !isDev && !titleStyleClass ? (isSun ? "text-slate-600" : "text-slate-400") : ""
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
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full mt-2">
                        <Shield className="w-3 h-3" /> Dev
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ― Level & XP ― */}
            <div className="px-5 pb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs font-bold flex items-center gap-1 ${isSun ? "text-slate-700" : "text-slate-300"}`}>
                  <Zap className="w-3 h-3 text-amber-500" /> Level {profile.level}
                </span>
                <span className={`text-xs ${muted}`}>
                  {Math.floor(profile.xp)} / {nextLevelXP} XP
                </span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-800"}`}>
                <motion.div
                  className={`h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full xp-bar-sparkle-edge`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* ― Badges ― */}
            {(() => {
              const badges: string[] = [];
              if (profile.streak_days >= 30) badges.push("🔥 Dedicated");
              else if (profile.streak_days >= 7) badges.push("🔥 On Fire");
              if (profile.level >= 25) badges.push("🎓 Master");
              else if (profile.level >= 10) badges.push("📚 Scholar");
              if (profile.role === "dev") badges.push("⚡ Creator");
              else if (profile.role === "beta_tester") badges.push("⭐ Pioneer");
              
              return badges.length > 0 ? (
                <div className="px-5 mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {badges.slice(0, 4).map((badge, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
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

            {/* ― Stats Grid ― */}
            <div className="grid grid-cols-3 gap-2 px-5 mb-2">
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className={`p-2.5 rounded-xl text-center relative overflow-hidden ${
                  isSun ? "bg-amber-50/80 border border-amber-200/50" : "bg-amber-500/10 border border-amber-500/20"
                }`}
                style={{
                  boxShadow: isSun 
                    ? "0 4px 12px -2px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)"
                    : "0 4px 12px -2px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <Coins className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
                <div className={`text-sm font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                  {profile.gold.toLocaleString()}
                </div>
                <div className={`text-[9px] font-bold uppercase ${muted}`}>Gold</div>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent -translate-x-full animate-shimmer-slow pointer-events-none" />
              </motion.div>
              
              {/* Enhanced Streak with flames */}
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className={`p-2.5 rounded-xl text-center relative overflow-hidden ${
                  isSun ? "bg-orange-50/80 border border-orange-200/50" : "bg-orange-500/10 border border-orange-500/20"
                }`}
                style={{
                  boxShadow: (profile.streak_days || 0) >= 7
                    ? isSun 
                      ? "0 4px 12px -2px rgba(249, 115, 22, 0.25), inset 0 1px 0 rgba(255,255,255,0.5)"
                      : "0 4px 12px -2px rgba(249, 115, 22, 0.35), 0 0 20px -5px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                    : isSun 
                      ? "0 4px 12px -2px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)"
                      : "0 4px 12px -2px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="h-4 mb-1">
                  <StreakFlame intensity={profile.streak_days || 0} />
                </div>
                <div className={`text-sm font-bold ${
                  (profile.streak_days || 0) >= 30 ? "text-orange-400" :
                  (profile.streak_days || 0) >= 14 ? "text-orange-500" :
                  isSun ? "text-orange-600" : "text-orange-400"
                }`}>
                  {profile.streak_days || 0}
                </div>
                <div className={`text-[9px] font-bold uppercase ${muted}`}>Streak</div>
                {/* Fire glow for high streaks */}
                {(profile.streak_days || 0) >= 7 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none" />
                )}
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className={`p-2.5 rounded-xl text-center relative overflow-hidden ${
                  isSun ? "bg-purple-50/80 border border-purple-200/50" : "bg-purple-500/10 border border-purple-500/20"
                }`}
                style={{
                  boxShadow: isSun 
                    ? "0 4px 12px -2px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)"
                    : "0 4px 12px -2px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <Star className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-purple-500" : "text-purple-400"}`} />
                <div className={`text-sm font-bold ${isSun ? "text-purple-600" : "text-purple-400"}`}>
                  {Math.floor(profile.xp)}
                </div>
                <div className={`text-[9px] font-bold uppercase ${muted}`}>XP</div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/20 to-transparent -translate-x-full animate-shimmer-slow pointer-events-none" />
              </motion.div>
            </div>
            
            {/* ― Active Subject / Currently Studying ― */}
            {activeSubject && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-3"
              >
                <div className={`p-3 rounded-xl border relative overflow-hidden ${
                  isSun 
                    ? "bg-gradient-to-r from-white/60 to-slate-50/60 border-slate-200/50" 
                    : "bg-gradient-to-r from-white/5 to-slate-800/30 border-white/10"
                }`}
                style={{
                  boxShadow: `0 0 20px -5px ${activeSubject.color}40`,
                }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: `${activeSubject.color}20`,
                        border: `2px solid ${activeSubject.color}50`,
                      }}
                    >
                      <BookOpen className="w-4 h-4" style={{ color: activeSubject.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className={`w-3 h-3 ${isSun ? "text-purple-500" : "text-purple-400"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                          Currently Studying
                        </span>
                      </div>
                      <p className="text-sm font-bold truncate" style={{ color: activeSubject.color }}>
                        {activeSubject.name}
                      </p>
                    </div>
                    <span className={`text-[10px] ${muted} shrink-0`}>
                      {activeSubject.lastStudied}
                    </span>
                  </div>
                  {/* Subtle glow */}
                  <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, ${activeSubject.color}, transparent 70%)`,
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* ― Friend Search ― */}
            <div className="px-5 mb-3">
              {!showFriendSearch ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFriendSearch(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isSun
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" /> Find Friends
                  </button>
                  <button
                    onClick={() => addToast("Co-op Ritual coming in v1.1! 🧙", "success")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isSun
                        ? "bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200"
                        : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Co-op Ritual
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search by name..."
                      className={`flex-1 px-3 py-2 rounded-lg text-xs border outline-none ${
                        isSun
                          ? "bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-emerald-400"
                          : "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500"
                      }`}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className={`px-3 py-2 rounded-lg text-xs font-bold ${
                        isSun ? "bg-emerald-500 text-white" : "bg-emerald-600 text-white"
                      } disabled:opacity-50`}
                    >
                      {searching ? "..." : <Search className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            isSun ? "bg-slate-50" : "bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                              isSun ? "bg-slate-200" : "bg-slate-700"
                            }`}>
                              {u.avatar_url ? (
                                <Image src={u.avatar_url} alt="" width={28} height={28} unoptimized className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <UserIcon className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold truncate max-w-28">{u.display_name}</p>
                              <p className={`text-[9px] ${muted}`}>Lv. {u.level}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToast("Friends coming in v1.1! 🚀", "success")}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSun ? "text-emerald-500 hover:bg-emerald-50" : "text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && !searching && (
                    <p className={`text-[10px] text-center py-1 ${muted}`}>No travelers found</p>
                  )}
                </div>
              )}
            </div>

            {/* ― Actions ― */}
            <div className={`border-t px-5 py-3 space-y-1 ${
              isSun ? "border-slate-100" : "border-slate-800"
            }`}>
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
