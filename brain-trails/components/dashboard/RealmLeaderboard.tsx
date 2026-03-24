// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  Trophy, Crown, Star, Flame, Zap, Shield, 
  Sparkles, Medal, Target, BookOpen, Clock, User
} from "lucide-react";

interface LeaderboardPlayer {
  id: string;
  rank: number;
  display_name: string;
  avatar_url?: string;
  xp: number;
  level: number;
  title?: string;
  title_border?: string;
  role?: string;
  streak_days?: number;
  total_focus_minutes?: number;
  badges?: string[];
  mastery_percent?: number;
  isCurrentUser: boolean;
}

type RankTier = "legendary" | "epic" | "rare" | "uncommon" | "common";

/**
 * Realm Leaderboard - Gem-Studded Metal Plaque
 * 
 * Features:
 * - Ornate metal plaque design with gem decorations
 * - ALL players listed (with pagination)
 * - Legendary hover cards showing full player stats
 * - Glowing borders for top players
 * - Connected floating status plaque on hover
 */
export default function RealmLeaderboard() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPlayer, setHoveredPlayer] = useState<LeaderboardPlayer | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await (supabase.from("profiles") as any)
        .select("id, display_name, avatar_url, xp, level, title, title_border, role, streak_days, total_focus_minutes")
        .order("xp", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setIsLoading(false);
        return;
      }

      const formatted: LeaderboardPlayer[] = (data || []).map((p: any, i: number) => ({
        id: p.id,
        rank: i + 1,
        display_name: p.display_name || `Traveler ${p.id.substring(0, 4)}`,
        avatar_url: p.avatar_url,
        xp: p.xp || 0,
        level: p.level || 1,
        title: p.title,
        title_border: p.title_border,
        role: p.role,
        streak_days: p.streak_days || 0,
        total_focus_minutes: p.total_focus_minutes || 0,
        badges: getBadges(p),
        mastery_percent: Math.min(100, Math.floor((p.xp || 0) / 100)),
        isCurrentUser: user ? p.id === user.id : false,
      }));

      setPlayers(formatted);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [user]);

  const getRankTier = (rank: number, role?: string): RankTier => {
    if (role === "dev" || role === "admin") return "legendary";
    if (rank === 1) return "legendary";
    if (rank <= 3) return "epic";
    if (rank <= 10) return "rare";
    if (rank <= 25) return "uncommon";
    return "common";
  };

  const getTierColors = (tier: RankTier) => {
    switch (tier) {
      case "legendary":
        return {
          border: "linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)",
          glow: "rgba(255, 215, 0, 0.6)",
          bg: "linear-gradient(135deg, #3d2e0f 0%, #1a1505 100%)",
          text: "#ffd700",
        };
      case "epic":
        return {
          border: "linear-gradient(135deg, #a855f7, #ec4899, #a855f7)",
          glow: "rgba(168, 85, 247, 0.5)",
          bg: "linear-gradient(135deg, #2d1f3d 0%, #1a1025 100%)",
          text: "#c084fc",
        };
      case "rare":
        return {
          border: "linear-gradient(135deg, #3b82f6, #06b6d4, #3b82f6)",
          glow: "rgba(59, 130, 246, 0.4)",
          bg: "linear-gradient(135deg, #1e2a3d 0%, #0d1520 100%)",
          text: "#60a5fa",
        };
      case "uncommon":
        return {
          border: "linear-gradient(135deg, #22c55e, #10b981, #22c55e)",
          glow: "rgba(34, 197, 94, 0.3)",
          bg: "linear-gradient(135deg, #1a2e1f 0%, #0d1a10 100%)",
          text: "#4ade80",
        };
      default:
        return {
          border: "linear-gradient(135deg, #6b7280, #9ca3af, #6b7280)",
          glow: "rgba(107, 114, 128, 0.2)",
          bg: "linear-gradient(135deg, #1f2127 0%, #0d0e10 100%)",
          text: "#9ca3af",
        };
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold">#{rank}</span>;
  };

  const handleMouseEnter = (player: LeaderboardPlayer, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setHoveredPlayer(player);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Metal Plaque Frame */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #4a3c2e 0%, #2a2018 50%, #1a1510 100%)",
          boxShadow: `
            inset 0 2px 4px rgba(255, 215, 0, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 0 0 2px #5c4a32
          `,
        }}
      >
        {/* Gem studs on frame */}
        <GemStud position="top-left" color="ruby" />
        <GemStud position="top-right" color="sapphire" />
        <GemStud position="bottom-left" color="emerald" />
        <GemStud position="bottom-right" color="amethyst" />

        {/* Header */}
        <div 
          className="p-4 border-b-2"
          style={{
            background: "linear-gradient(180deg, #3d2e1f 0%, #2a1f15 100%)",
            borderColor: "#5c4a32",
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 
              className="text-xl font-bold font-[family-name:var(--font-cinzel)]"
              style={{
                background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 10px rgba(255, 215, 0, 0.3)",
              }}
            >
              Realm Leaderboard
            </h2>
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-center text-xs text-amber-600/60 mt-1">
            Top scholars of the realm
          </p>
        </div>

        {/* Leaderboard Content */}
        <div 
          className="p-3 max-h-[500px] overflow-y-auto custom-scrollbar"
          style={{ background: "linear-gradient(180deg, #1a1510 0%, #0d0a08 100%)" }}
        >
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-white/5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-amber-500/20" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-amber-500/20 rounded" />
                  <div className="h-3 w-16 bg-amber-500/10 rounded mt-1" />
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-1">
              {players.map((player, index) => {
                const tier = getRankTier(player.rank, player.role);
                const colors = getTierColors(tier);
                const isTop3 = player.rank <= 3;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onMouseEnter={(e) => handleMouseEnter(player, e)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      player.isCurrentUser ? "ring-2 ring-amber-500/50" : ""
                    }`}
                    style={{
                      background: hoveredPlayer?.id === player.id ? colors.bg : "rgba(255, 255, 255, 0.02)",
                      boxShadow: hoveredPlayer?.id === player.id ? `0 0 20px ${colors.glow}` : "none",
                    }}
                  >
                    {/* Rank */}
                    <div 
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isTop3 ? "bg-gradient-to-br" : "bg-white/5"
                      }`}
                      style={isTop3 ? {
                        background: player.rank === 1 
                          ? "linear-gradient(135deg, #ffd700, #ff8c00)"
                          : player.rank === 2
                          ? "linear-gradient(135deg, #c0c0c0, #a0a0a0)"
                          : "linear-gradient(135deg, #cd7f32, #8b4513)",
                      } : {}}
                    >
                      {getRankIcon(player.rank)}
                    </div>

                    {/* Avatar */}
                    <div 
                      className="relative w-10 h-10 rounded-full overflow-hidden"
                      style={{
                        border: isTop3 ? `2px solid ${colors.text}` : "2px solid rgba(255,255,255,0.1)",
                        boxShadow: isTop3 ? `0 0 10px ${colors.glow}` : "none",
                      }}
                    >
                      {player.avatar_url ? (
                        <Image
                          src={player.avatar_url}
                          alt={player.display_name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-900/30">
                          <User className="w-5 h-5 text-amber-400/60" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-bold text-sm truncate"
                          style={{ color: colors.text }}
                        >
                          {player.display_name}
                        </span>
                        {player.role === "dev" && (
                          <Shield className="w-3 h-3 text-amber-400" />
                        )}
                        {player.streak_days >= 7 && (
                          <Flame className="w-3 h-3 text-orange-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-600/60">Lv.{player.level}</span>
                        {player.title && (
                          <span className="text-purple-400/60 truncate">{player.title}</span>
                        )}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <div 
                        className="font-bold text-sm flex items-center gap-1"
                        style={{ color: colors.text }}
                      >
                        <Zap className="w-3 h-3" />
                        {player.xp.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-amber-600/40">XP</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer decoration */}
        <div 
          className="h-2"
          style={{
            background: "linear-gradient(90deg, #2a1f15, #5c4a32, #2a1f15)",
          }}
        />
      </div>

      {/* Legendary Hover Card */}
      <AnimatePresence>
        {hoveredPlayer && (
          <LegendaryHoverCard 
            player={hoveredPlayer}
            position={hoverPosition}
            tier={getRankTier(hoveredPlayer.rank, hoveredPlayer.role)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Legendary Hover Card Component
function LegendaryHoverCard({ 
  player, 
  position,
  tier,
}: { 
  player: LeaderboardPlayer;
  position: { x: number; y: number };
  tier: RankTier;
}) {
  const tierColors = {
    legendary: {
      border: "linear-gradient(135deg, #ffd700, #ff8c00, #ffd700, #ffcc00)",
      glow: "0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 140, 0, 0.3)",
      accent: "#ffd700",
    },
    epic: {
      border: "linear-gradient(135deg, #a855f7, #ec4899, #8b5cf6, #a855f7)",
      glow: "0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(236, 72, 153, 0.2)",
      accent: "#c084fc",
    },
    rare: {
      border: "linear-gradient(135deg, #3b82f6, #06b6d4, #3b82f6)",
      glow: "0 0 25px rgba(59, 130, 246, 0.4)",
      accent: "#60a5fa",
    },
    uncommon: {
      border: "linear-gradient(135deg, #22c55e, #10b981, #22c55e)",
      glow: "0 0 20px rgba(34, 197, 94, 0.3)",
      accent: "#4ade80",
    },
    common: {
      border: "linear-gradient(135deg, #6b7280, #9ca3af, #6b7280)",
      glow: "0 0 15px rgba(107, 114, 128, 0.2)",
      accent: "#9ca3af",
    },
  };

  const colors = tierColors[tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: Math.min(position.x + 20, 200),
        top: position.y - 100,
      }}
    >
      {/* Connection line to player row */}
      <svg 
        className="absolute -left-4 top-1/2 w-8 h-4"
        style={{ transform: "translateY(-50%)" }}
      >
        <path
          d="M 0 8 Q 16 8, 32 8"
          stroke={colors.accent}
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 2"
          style={{ filter: `drop-shadow(0 0 4px ${colors.accent})` }}
        />
      </svg>

      {/* The Card */}
      <div 
        className="w-72 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1510 0%, #0d0a08 100%)",
          border: "3px solid transparent",
          backgroundImage: `${colors.border}, linear-gradient(135deg, #1a1510 0%, #0d0a08 100%)`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: colors.glow,
        }}
      >
        {/* Animated border glow */}
        {tier === "legendary" && (
          <div 
            className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
            style={{
              background: "transparent",
              boxShadow: "inset 0 0 30px rgba(255, 215, 0, 0.2)",
            }}
          />
        )}

        {/* Header with avatar */}
        <div 
          className="p-4 text-center relative"
          style={{
            background: `linear-gradient(180deg, rgba(${tier === "legendary" ? "255, 215, 0" : tier === "epic" ? "168, 85, 247" : "59, 130, 246"}, 0.1) 0%, transparent 100%)`,
          }}
        >
          {/* Rank badge */}
          <div 
            className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold"
            style={{
              background: colors.border,
              color: tier === "legendary" ? "#1a1510" : "white",
            }}
          >
            #{player.rank}
          </div>

          {/* Tier badge */}
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              color: colors.accent,
              border: `1px solid ${colors.accent}40`,
            }}
          >
            {tier}
          </div>

          {/* Avatar */}
          <div 
            className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3"
            style={{
              border: `3px solid ${colors.accent}`,
              boxShadow: `0 0 20px ${colors.accent}60`,
            }}
          >
            {player.avatar_url ? (
              <Image
                src={player.avatar_url}
                alt={player.display_name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-900/30 text-3xl">
                🧙
              </div>
            )}
          </div>

          {/* Name & Title */}
          <h3 
            className="font-bold text-lg font-[family-name:var(--font-cinzel)]"
            style={{ color: colors.accent }}
          >
            {player.display_name}
          </h3>
          {player.title && (
            <p className="text-sm text-purple-400 mt-0.5">{player.title}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-4 border-t border-amber-900/30">
          <StatBox 
            icon={<Star className="w-4 h-4" />}
            label="Level"
            value={player.level.toString()}
            color={colors.accent}
          />
          <StatBox 
            icon={<Zap className="w-4 h-4" />}
            label="XP"
            value={player.xp.toLocaleString()}
            color={colors.accent}
          />
          <StatBox 
            icon={<Flame className="w-4 h-4" />}
            label="Streak"
            value={`${player.streak_days || 0}d`}
            color={colors.accent}
          />
        </div>

        {/* Additional stats */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-[10px] text-white/40">Focus Time</p>
              <p className="text-xs font-bold text-white">
                {Math.floor((player.total_focus_minutes || 0) / 60)}h {(player.total_focus_minutes || 0) % 60}m
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <Target className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-[10px] text-white/40">Mastery</p>
              <p className="text-xs font-bold text-white">
                {player.mastery_percent || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {player.badges && player.badges.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Badges</p>
            <div className="flex flex-wrap gap-1">
              {player.badges.map((badge, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: `${colors.accent}20`,
                    color: colors.accent,
                    border: `1px solid ${colors.accent}40`,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Stat box for hover card
function StatBox({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center p-2 rounded-lg bg-white/5">
      <div className="flex justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <p className="text-xs font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  );
}

// Gem stud decoration
function GemStud({ position, color }: { position: string; color: "ruby" | "sapphire" | "emerald" | "amethyst" }) {
  const positionStyles: Record<string, string> = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  const colorStyles: Record<string, { bg: string; glow: string }> = {
    ruby: { bg: "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)", glow: "rgba(239, 68, 68, 0.5)" },
    sapphire: { bg: "linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)", glow: "rgba(59, 130, 246, 0.5)" },
    emerald: { bg: "linear-gradient(135deg, #22c55e, #16a34a, #15803d)", glow: "rgba(34, 197, 94, 0.5)" },
    amethyst: { bg: "linear-gradient(135deg, #a855f7, #9333ea, #7c3aed)", glow: "rgba(168, 85, 247, 0.5)" },
  };

  const colors = colorStyles[color];

  return (
    <div className={`absolute ${positionStyles[position]} z-10`}>
      <div 
        className="w-4 h-4 rounded-full"
        style={{
          background: colors.bg,
          boxShadow: `0 0 10px ${colors.glow}, inset 0 1px 2px rgba(255,255,255,0.4)`,
        }}
      />
    </div>
  );
}

// Helper function to generate badges based on stats
function getBadges(profile: any): string[] {
  const badges: string[] = [];
  
  if (profile.streak_days >= 30) badges.push("Dedicated");
  if (profile.streak_days >= 7) badges.push("On Fire");
  if (profile.level >= 10) badges.push("Scholar");
  if (profile.level >= 25) badges.push("Master");
  if (profile.total_focus_minutes >= 600) badges.push("Focused");
  if (profile.role === "dev") badges.push("Creator");
  if (profile.role === "beta_tester") badges.push("Pioneer");
  
  return badges.slice(0, 4); // Max 4 badges
}
