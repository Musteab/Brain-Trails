/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useAdmin } from "@/hooks/useAdmin";
import { Settings, LogOut, Shield, Star, User as UserIcon, Search, UserPlus, Coins, Flame, Zap, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/stores";

interface ProfileHoverCardProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/** Picks the right frame class based on role / shop cosmetic */
function getFrameClass(role?: string | null, avatarFrame?: string | null) {
  if (avatarFrame && avatarFrame !== 'default') return avatarFrame;
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  return "";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const nextLevelXP = profile.level * 1000;
  const xpProgress = (profile.xp / nextLevelXP) * 100;

  const frameClass = getFrameClass(profile.role, profile.avatar_frame);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
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
          await supabase.from("profiles").update({ avatar_url: dataUrl }).eq("id", user.id);
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
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
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
          transition={{ duration: 0.2 }}
          className={`absolute top-full right-0 mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
            isSun
              ? "bg-white/95 border-slate-200 text-slate-800 backdrop-blur-xl"
              : "bg-slate-900/95 border-slate-700/50 text-white backdrop-blur-xl"
          }`}
          onMouseLeave={onClose}
        >
          {/* Dev gradient overlay */}
          {isDev && <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-20 animate-gradient-x pointer-events-none" />}
          
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

            {/* ― Stats Grid ― */}
            <div className="grid grid-cols-3 gap-2 px-5 mb-4">
              <div className={`p-2.5 rounded-xl text-center ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
                <Coins className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
                <div className={`text-sm font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                  {profile.gold.toLocaleString()}
                </div>
                <div className={`text-[9px] font-bold uppercase ${muted}`}>Gold</div>
              </div>
              <div className={`p-2.5 rounded-xl text-center ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
                <Flame className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-orange-500" : "text-orange-400"}`} />
                <div className={`text-sm font-bold ${isSun ? "text-orange-600" : "text-orange-400"}`}>
                  {profile.streak_days || 0}
                </div>
                <div className={`text-[9px] font-bold uppercase ${muted}`}>Streak</div>
              </div>
              <div className={`p-2.5 rounded-xl text-center ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
                <Star className={`w-4 h-4 mx-auto mb-1 ${isSun ? "text-purple-500" : "text-purple-400"}`} />
                <div className={`text-sm font-bold ${isSun ? "text-purple-600" : "text-purple-400"}`}>
                  {Math.floor(profile.xp)}
                </div>
                <div className={`text-[9px] font-bold uppercase ${muted}`}>XP</div>
              </div>
            </div>

            {/* ― Friend Search ― */}
            <div className="px-5 mb-3">
              {!showFriendSearch ? (
                <button
                  onClick={() => setShowFriendSearch(true)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isSun
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" /> Find Friends
                </button>
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
