"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Search, Check, X, Zap, Flame, Loader2, UserCheck, Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { useFriends, type UserSearchResult, type Friend } from "@/hooks/useFriends";
import { useOnlineUserIds } from "@/hooks/useOnlineUserIds";
import { supabase } from "@/lib/supabase";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

function frameClass(role?: string | null, avatarFrame?: string | null) {
  if (avatarFrame && avatarFrame !== "default") return avatarFrame;
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  return "";
}

export default function CirclePage() {
  const { user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const addToast = useUIStore((s) => s.addToast);
  const online = useOnlineUserIds();
  const {
    friends, incoming, outgoing, isLoading, searchUsers, sendRequest, acceptRequest, removeFriend,
  } = useFriends();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [boosted, setBoosted] = useState<Set<string>>(new Set());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ink = isSun ? "text-slate-800" : "text-white";
  const card = isSun ? "bg-white border-slate-200" : "bg-slate-900/70 border-white/10";

  // Debounced search
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      setResults(await searchUsers(query));
      setSearching(false);
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, searchUsers]);

  const knownIds = new Set([
    ...friends.map((f) => f.userId),
    ...outgoing.map((f) => f.userId),
    ...incoming.map((f) => f.userId),
  ]);

  const handleAdd = async (id: string, name: string) => {
    const res = await sendRequest(id);
    addToast(res.ok ? `Request sent to ${name}` : res.error || "Could not send request", res.ok ? "success" : "error");
  };

  const boost = useCallback(
    async (f: Friend) => {
      if (!user || boosted.has(f.userId)) return;
      setBoosted((prev) => new Set(prev).add(f.userId));
      const { error } = await (supabase.rpc as any)("send_mana_boost", {
        sender_uuid: user.id,
        recipient_uuid: f.userId,
        boost_xp: 25,
        boost_message: "",
      });
      addToast(error ? "Boost failed" : `Sent ${f.display_name} a mana boost (+25 XP)`, error ? "error" : "success");
    },
    [user, boosted, addToast]
  );

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-28 pt-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSun ? "bg-violet-100 text-violet-600" : "bg-violet-500/20 text-violet-300"}`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${ink}`}>Your Circle</h1>
              <p className={`text-xs ${muted}`}>
                {friends.length} {friends.length === 1 ? "friend" : "friends"}
                {friends.length > 0 && ` · ${friends.filter((f) => online.has(f.userId)).length} online`}
              </p>
            </div>
          </div>

          {/* Add friends */}
          <div className={`rounded-3xl border ${card} p-5`}>
            <h2 className={`flex items-center gap-2 text-sm font-bold mb-3 ${ink}`}>
              <UserPlus className="w-4 h-4" /> Add a friend
            </h2>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
              <Search className={`w-4 h-4 ${muted}`} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username..."
                className={`flex-1 bg-transparent outline-none text-sm ${ink} ${isSun ? "placeholder:text-slate-400" : "placeholder:text-slate-500"}`}
              />
              {searching && <Loader2 className={`w-4 h-4 animate-spin ${muted}`} />}
            </div>

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 space-y-2">
                  {results.map((u) => {
                    const known = knownIds.has(u.id);
                    return (
                      <div key={u.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
                        <Avatar url={u.avatar_url} name={u.display_name} isSun={isSun} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${ink}`}>{u.display_name}</p>
                          <p className={`text-xs ${muted}`}>@{u.username} · Lv.{u.level}</p>
                        </div>
                        <button
                          onClick={() => handleAdd(u.id, u.display_name)}
                          disabled={known}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                            known
                              ? isSun ? "bg-slate-100 text-slate-400" : "bg-white/10 text-slate-500"
                              : "bg-violet-600 text-white hover:bg-violet-700"
                          }`}
                        >
                          {known ? <><Check className="w-3.5 h-3.5" /> Added</> : <><UserPlus className="w-3.5 h-3.5" /> Add</>}
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <p className={`mt-3 text-xs ${muted}`}>No travelers found for &ldquo;{query.trim()}&rdquo;.</p>
            )}
          </div>

          {/* Incoming requests */}
          {incoming.length > 0 && (
            <div className={`rounded-3xl border ${card} p-5`}>
              <h2 className={`flex items-center gap-2 text-sm font-bold mb-3 ${ink}`}>
                <UserCheck className="w-4 h-4" /> Friend requests
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">{incoming.length}</span>
              </h2>
              <div className="space-y-2">
                {incoming.map((f) => (
                  <div key={f.friendshipId} className="flex items-center gap-3">
                    <Avatar url={f.avatar_url} name={f.display_name} isSun={isSun} frame={frameClass(f.role, f.avatar_frame)} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${ink}`}>{f.display_name}</p>
                      <p className={`text-xs ${muted}`}>@{f.username} · Lv.{f.level}</p>
                    </div>
                    <button onClick={() => acceptRequest(f.friendshipId)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button onClick={() => removeFriend(f)} className={`p-2 rounded-lg ${isSun ? "text-slate-400 hover:bg-slate-100" : "text-slate-500 hover:bg-white/10"}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends list */}
          <div className={`rounded-3xl border ${card} p-5`}>
            <h2 className={`flex items-center gap-2 text-sm font-bold mb-3 ${ink}`}>
              <Users className="w-4 h-4" /> Friends
            </h2>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-14 rounded-xl animate-pulse ${isSun ? "bg-slate-100" : "bg-white/5"}`} />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className={`w-10 h-10 mx-auto mb-3 ${muted}`} />
                <p className={`text-sm font-semibold ${ink}`}>No friends yet</p>
                <p className={`text-xs mt-1 ${muted}`}>Search a username above to send your first request.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((f) => {
                  const isOnline = online.has(f.userId);
                  return (
                    <motion.div
                      key={f.friendshipId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isSun ? "bg-slate-50" : "bg-white/5"}`}
                    >
                      <div className="relative">
                        <Avatar url={f.avatar_url} name={f.display_name} isSun={isSun} frame={frameClass(f.role, f.avatar_frame)} />
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${ink}`}>{f.display_name}</p>
                        <p className={`text-xs flex items-center gap-2 ${muted}`}>
                          <span>Lv.{f.level}</span>
                          <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" /> {f.streak_days}</span>
                          <span className={isOnline ? "text-emerald-500 font-medium" : ""}>
                            {isOnline ? "online" : "offline"}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => boost(f)}
                        disabled={boosted.has(f.userId)}
                        title="Send a mana boost (+25 XP)"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                          boosted.has(f.userId)
                            ? isSun ? "bg-slate-100 text-slate-400" : "bg-white/10 text-slate-500"
                            : isSun ? "bg-violet-100 text-violet-600 hover:bg-violet-200" : "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" /> {boosted.has(f.userId) ? "Sent" : "Boost"}
                      </button>
                      <button onClick={() => removeFriend(f)} className={`p-2 rounded-lg ${isSun ? "text-slate-400 hover:bg-slate-100" : "text-slate-500 hover:bg-white/10"}`} title="Remove friend">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Outgoing pending */}
            {outgoing.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${muted}`}>
                  <Clock className="w-3.5 h-3.5" /> Pending ({outgoing.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {outgoing.map((f) => (
                    <span key={f.friendshipId} className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-xs ${isSun ? "bg-slate-100 text-slate-500" : "bg-white/10 text-slate-400"}`}>
                      <Avatar url={f.avatar_url} name={f.display_name} isSun={isSun} small />
                      @{f.username}
                      <button onClick={() => removeFriend(f)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}

function Avatar({
  url, name, isSun, frame = "", small = false,
}: {
  url: string | null; name: string; isSun: boolean; frame?: string; small?: boolean;
}) {
  const size = small ? 20 : 40;
  const cls = small ? "w-5 h-5" : "w-10 h-10";
  return (
    <div className={`${cls} rounded-full overflow-hidden shrink-0 flex items-center justify-center ${frame} ${isSun ? "bg-violet-100 text-violet-500" : "bg-violet-500/20 text-violet-300"}`}>
      {url ? (
        <Image src={url} alt={name} width={size} height={size} unoptimized className="w-full h-full object-cover" />
      ) : (
        <span className={small ? "text-[10px] font-bold" : "text-sm font-bold"}>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
