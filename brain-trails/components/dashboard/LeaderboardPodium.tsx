"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCardStyles } from "@/hooks/useCardStyles";

interface GuildMember {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  points: number;
  isCurrentUser: boolean;
}

const LeaderboardPodium = memo(function LeaderboardPodium() {
  const { card, title, subtitle, isSun } = useCardStyles();
  const { user } = useAuth();
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Fetch top 5 users by XP
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, xp')
        .order('xp', { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setIsLoading(false);
        return;
      }

      const formattedMembers: GuildMember[] = (data || []).map((profile, index) => ({
        id: profile.id,
        rank: index + 1,
        // Fallback names if missing
        name: profile.display_name || `Traveler ${profile.id.substring(0,4)}`, 
        // Default RPG avatars if missing
        avatar: profile.avatar_url || (index % 2 === 0 ? '🦊' : '🐼'),
        points: profile.xp || 0,
        isCurrentUser: user ? profile.id === user.id : false,
      }));

      setMembers(formattedMembers);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [user]);

  const getRankBorder = (rank: number) => {
    switch (rank) {
      case 1: return "border-yellow-400 border-2";
      case 2: return "border-slate-300 border-2";
      case 3: return "border-amber-600 border-2";
      default: return "border-slate-500 border border-opacity-30";
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-yellow-500/50";
      case 2: return "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-400/50";
      case 3: return "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-amber-600/50";
      default: return isSun ? "bg-slate-200 text-slate-600" : "bg-slate-800 text-slate-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full p-5 ${card}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold ${title} font-[family-name:var(--font-nunito)]`}>
            Realm Leaders
          </h3>
          <p className={`text-xs ${subtitle} font-[family-name:var(--font-quicksand)]`}>Top scholars by XP</p>
        </div>
        <div className="w-8 h-8 relative p-1 bg-white/10 border border-white/20 rounded-full">
          <Image
            src="/assets/icons/star.png"
            alt="Leaderboard"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3 relative min-h-[220px]">
        {isLoading ? (
          // Loading Skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className={`h-[72px] rounded-[20px] animate-pulse ${isSun ? "bg-slate-200" : "bg-slate-800"}`} />
          ))
        ) : members.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50 text-center">
            No scholars have earned XP yet.<br />Be the first!
          </div>
        ) : (
          <AnimatePresence>
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center gap-3 p-3 lg:p-4 rounded-[20px] transition-all duration-300
                  ${member.isCurrentUser 
                    ? `scale-[1.02] border-2 shadow-lg z-10 ${isSun ? 'bg-indigo-50 border-indigo-200 shadow-indigo-200' : 'bg-indigo-900/40 border-indigo-500/50 shadow-indigo-500/20'}`
                    : `${isSun ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/40 border border-slate-700/50'}`
                  }
                `}
              >
                {/* Rank Badge */}
                <div className={`
                  flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center 
                  font-bold text-sm lg:text-base shadow-sm
                  ${getRankBg(member.rank)}
                `}>
                  #{member.rank}
                </div>

                {/* Avatar (either URL or Emoji fallback) */}
                <div className={`
                  flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden flex items-center justify-center
                  text-2xl ${isSun ? 'bg-white' : 'bg-slate-900'} ${getRankBorder(member.rank)}
                `}>
                  {member.avatar.startsWith('http') ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.avatar
                  )}
                </div>

                {/* Name & Points */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm lg:text-base font-bold truncate ${title} font-[family-name:var(--font-quicksand)]`}>
                      {member.name}
                    </span>
                    {member.isCurrentUser && (
                      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-indigo-500 text-white shadow-sm">
                        YOU
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-3.5 h-3.5 relative">
                      <Image
                        src="/assets/icons/idr-coin.png"
                        alt="Points"
                        width={14}
                        height={14}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-xs lg:text-sm font-bold text-amber-500 font-[family-name:var(--font-quicksand)]">
                      {member.points.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Trophy for 1st */}
                {member.rank === 1 && (
                  <motion.div
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex-shrink-0 text-2xl drop-shadow-md"
                  >
                    🏆
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

export default LeaderboardPodium;