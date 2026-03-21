"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { User, Shield, Star } from "lucide-react";

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

const LeaderboardItem = ({ member, isSun }: { member: GuildMember; isSun: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (member.rank - 1) * 0.1 }}
      className={`
        flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
        ${member.isCurrentUser 
          ? `bg-indigo-500/10 border border-indigo-500/30`
          : `bg-transparent border border-transparent hover:${isSun ? 'bg-white/40' : 'bg-white/5'}`
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
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs font-bold ${isSun ? 'text-purple-600' : 'text-purple-400'}`}>
            {member.points.toLocaleString()} XP
          </span>
        </div>
      </div>
    </motion.div>
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
        .limit(3); // Only top 3

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
      <div className="flex-1 flex flex-col justify-center gap-2">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className={`h-[64px] rounded-2xl animate-pulse ${isSun ? "bg-white/50" : "bg-white/5"}`} />
          ))
        ) : members.length === 0 ? (
          <div className="text-center text-sm opacity-50 py-4">
            No scholars yet.
          </div>
        ) : (
          <AnimatePresence>
            {members.map((member) => (
              <LeaderboardItem 
                key={member.id} 
                member={member} 
                isSun={isSun} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});

export default LeaderboardPodium;