"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { User, Zap, Trophy, Flame } from "lucide-react";

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

function getRoleBadge(role?: string | null) {
  if (role === "dev") return { label: "Developer", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  if (role === "admin") return { label: "Admin", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  if (role === "beta_tester") return { label: "Beta Tester", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
  return null;
}

const LeaderboardItem = ({ member, isSun }: { member: GuildMember; isSun: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const roleBadge = getRoleBadge(member.role);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (member.rank - 1) * 0.1 }}
        className={`
          flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 cursor-pointer
          ${member.isCurrentUser 
            ? `bg-indigo-500/10 border border-indigo-500/30`
            : isSun ? 'bg-transparent border border-transparent hover:bg-white/40' : 'bg-transparent border border-transparent hover:bg-white/5'
          }
        `}
      >
        {/* Rank */}
        <div className={`w-6 text-center font-bold text-lg ${
          member.rank === 1 ? 'text-yellow-500' :
          member.rank === 2 ? 'text-slate-400' :
          member.rank === 3 ? 'text-amber-600' :
          isSun ? 'text-slate-400' : 'text-slate-500'
        }`}>
          #{member.rank}
        </div>

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${isSun ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-300'} ${getFrameClass(member.role, member.title_border)}`}>
          {member.avatar ? (
            <Image src={member.avatar} alt={member.name} width={40} height={40} unoptimized className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold truncate font-[family-name:var(--font-quicksand)] ${isSun ? 'text-slate-800' : 'text-white'}`}>
              {member.name}
            </span>
            {roleBadge && (
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-bold ${isSun ? 'text-purple-600' : 'text-purple-400'}`}>
              {member.points.toLocaleString()} XP
            </span>
          </div>
        </div>
      </motion.div>

      {/* Profile Preview Hover Card */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 left-0 right-0 mt-1 p-4 rounded-2xl border shadow-2xl ${
              isSun 
                ? "bg-white/95 border-white/80 backdrop-blur-xl" 
                : "bg-slate-900/95 border-white/10 backdrop-blur-xl"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Large Avatar */}
              <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-md ${
                isSun ? 'bg-slate-100' : 'bg-slate-800'
              } ${getFrameClass(member.role, member.title_border)}`}>
                {member.avatar ? (
                  <Image src={member.avatar} alt={member.name} width={56} height={56} unoptimized className="w-full h-full object-cover" />
                ) : (
                  <User className={`w-7 h-7 ${isSun ? 'text-slate-400' : 'text-slate-500'}`} />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate font-[family-name:var(--font-nunito)] ${isSun ? 'text-slate-800' : 'text-white'}`}>
                  {member.name}
                </p>
                {member.title && (
                  <p className={`text-[10px] font-medium ${isSun ? 'text-amber-600' : 'text-amber-400'}`}>
                    {member.title}
                  </p>
                )}
                {roleBadge && (
                  <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-current/5">
              <div className="flex items-center gap-1.5">
                <Trophy className={`w-3.5 h-3.5 ${isSun ? 'text-amber-500' : 'text-amber-400'}`} />
                <span className={`text-xs font-bold ${isSun ? 'text-slate-700' : 'text-white'}`}>
                  #{member.rank}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${isSun ? 'text-purple-500' : 'text-purple-400'}`} />
                <span className={`text-xs font-bold ${isSun ? 'text-slate-700' : 'text-white'}`}>
                  Lv.{member.level || 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 ${isSun ? 'text-orange-500' : 'text-orange-400'}`} />
                <span className={`text-xs font-bold ${isSun ? 'text-slate-700' : 'text-white'}`}>
                  {member.points.toLocaleString()} XP
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeaderboardPodium = memo(function LeaderboardPodium() {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const { user } = useAuth();
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, xp, title, title_border, level, role')
        .order('xp', { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setIsLoading(false);
        return;
      }

      const formattedMembers: GuildMember[] = (data || []).map((profile, index) => ({
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

  const glassClasses = isSun 
    ? "bg-white/40 border border-white/60 shadow-xl backdrop-blur-md text-slate-800" 
    : "bg-black/20 border border-white/10 shadow-xl backdrop-blur-md text-white";

  return (
    <div className={`p-5 rounded-[24px] ${glassClasses} flex flex-col`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-base font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
          Realm Leaders
        </h3>
        <p className={`text-xs ${isSun ? "text-slate-500" : "text-white/50"}`}>
          Top scholars this week
        </p>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className={`h-[64px] rounded-2xl animate-pulse ${isSun ? "bg-white/50" : "bg-white/5"}`} />
          ))
        ) : members.length === 0 ? (
          <div className="text-center text-sm opacity-50 py-4">
            No scholars yet.
          </div>
        ) : (
          members.map((member) => (
            <LeaderboardItem 
              key={member.id} 
              member={member} 
              isSun={isSun} 
            />
          ))
        )}
      </div>
    </div>
  );
});

export default LeaderboardPodium;