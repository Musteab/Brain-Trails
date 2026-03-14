"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Star,
  Plus,
  LogIn,
  LogOut,
  MessageCircle,
  Swords,
  LayoutDashboard,
  Trophy,
  Crown,
} from "lucide-react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import GuildCreate from "@/components/guild/GuildCreate";
import GuildChat from "@/components/guild/GuildChat";
import GuildLeaderboard from "@/components/guild/GuildLeaderboard";
import GuildRaid from "@/components/guild/GuildRaid";
import MemberList from "@/components/guild/MemberList";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { useCardStyles } from "@/hooks/useCardStyles";

interface GuildRow {
  id: string;
  name: string;
  description: string;
  emblem: string;
  leader_id: string;
  max_members: number;
  member_count: number;
  weekly_xp: number;
  created_at: string;
  updated_at: string;
}

type TabId = "overview" | "chat" | "raids";

export default function GuildPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useUIStore();
  const { card, isSun, title, muted, item: itemStyle } = useCardStyles();

  const [myGuild, setMyGuild] = useState<GuildRow | null>(null);
  const [myRole, setMyRole] = useState<"member" | "officer" | "leader">("member");
  const [guilds, setGuilds] = useState<GuildRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joiningGuildId, setJoiningGuildId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Check if user is in a guild
    if (profile?.guild_id) {
      // Fetch user's guild
      const { data: guild } = await supabase
        .from("guilds")
        .select("*")
        .eq("id", profile.guild_id)
        .single();

      if (guild) {
        setMyGuild(guild);

        // Get user's role
        const { data: membership } = await supabase
          .from("guild_members")
          .select("role")
          .eq("guild_id", guild.id)
          .eq("user_id", user.id)
          .single();

        if (membership) {
          setMyRole(membership.role);
        }
      }
    } else {
      setMyGuild(null);

      // Fetch available guilds
      const { data: availableGuilds } = await supabase
        .from("guilds")
        .select("*")
        .order("weekly_xp", { ascending: false })
        .limit(50);

      if (availableGuilds) {
        setGuilds(availableGuilds);
      }
    }

    setLoading(false);
  }, [user, profile?.guild_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoinGuild = async (guild: GuildRow) => {
    if (!user || joiningGuildId) return;

    if (guild.member_count >= guild.max_members) {
      addToast("This guild is full.", "error");
      return;
    }

    setJoiningGuildId(guild.id);

    try {
      // Insert into guild_members
      const { error: memberError } = await supabase.from("guild_members").insert({
        guild_id: guild.id,
        user_id: user.id,
        role: "member",
        weekly_xp: 0,
      });

      if (memberError) {
        addToast("Failed to join guild: " + memberError.message, "error");
        setJoiningGuildId(null);
        return;
      }

      // Update profile.guild_id
      await supabase
        .from("profiles")
        .update({ guild_id: guild.id })
        .eq("id", user.id);

      // Increment member count
      await supabase
        .from("guilds")
        .update({ member_count: guild.member_count + 1 })
        .eq("id", guild.id);

      await refreshProfile();
      addToast(`Joined ${guild.name}!`, "success");
      await fetchData();
    } catch {
      addToast("An unexpected error occurred.", "error");
    } finally {
      setJoiningGuildId(null);
    }
  };

  const handleLeaveGuild = async () => {
    if (!user || !myGuild) return;
    if (myRole === "leader") {
      addToast("Leaders must transfer leadership before leaving.", "error");
      return;
    }

    if (!confirm("Are you sure you want to leave this guild?")) return;

    // Remove from guild_members
    await supabase
      .from("guild_members")
      .delete()
      .eq("guild_id", myGuild.id)
      .eq("user_id", user.id);

    // Clear profile guild_id
    await supabase
      .from("profiles")
      .update({ guild_id: null })
      .eq("id", user.id);

    // Decrement member count
    await supabase
      .from("guilds")
      .update({ member_count: Math.max(0, myGuild.member_count - 1) })
      .eq("id", myGuild.id);

    await refreshProfile();
    addToast("You left the guild.", "info");
    setMyGuild(null);
    setActiveTab("overview");
    await fetchData();
  };

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "raids", label: "Raids", icon: Swords },
  ];

  // ===== Loading =====
  if (loading) {
    return (
      <main className="relative min-h-screen">
        <div
          className={`fixed inset-0 ${
            isSun
              ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
              : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
          }`}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <TravelerHotbar />
      </main>
    );
  }

  // ===== GUILD DASHBOARD (User has a guild) =====
  if (myGuild) {
    return (
      <main className="relative min-h-screen">
        <div
          className={`fixed inset-0 ${
            isSun
              ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
              : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
          }`}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 pb-32">
          {/* Guild Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl border-3 shadow-lg ${
                    isSun
                      ? "bg-white/70 border-emerald-500/30 shadow-emerald-200/30"
                      : "bg-white/5 border-emerald-400/30 shadow-emerald-500/10"
                  }`}
                >
                  {myGuild.emblem}
                </div>
                <div>
                  <h1
                    className={`text-3xl font-bold font-[family-name:var(--font-nunito)] ${
                      isSun ? "text-slate-800" : "text-white"
                    }`}
                  >
                    {myGuild.name}
                  </h1>
                  <p className={`mt-1 ${muted} font-[family-name:var(--font-quicksand)]`}>
                    {myGuild.description || "A study guild"}
                  </p>
                  <div className={`flex items-center gap-4 mt-2 text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {myGuild.member_count}/{myGuild.max_members}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {myGuild.weekly_xp.toLocaleString()} weekly XP
                    </span>
                  </div>
                </div>
              </div>

              {myRole !== "leader" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLeaveGuild}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isSun
                      ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Leave
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all font-[family-name:var(--font-nunito)] ${
                    isActive
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                      : isSun
                      ? "bg-white/50 text-slate-600 hover:bg-white/80 border border-slate-200"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Guild Info */}
                  <div className={`${card} p-6`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <h3 className={`text-lg ${title}`}>Guild Info</h3>
                    </div>

                    <div className="space-y-3">
                      <div className={`flex justify-between px-4 py-3 rounded-xl ${itemStyle}`}>
                        <span className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>Emblem</span>
                        <span className="text-2xl">{myGuild.emblem}</span>
                      </div>
                      <div className={`flex justify-between px-4 py-3 rounded-xl ${itemStyle}`}>
                        <span className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>Members</span>
                        <span className={`text-sm font-bold ${isSun ? "text-slate-700" : "text-white"} font-[family-name:var(--font-nunito)]`}>
                          {myGuild.member_count} / {myGuild.max_members}
                        </span>
                      </div>
                      <div className={`flex justify-between px-4 py-3 rounded-xl ${itemStyle}`}>
                        <span className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>Weekly XP</span>
                        <span className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-purple-600" : "text-[#C77DFF]"}`}>
                          {myGuild.weekly_xp.toLocaleString()}
                        </span>
                      </div>
                      <div className={`flex justify-between px-4 py-3 rounded-xl ${itemStyle}`}>
                        <span className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>Your Role</span>
                        <span className={`text-sm font-bold flex items-center gap-1 font-[family-name:var(--font-nunito)] ${
                          myRole === "leader"
                            ? "text-amber-500"
                            : myRole === "officer"
                            ? "text-blue-500"
                            : muted
                        }`}>
                          {myRole === "leader" && <Crown className="w-3.5 h-3.5" />}
                          {myRole === "officer" && <Swords className="w-3.5 h-3.5" />}
                          {myRole === "member" && <Shield className="w-3.5 h-3.5" />}
                          {myRole.charAt(0).toUpperCase() + myRole.slice(1)}
                        </span>
                      </div>
                      <div className={`flex justify-between px-4 py-3 rounded-xl ${itemStyle}`}>
                        <span className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>Founded</span>
                        <span className={`text-sm font-bold ${isSun ? "text-slate-700" : "text-white"} font-[family-name:var(--font-nunito)]`}>
                          {new Date(myGuild.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Member List */}
                  <MemberList guildId={myGuild.id} isLeader={myRole === "leader"} />

                  {/* Weekly Leaderboard - Full width */}
                  <div className="lg:col-span-2">
                    <GuildLeaderboard guildId={myGuild.id} />
                  </div>
                </div>
              )}

              {activeTab === "chat" && (
                <GuildChat guildId={myGuild.id} />
              )}

              {activeTab === "raids" && (
                <GuildRaid guildId={myGuild.id} isLeader={myRole === "leader"} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <TravelerHotbar />
      </main>
    );
  }

  // ===== GUILD HALL (No guild - browse & create) =====
  return (
    <main className="relative min-h-screen">
      <div
        className={`fixed inset-0 ${
          isSun
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        }`}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
        >
          <div>
            <h1
              className={`text-4xl font-bold font-[family-name:var(--font-nunito)] ${
                isSun ? "text-slate-800" : "text-white"
              }`}
            >
              <Shield className="inline w-9 h-9 mr-2 -mt-1" />
              Guild Hall
            </h1>
            <p className={`mt-2 ${muted} font-[family-name:var(--font-quicksand)]`}>
              Join a guild to study together, compete in raids, and climb the leaderboard.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 font-bold font-[family-name:var(--font-nunito)]"
          >
            <Plus className="w-5 h-5" />
            Create Guild
          </motion.button>
        </motion.div>

        {/* Guild List */}
        {guilds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${card} p-12 text-center`}
          >
            <Shield className={`w-16 h-16 mx-auto mb-4 opacity-30 ${muted}`} />
            <h3 className={`text-xl font-bold mb-2 font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-300"}`}>
              No Guilds Yet
            </h3>
            <p className={`${muted} font-[family-name:var(--font-quicksand)]`}>
              Be the first to create a guild!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guilds.map((guild, i) => {
              const isFull = guild.member_count >= guild.max_members;

              return (
                <motion.div
                  key={guild.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`${card} p-6 flex flex-col`}
                >
                  {/* Guild emblem & name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 ${
                        isSun
                          ? "bg-white/50 border-emerald-500/20"
                          : "bg-white/5 border-emerald-400/20"
                      }`}
                    >
                      {guild.emblem}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-bold truncate font-[family-name:var(--font-nunito)] ${
                          isSun ? "text-slate-800" : "text-white"
                        }`}
                      >
                        {guild.name}
                      </h3>
                      <p className={`text-xs truncate ${muted} font-[family-name:var(--font-quicksand)]`}>
                        {guild.description || "A study guild"}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className={`flex items-center gap-4 text-sm ${muted} mb-4 font-[family-name:var(--font-quicksand)]`}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {guild.member_count}/{guild.max_members}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      {guild.weekly_xp.toLocaleString()} XP
                    </span>
                  </div>

                  {/* Join button */}
                  <div className="mt-auto">
                    <motion.button
                      whileHover={{ scale: isFull ? 1 : 1.02 }}
                      whileTap={{ scale: isFull ? 1 : 0.98 }}
                      onClick={() => handleJoinGuild(guild)}
                      disabled={isFull || joiningGuildId === guild.id}
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all font-[family-name:var(--font-nunito)] ${
                        isFull
                          ? isSun
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-white/5 text-slate-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                      }`}
                    >
                      {joiningGuildId === guild.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isFull ? (
                        "Full"
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Join Guild
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Guild Modal */}
      <GuildCreate
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => fetchData()}
      />

      <TravelerHotbar />
    </main>
  );
}
