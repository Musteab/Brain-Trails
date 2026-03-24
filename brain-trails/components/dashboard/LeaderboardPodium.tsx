"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { User, Trophy, ChevronRight, Flame, Crown } from "lucide-react";
import Link from "next/link";

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)",
            }}
          >
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <h3 className={`text-sm font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
            Realm Leaders
          </h3>
        </div>
        <Link 
          href="/achievements"
          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            isSun ? "text-amber-600 hover:text-amber-700" : "text-amber-400 hover:text-amber-300"
          }`}
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
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
              className={`relative flex items-center gap-2.5 p-2.5 rounded-2xl transition-all ${
                member.isCurrentUser 
                  ? "bg-indigo-500/10 ring-1 ring-indigo-500/30" 
                  : "hover:bg-white/[0.04]"
              }`}
              style={{
                boxShadow: idx === 0 
                  ? "0 0 20px rgba(251, 191, 36, 0.15)" 
                  : idx === 1 
                  ? "0 0 15px rgba(148, 163, 184, 0.1)" 
                  : undefined,
              }}
            >
              {/* Rank medal with enhanced styling */}
              <div 
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  idx === 0 
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30" 
                    : idx === 1 
                    ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700 shadow-lg shadow-slate-400/20"
                    : idx === 2
                    ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-lg shadow-orange-600/20"
                    : isSun ? "bg-slate-100 text-slate-500" : "bg-white/10 text-slate-400"
                }`}
              >
                {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : `#${member.rank}`}
              </div>

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
                <div className="flex items-center gap-2">
                  <p className={`text-[10px] font-semibold ${isSun ? 'text-purple-600' : 'text-purple-400'}`}>
                    {member.points.toLocaleString()} XP
                  </p>
                  {member.level && member.level >= 10 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSun ? "bg-amber-100 text-amber-600" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      Lv.{member.level}
                    </span>
                  )}
                </div>
              </div>

              {/* Streak indicator for top players */}
              {idx < 3 && (
                <div className={`flex items-center gap-0.5 ${isSun ? "text-orange-500" : "text-orange-400"}`}>
                  <Flame className="w-3 h-3" />
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
});

export default LeaderboardPodium;
