"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Shield, Swords, UserMinus, ArrowUp, ArrowDown, Users, MoreVertical } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { useCardStyles } from "@/hooks/useCardStyles";

interface Member {
  id: string;
  guild_id: string;
  user_id: string;
  role: "member" | "officer" | "leader";
  weekly_xp: number;
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    level: number;
  };
}

interface MemberListProps {
  guildId: string;
  isLeader: boolean;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: typeof Shield; label: string }> = {
  leader: {
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: Crown,
    label: "Leader",
  },
  officer: {
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
    icon: Swords,
    label: "Officer",
  },
  member: {
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    icon: Shield,
    label: "Member",
  },
};

export default function MemberList({ guildId, isLeader }: MemberListProps) {
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const { card, isSun, title, muted, item: itemStyle } = useCardStyles();

  const [members, setMembers] = useState<Member[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch members
  useEffect(() => {
    if (!guildId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("guild_members")
        .select("*, profiles:user_id ( display_name, avatar_url, level )")
        .eq("guild_id", guildId)
        .order("role", { ascending: true })
        .order("weekly_xp", { ascending: false });

      if (!error && data) {
        // Sort: leader first, then officers, then members
        const roleOrder: Record<string, number> = { leader: 0, officer: 1, member: 2 };
        const sorted = (data as unknown as Member[]).sort(
          (a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
        );
        setMembers(sorted);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [guildId]);

  // Presence tracking for online status
  useEffect(() => {
    if (!guildId || !user) return;

    const channel = supabase.channel(`guild-presence-${guildId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [guildId, user]);

  const handlePromote = async (member: Member) => {
    const newRole = member.role === "member" ? "officer" : "member";
    const { error } = await supabase
      .from("guild_members")
      .update({ role: newRole })
      .eq("id", member.id);

    if (error) {
      addToast("Failed to update role.", "error");
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
      addToast(
        `${member.profiles.display_name || "Member"} ${newRole === "officer" ? "promoted to Officer" : "demoted to Member"}.`,
        "success"
      );
    }
    setMenuOpenFor(null);
  };

  const handleKick = async (member: Member) => {
    if (!confirm(`Remove ${member.profiles.display_name || "this member"} from the guild?`)) return;

    // Remove from guild_members
    const { error: removeError } = await supabase
      .from("guild_members")
      .delete()
      .eq("id", member.id);

    if (removeError) {
      addToast("Failed to remove member.", "error");
      setMenuOpenFor(null);
      return;
    }

    // Clear their profile guild_id
    await supabase
      .from("profiles")
      .update({ guild_id: null })
      .eq("id", member.user_id);

    // Decrement member count
    await supabase
      .from("guilds")
      .update({ member_count: Math.max(0, members.length - 1) })
      .eq("id", guildId);

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    addToast(`${member.profiles.display_name || "Member"} removed from the guild.`, "success");
    setMenuOpenFor(null);
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

  return (
    <div className={`${card} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg ${title}`}>Members</h3>
            <p className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
              {members.length} members · {onlineUsers.size} online
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member, index) => {
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const RoleIcon = roleConfig.icon;
            const isOnline = onlineUsers.has(member.user_id);
            const isSelf = member.user_id === user?.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl ${itemStyle}`}
              >
                {/* Avatar + Online dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSun
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {member.profiles?.avatar_url ? (
                      <Image
                        src={member.profiles.avatar_url}
                        alt={member.profiles.display_name || "User"}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(member.profiles?.display_name)
                    )}
                  </div>
                  {/* Online indicator */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                      isSun ? "border-white" : "border-slate-900"
                    } ${isOnline ? "bg-emerald-400" : isSun ? "bg-slate-300" : "bg-slate-600"}`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-bold truncate font-[family-name:var(--font-nunito)] ${
                        isSun ? "text-slate-800" : "text-white"
                      }`}
                    >
                      {member.profiles?.display_name || "Unknown Traveler"}
                      {isSelf && (
                        <span className={`text-xs ml-1 ${muted}`}>(you)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Role badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.bg} ${roleConfig.color}`}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleConfig.label}
                    </span>
                    <span className={`text-xs ${muted} font-[family-name:var(--font-quicksand)]`}>
                      Lv. {member.profiles?.level || 1}
                    </span>
                    {isOnline && (
                      <span className="text-[10px] text-emerald-500 font-bold">Online</span>
                    )}
                  </div>
                </div>

                {/* Leader actions */}
                {isLeader && !isSelf && member.role !== "leader" && (
                  <div className="relative flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setMenuOpenFor(menuOpenFor === member.id ? null : member.id)
                      }
                      className={`p-2 rounded-xl transition-colors ${
                        isSun ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-slate-500"
                      }`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </motion.button>

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {menuOpenFor === member.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -5 }}
                          className={`absolute right-0 top-full mt-1 z-20 w-44 rounded-xl shadow-xl border-2 overflow-hidden ${
                            isSun
                              ? "bg-white border-slate-200"
                              : "bg-slate-800 border-slate-700"
                          }`}
                        >
                          <button
                            onClick={() => handlePromote(member)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                              isSun
                                ? "hover:bg-slate-50 text-slate-700"
                                : "hover:bg-white/5 text-slate-300"
                            }`}
                          >
                            {member.role === "member" ? (
                              <>
                                <ArrowUp className="w-4 h-4 text-blue-500" />
                                Promote to Officer
                              </>
                            ) : (
                              <>
                                <ArrowDown className="w-4 h-4 text-orange-500" />
                                Demote to Member
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleKick(member)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-red-500 ${
                              isSun ? "hover:bg-red-50" : "hover:bg-red-500/10"
                            }`}
                          >
                            <UserMinus className="w-4 h-4" />
                            Remove from Guild
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
