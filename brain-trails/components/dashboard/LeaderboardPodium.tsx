"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface GuildMember {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPodium() {
  const members: GuildMember[] = [
    { rank: 1, name: 'You', avatar: '🦊', points: 2450, isCurrentUser: true },
    { rank: 2, name: 'Rezq', avatar: '🐯', points: 2380, isCurrentUser: false },
    { rank: 3, name: 'Ethan', avatar: '🐼', points: 2210, isCurrentUser: false },
  ];

  const getRankBorder = (rank: number) => {
    switch (rank) {
      case 1: return "border-yellow-400 border-2";
      case 2: return "border-gray-300 border-2";
      case 3: return "border-amber-600 border-2";
      default: return "border-gray-200 border";
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-400 to-orange-500 text-white";
      case 2: return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
      case 3: return "bg-gradient-to-br from-amber-600 to-amber-700 text-white";
      default: return "bg-gray-200/50 text-gray-600";
    }
  };

  const getAvatarBorder = (rank: number) => {
    switch (rank) {
      case 1: return "border-yellow-400 border-3";
      case 2: return "border-gray-300 border-3";
      case 3: return "border-amber-600 border-3";
      default: return "border-gray-300 border-2";
    }
  };

  const { card, title, subtitle, isSun } = useCardStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`w-full p-5 ${card}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-semibold ${title} font-[family-name:var(--font-nunito)]`}>
            Guild Ranking
          </h3>
          <p className={`text-xs ${subtitle} mt-1 font-[family-name:var(--font-quicksand)]`}>Weekly leaderboard</p>
        </div>
        <div className="w-6 h-6 relative">
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
      <div className="space-y-3">
        {members.map((member, index) => (
          <motion.div
            key={member.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`
              flex items-center gap-3 p-4 rounded-[20px] transition-all duration-200
              ${member.isCurrentUser 
                ? `scale-105 ${isSun ? 'bg-purple-100 border-2 border-purple-300 shadow-lg shadow-purple-200/50' : 'bg-[#9D4EDD]/25 border-2 border-[#9D4EDD]/50 shadow-lg shadow-[#9D4EDD]/30'}`
                : `hover:scale-[1.02] ${isSun ? 'bg-amber-50/50 border border-amber-200/30' : 'bg-white/5 border border-white/10'}`
              }
            `}
          >
            {/* Rank Badge */}
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
              font-bold text-sm shadow-lg
              ${getRankBg(member.rank)}
            `}>
              #{member.rank}
            </div>

            {/* Avatar */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
              text-2xl ${isSun ? 'bg-white' : 'bg-slate-800/80'} ${getAvatarBorder(member.rank)}
            `}>
              {member.avatar}
            </div>

            {/* Name & Points */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${title} font-[family-name:var(--font-quicksand)]`}>
                  {member.name}
                </span>
                {member.isCurrentUser && (
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-[family-name:var(--font-quicksand)] ${
                    isSun ? 'bg-purple-100 text-purple-600' : 'bg-[#9D4EDD]/20 text-[#9D4EDD]'
                  }`}>
                    YOU
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-3 h-3 relative">
                  <Image
                    src="/assets/icons/idr-coin.png"
                    alt="Points"
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                </div>
                <span className="text-xs font-semibold text-amber-600 font-[family-name:var(--font-quicksand)]">
                  {member.points.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* Trophy for top rank */}
            {member.rank === 1 && (
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0 text-2xl"
              >
                🏆
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Progress to next rank */}
      <div className={`mt-5 pt-5 border-t ${isSun ? 'border-amber-200/50' : 'border-white/10'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs ${subtitle} font-[family-name:var(--font-quicksand)]`}>Next reward at 3000 pts</span>
          <span className={`text-xs font-semibold font-[family-name:var(--font-quicksand)] ${isSun ? 'text-purple-600' : 'text-[#C77DFF]'}`}>550 to go</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isSun ? 'bg-purple-100' : 'bg-white/10'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '82%' }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-[#9D4EDD] to-[#C77DFF]"
          />
        </div>
      </div>
    </motion.div>
  );
}