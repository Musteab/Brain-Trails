"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { User, Trophy } from "lucide-react";

interface GuildMember {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  points: number;
  isCurrentUser: boolean;
  title?: string | null;
  title_border?: string | null;
  level?: number | null;
  role?: string | null;
}

function getFrameClass(role?: string | null, titleBorder?: string | null) {
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  if (titleBorder) return "frame-shop";
  return "";
}

const RANK_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-600"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

/**
 * Right Panel - Community Hub / Realm Leaders
 * Compact frosted glass panel with top 3 users, zero extra borders
 */
const LeaderboardPodium = memo(function LeaderboardPodium() {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const { user } = useAuth();
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('id, display_name, avatar_url, xp, title, title_border, level, role')
        .order('xp', { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setIsLoading(false);
        return;
      }

      const formattedMembers: GuildMember[] = (data || []).map((profile: any, index: number) => ({
        id: profile.id,
        rank: index + 1,
        name: profile.display_name || `Traveler ${profile.id.substring(0,4)}`, 
        avatar: profile.avatar_url || '',
        points: profile.xp || 0,
        isCurrentUser: user ? profile.id === user.id : false,
        title: profile.title,
        title_border: profile.title_border,
        level: profile.level,
        role: profile.role,
      }));

      setMembers(formattedMembers);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [user]);

  const glassPanel = isSun 
    ? "bg-white/30 border border-white/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]" 
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  const glassInner = isSun
    ? "inset 0 1px 0 rgba(255,255,255,0.6)"
    : "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.03)";

  return (
    <div 
      className={`p-5 rounded-[24px] ${glassPanel}`}
      style={{ boxShadow: glassInner }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className={`w-4 h-4 ${isSun ? "text-amber-500" : "text-amber-400"}`} />
        <h3 className={`text-sm font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
          Realm Leaders
        </h3>
      </div>

      {/* Streamlined Leaderboard - no extra borders */}
      <div className="flex flex-col gap-1">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className={`h-[52px] rounded-2xl animate-pulse ${isSun ? "bg-white/40" : "bg-white/[0.03]"}`} />
          ))
        ) : members.length === 0 ? (
          <div className={`text-center text-xs py-6 ${isSun ? "text-slate-400" : "text-white/30"}`}>
            No scholars yet.
          </div>
        ) : (
          members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`flex items-center gap-2.5 p-2.5 rounded-2xl transition-colors ${
                member.isCurrentUser 
                  ? "bg-indigo-500/10" 
                  : "hover:bg-white/[0.04]"
              }`}
            >
              {/* Rank medal */}
              <span className="text-base w-5 text-center">{RANK_ICONS[idx] || `#${member.rank}`}</span>

              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
                isSun ? 'bg-slate-100' : 'bg-slate-800'
              } ${getFrameClass(member.role, member.title_border)}`}>
                {member.avatar ? (
                  <Image src={member.avatar} alt={member.name} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Name & XP */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${isSun ? 'text-slate-700' : 'text-white'}`}>
                  {member.name}
                </p>
                <p className={`text-[10px] font-semibold ${isSun ? 'text-purple-600' : 'text-purple-400'}`}>
                  {member.points.toLocaleString()} XP
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
});

export default LeaderboardPodium;
