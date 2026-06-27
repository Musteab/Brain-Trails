"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// One side of a friendship, resolved to the *other* person's profile.
export interface Friend {
  friendshipId: string;
  userId: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  streak_days: number;
  role: string | null;
  title: string | null;
  avatar_frame: string | null;
  iAmRequester: boolean; // true when I'm friendships.user_id (so I can hard-delete)
}

export interface UserSearchResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
}

interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
}

const PROFILE_COLS = "id, display_name, username, avatar_url, level, xp, streak_days, role, title, avatar_frame";

export function useFriends() {
  const { user } = useAuth();
  const me = user?.id;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<Friend[]>([]);
  const [outgoing, setOutgoing] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!me) return;

    // RLS already scopes friendships to rows I'm part of.
    const { data: rows } = await (supabase.from("friendships") as any)
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${me},friend_id.eq.${me}`);

    const list = (rows ?? []) as FriendshipRow[];
    const otherId = (r: FriendshipRow) => (r.user_id === me ? r.friend_id : r.user_id);
    const ids = [...new Set(list.map(otherId))];

    let pmap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await (supabase.from("profiles") as any)
        .select(PROFILE_COLS)
        .in("id", ids);
      pmap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }

    const toFriend = (r: FriendshipRow): Friend => {
      const oid = otherId(r);
      const p = pmap[oid] ?? {};
      return {
        friendshipId: r.id,
        userId: oid,
        display_name: p.display_name ?? "Traveler",
        username: p.username ?? "unknown",
        avatar_url: p.avatar_url ?? null,
        level: p.level ?? 1,
        xp: p.xp ?? 0,
        streak_days: p.streak_days ?? 0,
        role: p.role ?? null,
        title: p.title ?? null,
        avatar_frame: p.avatar_frame ?? null,
        iAmRequester: r.user_id === me,
      };
    };

    setFriends(list.filter((r) => r.status === "accepted").map(toFriend));
    setIncoming(list.filter((r) => r.status === "pending" && r.friend_id === me).map(toFriend));
    setOutgoing(list.filter((r) => r.status === "pending" && r.user_id === me).map(toFriend));
    setIsLoading(false);
  }, [me]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh when either side of a friendship row changes.
  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel(`friendships:${me}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, load]);

  const searchUsers = useCallback(
    async (q: string): Promise<UserSearchResult[]> => {
      const term = q.trim();
      if (!me || term.length < 2) return [];
      const { data } = await (supabase.from("profiles") as any)
        .select("id, display_name, username, avatar_url, level")
        .ilike("username", `%${term}%`)
        .neq("id", me)
        .limit(8);
      return (data ?? []) as UserSearchResult[];
    },
    [me]
  );

  const sendRequest = useCallback(
    async (friendId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!me || friendId === me) return { ok: false, error: "That's you!" };

      // If they already sent me a pending request, accept it instead of duplicating.
      const existing = incoming.find((f) => f.userId === friendId);
      if (existing) {
        await (supabase.from("friendships") as any)
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", existing.friendshipId);
        await load();
        return { ok: true };
      }
      if (friends.some((f) => f.userId === friendId) || outgoing.some((f) => f.userId === friendId)) {
        return { ok: false, error: "Already connected or requested." };
      }

      const { error } = await (supabase.from("friendships") as any)
        .insert({ user_id: me, friend_id: friendId, status: "pending" });
      if (error) return { ok: false, error: error.code === "23505" ? "Already requested." : error.message };
      await load();
      return { ok: true };
    },
    [me, incoming, outgoing, friends, load]
  );

  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      await (supabase.from("friendships") as any)
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", friendshipId);
      await load();
    },
    [load]
  );

  // Decline a request or remove a friend. The requester can hard-delete; the
  // addressee can't (RLS), so they soft-remove by blocking - either way it
  // disappears from both sides' lists.
  const removeFriend = useCallback(
    async (f: Friend) => {
      if (f.iAmRequester) {
        await (supabase.from("friendships") as any).delete().eq("id", f.friendshipId);
      } else {
        await (supabase.from("friendships") as any).update({ status: "blocked" }).eq("id", f.friendshipId);
      }
      await load();
    },
    [load]
  );

  return {
    friends,
    incoming,
    outgoing,
    isLoading,
    refresh: load,
    searchUsers,
    sendRequest,
    acceptRequest,
    removeFriend,
  };
}
