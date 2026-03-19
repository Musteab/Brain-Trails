"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Users, MessageCircle } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";

interface ChatMessage {
  id: string;
  guild_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface GuildChatProps {
  guildId: string;
}

export default function GuildChat({ guildId }: GuildChatProps) {
  const { user } = useAuth();
  const { card, isSun, title, muted } = useCardStyles();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Fetch initial messages
  useEffect(() => {
    if (!guildId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("guild_messages")
        .select("*, profiles:user_id ( display_name, avatar_url )")
        .eq("guild_id", guildId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as unknown as ChatMessage[]);
      }
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();
  }, [guildId, scrollToBottom]);

  // Subscribe to realtime messages + presence
  useEffect(() => {
    if (!guildId || !user) return;

    const channel = supabase.channel(`guild-chat-${guildId}`, {
      config: { presence: { key: user.id } },
    });

    // Listen for new messages
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guild_messages",
          filter: `guild_id=eq.${guildId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch the profile for the sender
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", newMsg.user_id)
            .single();

          const enrichedMsg: ChatMessage = {
            ...newMsg,
            profiles: profile || { display_name: "Unknown", avatar_url: null },
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === enrichedMsg.id)) return prev;
            return [...prev, enrichedMsg];
          });
          setTimeout(scrollToBottom, 50);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Math.max(Object.keys(state).length, 1));
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
  }, [guildId, user, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("guild_messages").insert({
      guild_id: guildId,
      user_id: user.id,
      content,
    });

    if (error) {
      setNewMessage(content); // Restore on failure
    }

    setSending(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    <div className={`${card} p-0 overflow-hidden flex flex-col h-[500px]`}>
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between border-b-2 ${
          isSun ? "border-emerald-500/20" : "border-emerald-400/20"
        }`}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className={`w-5 h-5 ${isSun ? "text-purple-600" : "text-[#C77DFF]"}`} />
          <h3 className={`text-lg ${title}`}>Guild Chat <span className="ml-2 align-middle text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-amber-500/30">Beta</span></h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>
            <Users className="w-3.5 h-3.5 inline mr-1" />
            {onlineCount} online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin"
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-12 ${muted} font-[family-name:var(--font-quicksand)]`}>
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            const senderName = msg.profiles?.display_name || "Unknown";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isOwn
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                      : isSun
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {msg.profiles?.avatar_url ? (
                    <Image
                      src={msg.profiles.avatar_url}
                      alt={senderName}
                      width={32}
                      height={32}
                      unoptimized
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(senderName)
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                  <p
                    className={`text-xs font-bold mb-1 ${
                      isOwn
                        ? isSun
                          ? "text-purple-600"
                          : "text-[#C77DFF]"
                        : isSun
                        ? "text-slate-600"
                        : "text-slate-300"
                    } font-[family-name:var(--font-nunito)]`}
                  >
                    {isOwn ? "You" : senderName}
                  </p>
                  <div
                    className={`inline-block px-4 py-2.5 rounded-2xl text-sm font-[family-name:var(--font-quicksand)] ${
                      isOwn
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-tr-md"
                        : isSun
                        ? "bg-white/70 text-slate-800 border border-slate-200 rounded-tl-md"
                        : "bg-white/10 text-slate-200 border border-white/10 rounded-tl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`text-[10px] mt-1 ${muted}`}>{formatTime(msg.created_at)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`px-4 py-3 border-t-2 flex gap-2 ${
          isSun ? "border-emerald-500/20" : "border-emerald-400/20"
        }`}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className={`flex-1 px-4 py-2.5 rounded-xl outline-none text-sm font-[family-name:var(--font-quicksand)] ${
            isSun
              ? "bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-purple-400"
              : "bg-white/10 border-2 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400/50"
          } transition-colors`}
        />
        <motion.button
          type="submit"
          disabled={!newMessage.trim() || sending}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
}
