"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Heart, Flame, Trophy, Plus, Clock, Target, BookOpen, Timer } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { useCardStyles } from "@/hooks/useCardStyles";

interface Raid {
  id: string;
  guild_id: string;
  topic: string;
  boss_hp: number;
  current_hp: number;
  status: "active" | "victory" | "expired";
  week_start: string;
  xp_reward: number;
  created_at: string;
}

interface Contribution {
  id: string;
  raid_id: string;
  user_id: string;
  damage_dealt: number;
  focus_minutes: number;
  cards_reviewed: number;
  contributed_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface GuildRaidProps {
  guildId: string;
  isLeader: boolean;
}

export default function GuildRaid({ guildId, isLeader }: GuildRaidProps) {
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const { card, isSun, title, muted, item: itemStyle } = useCardStyles();

  const [activeRaid, setActiveRaid] = useState<Raid | null>(null);
  const [pastRaids, setPastRaids] = useState<Raid[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [raidTopic, setRaidTopic] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!guildId) return;
    fetchRaids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const fetchRaids = async () => {
    // Fetch active raid
    const { data: active } = await (supabase.from("guild_raids") as any)
      .select("*")
      .eq("guild_id", guildId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (active) {
      setActiveRaid(active);
      // Fetch contributions for active raid
      const { data: contribs } = await (supabase.from("guild_raid_contributions") as any)
        .select("*, profiles:user_id ( display_name, avatar_url )")
        .eq("raid_id", active.id)
        .order("damage_dealt", { ascending: false });

      if (contribs) {
        setContributions(contribs as unknown as Contribution[]);
      }
    } else {
      setActiveRaid(null);
      setContributions([]);
    }

    // Fetch past raids
    const { data: past } = await (supabase.from("guild_raids") as any)
      .select("*")
      .eq("guild_id", guildId)
      .neq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    if (past) {
      setPastRaids(past);
    }

    setLoading(false);
  };

  const handleCreateRaid = async () => {
    if (!user || !raidTopic.trim() || creating) return;

    setCreating(true);

    // Boss HP scales with topic length + base
    const bossHp = 1000 + raidTopic.trim().length * 50;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { error } = await (supabase.from("guild_raids") as any).insert({
      guild_id: guildId,
      topic: raidTopic.trim(),
      boss_hp: bossHp,
      current_hp: bossHp,
      status: "active",
      week_start: weekStart.toISOString(),
      xp_reward: Math.floor(bossHp / 2),
    });

    if (error) {
      addToast("Failed to start raid: " + error.message, "error");
    } else {
      addToast("Raid started! Rally your guild members!", "success");
      setRaidTopic("");
      setShowCreate(false);
      await fetchRaids();
    }

    setCreating(false);
  };

  const hpPercentage = activeRaid
    ? Math.max(0, (activeRaid.current_hp / activeRaid.boss_hp) * 100)
    : 0;

  const getHpColor = (pct: number) => {
    if (pct > 60) return "from-red-500 to-red-600";
    if (pct > 30) return "from-orange-500 to-amber-500";
    return "from-emerald-400 to-green-500";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className={`${card} p-6`}>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Raid */}
      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg ${title}`}>Guild Raid</h3>
              <p className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
                Defeat the boss together
              </p>
            </div>
          </div>

          {isLeader && !activeRaid && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg shadow-red-500/30 text-sm font-bold font-[family-name:var(--font-nunito)]"
            >
              <Plus className="w-4 h-4" />
              Start Raid
            </motion.button>
          )}
        </div>

        {/* Create Raid Form */}
        <AnimatePresence>
          {showCreate && !activeRaid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div
                className={`p-4 rounded-2xl border-2 ${
                  isSun ? "bg-white/50 border-red-200" : "bg-white/5 border-red-400/30"
                }`}
              >
                <label className={`block text-sm font-bold mb-2 ${muted} font-[family-name:var(--font-nunito)]`}>
                  Raid Topic
                </label>
                <p className={`text-xs mb-3 ${muted} font-[family-name:var(--font-quicksand)]`}>
                  Choose a study topic. Boss HP will scale with topic complexity.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={raidTopic}
                    onChange={(e) => setRaidTopic(e.target.value)}
                    placeholder="e.g. Linear Algebra, Organic Chemistry"
                    maxLength={60}
                    className={`flex-1 px-4 py-3 rounded-xl outline-none text-sm font-[family-name:var(--font-quicksand)] ${
                      isSun
                        ? "bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-red-400"
                        : "bg-white/10 border-2 border-white/10 text-white placeholder:text-slate-500 focus:border-red-400/50"
                    } transition-colors`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateRaid}
                    disabled={!raidTopic.trim() || creating}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm disabled:opacity-50 font-[family-name:var(--font-nunito)]"
                  >
                    {creating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Begin!"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Raid Display */}
        {activeRaid ? (
          activeRaid.status === "victory" || activeRaid.current_hp <= 0 ? (
            /* Victory Screen */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>
              <h3 className={`text-2xl font-bold mb-2 font-[family-name:var(--font-nunito)] ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                Victory!
              </h3>
              <p className={`${muted} font-[family-name:var(--font-quicksand)]`}>
                The boss has been defeated! +{activeRaid.xp_reward} XP for all contributors!
              </p>
              <p className={`text-sm mt-2 ${muted} font-[family-name:var(--font-quicksand)]`}>
                Topic: {activeRaid.topic}
              </p>
            </motion.div>
          ) : (
            /* Active Boss */
            <div>
              {/* Boss info */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-5xl mb-2"
                >
                  👹
                </motion.div>
                <h4 className={`text-xl font-bold mb-1 font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                  {activeRaid.topic}
                </h4>
                <p className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
                  Boss Raid · {activeRaid.xp_reward} XP reward
                </p>
              </div>

              {/* HP Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className={`text-sm font-bold ${isSun ? "text-red-600" : "text-red-400"} font-[family-name:var(--font-nunito)]`}>
                      Boss HP
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${muted} font-[family-name:var(--font-nunito)]`}>
                    {activeRaid.current_hp.toLocaleString()} / {activeRaid.boss_hp.toLocaleString()}
                  </span>
                </div>
                <div
                  className={`h-6 rounded-full overflow-hidden ${
                    isSun ? "bg-slate-200" : "bg-white/10"
                  }`}
                >
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: `${hpPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${getHpColor(hpPercentage)} shadow-md relative overflow-hidden`}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
                <p className={`text-xs mt-1.5 text-center ${muted} font-[family-name:var(--font-quicksand)]`}>
                  {(100 - hpPercentage).toFixed(1)}% damage dealt
                </p>
              </div>

              {/* How to contribute */}
              <div
                className={`p-4 rounded-2xl mb-6 border-2 ${
                  isSun ? "bg-amber-50/50 border-amber-200" : "bg-amber-500/5 border-amber-400/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Flame className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
                  <div>
                    <p className={`text-sm font-bold mb-1 font-[family-name:var(--font-nunito)] ${isSun ? "text-amber-800" : "text-amber-300"}`}>
                      How to Deal Damage
                    </p>
                    <p className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
                      Deal damage by completing focus sessions and flashcard reviews on{" "}
                      <span className="font-bold">&quot;{activeRaid.topic}&quot;</span>. Every minute of focus = 2 DMG,
                      every card reviewed = 5 DMG.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contribution Leaderboard */}
              {contributions.length > 0 && (
                <div>
                  <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${title}`}>
                    <Target className="w-4 h-4" />
                    Top Contributors
                  </h4>
                  <div className="space-y-2">
                    {contributions.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${itemStyle}`}
                      >
                        <span className={`text-xs font-bold w-6 text-center ${muted}`}>
                          #{i + 1}
                        </span>
                        <div
                          className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            isSun
                              ? "bg-red-100 text-red-700"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {c.profiles?.avatar_url ? (
                            <Image
                              src={c.profiles.avatar_url}
                              alt=""
                              width={28}
                              height={28}
                              unoptimized
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(c.profiles?.display_name ?? null)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                            {c.profiles?.display_name || "Unknown"}
                          </p>
                          <div className={`flex items-center gap-2 text-[10px] ${muted}`}>
                            <span className="flex items-center gap-0.5">
                              <Timer className="w-3 h-3" />
                              {c.focus_minutes}m
                            </span>
                            <span className="flex items-center gap-0.5">
                              <BookOpen className="w-3 h-3" />
                              {c.cards_reviewed} cards
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Swords className="w-3.5 h-3.5 text-red-500" />
                          <span className={`text-sm font-bold ${isSun ? "text-red-600" : "text-red-400"} font-[family-name:var(--font-nunito)]`}>
                            {c.damage_dealt.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* No active raid */
          <div className={`text-center py-8 ${muted} font-[family-name:var(--font-quicksand)]`}>
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-bold font-[family-name:var(--font-nunito)] mb-1">No Active Raid</p>
            <p className="text-sm">
              {isLeader
                ? 'Click "Start Raid" to begin a boss battle for your guild!'
                : "Waiting for the guild leader to start a raid."}
            </p>
          </div>
        )}
      </div>

      {/* Past Raids */}
      {pastRaids.length > 0 && (
        <div className={`${card} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className={`w-4 h-4 ${muted}`} />
            <h4 className={`text-sm font-bold ${title}`}>Past Raids</h4>
          </div>
          <div className="space-y-2">
            {pastRaids.map((raid) => (
              <div
                key={raid.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${itemStyle}`}
              >
                <span className="text-lg">
                  {raid.status === "victory" ? "🏆" : "💀"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                    {raid.topic}
                  </p>
                  <p className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
                    {raid.status === "victory" ? "Victory" : "Expired"} · {new Date(raid.created_at).toLocaleDateString()}
                  </p>
                </div>
                {raid.status === "victory" && (
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span className={`text-xs font-bold ${isSun ? "text-amber-600" : "text-amber-400"} font-[family-name:var(--font-nunito)]`}>
                      +{raid.xp_reward} XP
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
