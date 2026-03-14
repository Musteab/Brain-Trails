"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Shield, Crown, Swords } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useCardStyles } from "@/hooks/useCardStyles";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  role: "member" | "officer" | "leader";
  weekly_xp: number;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    level: number;
  };
}

interface GuildLeaderboardProps {
  guildId: string;
}

const RANK_STYLES = [
  { bg: "from-amber-400 to-yellow-500", text: "text-amber-900", icon: Crown, label: "1st" },
  { bg: "from-slate-300 to-slate-400", text: "text-slate-800", icon: Medal, label: "2nd" },
  { bg: "from-amber-600 to-orange-700", text: "text-amber-100", icon: Medal, label: "3rd" },
];

const ROLE_BADGES: Record<string, { color: string; icon: typeof Shield; label: string }> = {
  leader: { color: "text-amber-500", icon: Crown, label: "Leader" },
  officer: { color: "text-blue-500", icon: Swords, label: "Officer" },
  member: { color: "text-slate-400", icon: Shield, label: "Member" },
};

export default function GuildLeaderboard({ guildId }: GuildLeaderboardProps) {
  const { card, isSun, title, muted, item: itemStyle } = useCardStyles();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guildId) return;

    const fetch = async () => {
      const { data, error } = await supabase
        .from("guild_members")
        .select("id, user_id, role, weekly_xp, profiles:user_id ( display_name, avatar_url, level )")
        .eq("guild_id", guildId)
        .order("weekly_xp", { ascending: false });

      if (!error && data) {
        setEntries(data as unknown as LeaderboardEntry[]);
      }
      setLoading(false);
    };

    fetch();
  }, [guildId]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`${card} p-6`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className={`text-lg ${title}`}>Weekly Leaderboard</h3>
          <p className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
            XP earned this week
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className={`text-center py-8 ${muted} font-[family-name:var(--font-quicksand)]`}>
          No members yet.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isTop3 = index < 3;
            const rankStyle = isTop3 ? RANK_STYLES[index] : null;
            const roleBadge = ROLE_BADGES[entry.role] || ROLE_BADGES.member;
            const RoleBadgeIcon = roleBadge.icon;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${itemStyle}`}
              >
                {/* Rank */}
                <div className="w-8 flex-shrink-0 text-center">
                  {isTop3 && rankStyle ? (
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankStyle.bg} flex items-center justify-center shadow-md`}
                    >
                      <span className={`text-xs font-black ${rankStyle.text}`}>
                        {rankStyle.label}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-sm font-bold ${muted}`}>#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isSun
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {entry.profiles?.avatar_url ? (
                    <Image
                      src={entry.profiles.avatar_url}
                      alt={entry.profiles.display_name || "User"}
                      width={36}
                      height={36}
                      unoptimized
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(entry.profiles?.display_name)
                  )}
                </div>

                {/* Name & Role */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold truncate font-[family-name:var(--font-nunito)] ${
                      isSun ? "text-slate-800" : "text-white"
                    }`}
                  >
                    {entry.profiles?.display_name || "Unknown Traveler"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <RoleBadgeIcon className={`w-3 h-3 ${roleBadge.color}`} />
                    <span className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
                      {roleBadge.label} · Lv. {entry.profiles?.level || 1}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star
                    className={`w-4 h-4 ${
                      isTop3 ? "text-amber-400" : isSun ? "text-purple-500" : "text-[#C77DFF]"
                    }`}
                  />
                  <span
                    className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                      isTop3
                        ? "text-amber-500"
                        : isSun
                        ? "text-purple-600"
                        : "text-[#C77DFF]"
                    }`}
                  >
                    {entry.weekly_xp.toLocaleString()}
                  </span>
                  <span className={`text-xs ${muted}`}>XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
