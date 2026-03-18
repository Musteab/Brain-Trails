"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCardStyles } from "@/hooks/useCardStyles";
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

/** Picks the right frame class based on role / shop cosmetic */
function getFrameClass(role?: string | null, titleBorder?: string | null) {
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  if (titleBorder) return "frame-shop";
  return "";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const LeaderboardItem = ({ member, isSun, getRankBg, getRankBorder, title }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDev = member.role === 'dev';
  const isBeta = member.role === 'beta_tester';
  const isAdmin = member.role === 'admin';

  const frameClass = getFrameClass(member.role, member.title_border);
  const frameStyle: React.CSSProperties = member.title_border && !isDev && !isAdmin && !isBeta
    ? { "--shop-frame-color": member.title_border } as any
    : {};
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (member.rank - 1) * 0.1 }}
        className={`
          flex items-center gap-3 p-3 lg:p-4 rounded-[20px] transition-all duration-300 cursor-pointer
          ${isHovered ? 'scale-[1.03] shadow-xl z-20 ' : ''}
          ${member.isCurrentUser 
            ? `border-2 shadow-lg z-10 ${isSun ? 'bg-indigo-50 border-indigo-200 shadow-indigo-200' : 'bg-indigo-900/40 border-indigo-500/50 shadow-indigo-500/20'}`
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

        {/* Avatar */}
        <div
          className={`
            flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden flex items-center justify-center
            ${isSun ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'}
            ${frameClass || getRankBorder(member.rank)}
          `}
          style={frameStyle}
        >
          {member.avatar ? (
            <Image src={member.avatar} alt={member.name} width={48} height={48} unoptimized className="w-full h-full object-cover" />
          ) : (
             <User className="w-5 h-5 lg:w-6 lg:h-6" />
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

      {/* Popout Hover Card */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 lg:right-full lg:left-auto lg:mr-4 lg:top-0 mt-2 lg:mt-0 w-64 rounded-xl shadow-2xl p-4 z-50 border backdrop-blur-md pointer-events-none ${
               isSun ? "bg-white/95 border-slate-200" : "bg-slate-900/95 border-slate-700/50"
            }`}
          >
            {isDev && <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 opacity-20 animate-gradient-x pointer-events-none" />}
            
            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${frameClass || `border-2 ${isSun ? "border-white shadow-sm" : "border-slate-700"}`} ${isSun ? "bg-slate-100" : "bg-slate-800"}`}
                  style={frameStyle}
                >
                   {member.avatar ? <Image src={member.avatar} width={48} height={48} alt="" unoptimized className="w-full h-full object-cover" /> : <User className={`w-6 h-6 ${isSun ? "text-slate-400" : "text-slate-500"}`} />}
                </div>
                <div>
                  <h4 className={`font-bold text-sm truncate w-40 font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>{member.name}</h4>
                  {(member.title || isDev) && (
                    <p className={`text-[10px] font-bold mt-0.5 truncate w-40 ${isDev ? "text-amber-500" : isSun ? "text-purple-600" : "text-purple-400"}`}>
                      {isDev ? "🏛️ Realm Arch-Mage" : member.title}
                    </p>
                  )}
                  <div className="flex gap-1 mt-1">
                    {isBeta && !isDev && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> Beta
                      </span>
                    )}
                    {isDev && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Dev
                      </span>
                    )}
                    {isAdmin && !isDev && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`pt-2 border-t ${isSun ? "border-slate-100" : "border-slate-800"}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${isSun ? "text-slate-700" : "text-slate-300"}`}>Level {member.level || 1}</span>
                  <span className={`text-[10px] font-medium ${isSun ? "text-slate-500" : "text-slate-400"}`}>{member.points.toLocaleString()} XP</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-800"}`}>
                   <div className={`h-full ${isSun ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-amber-500 to-orange-500"}`} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
        .select('id, display_name, avatar_url, xp, title, title_border, level, role')
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
      className={`w-full p-5 shadow-sm hover:shadow-md transition-shadow ${card} !overflow-visible`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold ${title} font-[family-name:var(--font-nunito)]`}>
            Realm Leaders
          </h3>
          <p className={`text-xs ${subtitle} font-[family-name:var(--font-quicksand)]`}>Hover to view profiles ✨</p>
        </div>
        <div className="w-8 h-8 relative p-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
          <Image
            src="/assets/icons/star.png"
            alt="Leaderboard"
            width={20}
            height={20}
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
            {members.map((member) => (
              <LeaderboardItem 
                key={member.id} 
                member={member} 
                isSun={isSun} 
                getRankBg={getRankBg} 
                getRankBorder={getRankBorder} 
                title={title} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

export default LeaderboardPodium;