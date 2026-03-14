"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/**
 * usePresence — tracks how many users are currently online
 * using Supabase Realtime Presence on a shared channel.
 *
 * Returns the count of unique online users (including self).
 */
export function usePresence(): number {
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(1);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("online-travelers", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const uniqueUsers = Object.keys(state).length;
        setOnlineCount(Math.max(uniqueUsers, 1));
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
  }, [user]);

  return onlineCount;
}
