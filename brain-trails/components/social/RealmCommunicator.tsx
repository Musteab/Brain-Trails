"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Users, MessageCircle, Zap, Send, X, Sparkles, 
  Circle, Clock, Book, Trophy
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Friend {
  id: string;
  display_name: string;
  avatar_url?: string;
  level: number;
  is_online: boolean;
  current_activity?: string;
  streak_days?: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  timestamp: Date;
  type: "message" | "boost" | "invite";
}

/**
 * Realm Communicator - Magical Mirror Social Panel
 * 
 * A mystical mirror device for social interactions:
 * - Friend avatars with online status
 * - Chat bubbles
 * - Co-op study requests
 * - Mana boost sending
 */
export default function RealmCommunicator() {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMirrorGlow, setShowMirrorGlow] = useState(false);

  // Fetch friends (simulated for now)
  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      setIsLoading(true);
      
      // Get recent users as "friends" placeholder
      const { data } = await (supabase.from("profiles") as any)
        .select("id, display_name, avatar_url, level, streak_days")
        .neq("id", user.id)
        .order("xp", { ascending: false })
        .limit(8);

      if (data) {
        setFriends(
          data.map((f: any) => ({
            ...f,
            is_online: Math.random() > 0.4,
            current_activity: Math.random() > 0.5 
              ? ["Studying Calculus", "Reading Notes", "Flashcard Practice", "Focus Session"][Math.floor(Math.random() * 4)]
              : undefined,
          }))
        );
      }
      setIsLoading(false);
    };

    fetchFriends();
  }, [user]);

  // Mirror glow effect on activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (friends.some(f => f.is_online)) {
        setShowMirrorGlow(true);
        setTimeout(() => setShowMirrorGlow(false), 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [friends]);

  const sendManaBoost = async (friend: Friend) => {
    // Simulate sending boost
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: user?.id || "",
      sender_name: profile?.display_name || "You",
      sender_avatar: profile?.avatar_url,
      message: `sent a Mana Boost! ⚡`,
      timestamp: new Date(),
      type: "boost",
    };
    setMessages([...messages, newMsg]);
  };

  const sendCoopInvite = async (friend: Friend) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: user?.id || "",
      sender_name: profile?.display_name || "You",
      sender_avatar: profile?.avatar_url,
      message: `invited ${friend.display_name} to study together! 📚`,
      timestamp: new Date(),
      type: "invite",
    };
    setMessages([...messages, newMsg]);
  };

  const onlineCount = friends.filter(f => f.is_online).length;

  return (
    <div className="relative">
      {/* Mirror Frame */}
      <div 
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3d2817 0%, #2a1a10 50%, #1a100a 100%)",
          boxShadow: `
            inset 0 2px 4px rgba(255, 200, 150, 0.15),
            0 8px 32px rgba(0, 0, 0, 0.5),
            ${showMirrorGlow ? "0 0 40px rgba(139, 92, 246, 0.4)" : "none"}
          `,
          border: "4px solid #5c3d1e",
        }}
      >
        {/* Decorative frame corners */}
        <FrameCorner position="top-left" />
        <FrameCorner position="top-right" />
        <FrameCorner position="bottom-left" />
        <FrameCorner position="bottom-right" />

        {/* Mirror surface */}
        <div 
          className="relative m-3 rounded-2xl overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              linear-gradient(180deg, #0a0a15 0%, #1a1a2e 50%, #0d0d1a 100%)
            `,
            boxShadow: "inset 0 0 40px rgba(139, 92, 246, 0.1)",
          }}
        >
          {/* Glass reflection */}
          <div 
            className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)",
            }}
          />

          {/* Header */}
          <div className="p-4 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)",
                  }}
                >
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white font-[family-name:var(--font-cinzel)]">
                    Realm Communicator
                  </h3>
                  <p className="text-xs text-purple-300/60">
                    {onlineCount} scholar{onlineCount !== 1 ? "s" : ""} online
                  </p>
                </div>
              </div>
              
              {/* Status indicator */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-green-400"
                style={{ boxShadow: "0 0 10px rgba(74, 222, 128, 0.6)" }}
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-purple-500/20 rounded" />
                    <div className="h-3 w-16 bg-purple-500/10 rounded mt-1" />
                  </div>
                </div>
              ))
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-purple-500/30 mb-3" />
                <p className="text-purple-300/60 text-sm">No connections yet</p>
                <p className="text-purple-400/40 text-xs mt-1">
                  Guild system coming soon!
                </p>
              </div>
            ) : (
              friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                    selectedFriend?.id === friend.id
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setSelectedFriend(friend)}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-900/50">
                      {friend.avatar_url ? (
                        <Image
                          src={friend.avatar_url}
                          alt={friend.display_name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          🧙
                        </div>
                      )}
                    </div>
                    {friend.is_online && (
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d1a]"
                        style={{
                          background: "#4ade80",
                          boxShadow: "0 0 8px rgba(74, 222, 128, 0.6)",
                        }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm truncate">
                        {friend.display_name}
                      </span>
                      <span className="text-[10px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                        Lv.{friend.level}
                      </span>
                    </div>
                    {friend.current_activity ? (
                      <p className="text-xs text-purple-300/60 truncate flex items-center gap-1">
                        <Book className="w-3 h-3" />
                        {friend.current_activity}
                      </p>
                    ) : friend.is_online ? (
                      <p className="text-xs text-green-400/60">Online</p>
                    ) : (
                      <p className="text-xs text-purple-400/40">Offline</p>
                    )}
                  </div>

                  {/* Quick actions */}
                  {friend.is_online && (
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          sendManaBoost(friend);
                        }}
                        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        title="Send Mana Boost"
                      >
                        <Zap className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          sendCoopInvite(friend);
                        }}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        title="Invite to Study"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Activity Feed */}
          {messages.length > 0 && (
            <div className="p-4 border-t border-purple-500/20">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                Recent Activity
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {messages.slice(-3).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs p-2 rounded-lg ${
                      msg.type === "boost"
                        ? "bg-purple-500/20 text-purple-300"
                        : msg.type === "invite"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-white/10 text-white/80"
                    }`}
                  >
                    <span className="font-medium">{msg.sender_name}</span> {msg.message}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Mystical particles */}
          <MirrorParticles />
        </div>

        {/* Frame ornament */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-1 w-2 h-20 rounded-full"
          style={{
            background: "linear-gradient(180deg, #c9a86c 0%, #8b6914 50%, #5c4a1f 100%)",
          }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 right-1 w-2 h-20 rounded-full"
          style={{
            background: "linear-gradient(180deg, #c9a86c 0%, #8b6914 50%, #5c4a1f 100%)",
          }}
        />
      </div>

      {/* Selected Friend Detail Panel */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="absolute top-0 left-full ml-4 w-64 rounded-2xl overflow-hidden z-50"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedFriend(null)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-white/60"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Avatar header */}
            <div className="p-6 text-center border-b border-purple-500/20">
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-purple-900/50 mb-3">
                {selectedFriend.avatar_url ? (
                  <Image
                    src={selectedFriend.avatar_url}
                    alt={selectedFriend.display_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🧙
                  </div>
                )}
              </div>
              <h3 className="font-bold text-white">{selectedFriend.display_name}</h3>
              <p className="text-sm text-purple-400">Level {selectedFriend.level}</p>
              {selectedFriend.is_online && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-400">
                  <Circle className="w-2 h-2 fill-current" />
                  Online
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <p className="text-xs text-purple-300/60">Streak</p>
                <p className="font-bold text-white">{selectedFriend.streak_days || 0}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <Clock className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                <p className="text-xs text-purple-300/60">Activity</p>
                <p className="text-xs font-medium text-white truncate">
                  {selectedFriend.current_activity || "Idle"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 space-y-2">
              <button
                onClick={() => sendManaBoost(selectedFriend)}
                disabled={!selectedFriend.is_online}
                className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  selectedFriend.is_online
                    ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <Zap className="w-4 h-4" />
                Send Mana Boost
              </button>
              <button
                onClick={() => sendCoopInvite(selectedFriend)}
                disabled={!selectedFriend.is_online}
                className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  selectedFriend.is_online
                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                Invite to Co-op
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Decorative frame corner
function FrameCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const positionStyles: Record<string, string> = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0 rotate-90",
    "bottom-left": "bottom-0 left-0 -rotate-90",
    "bottom-right": "bottom-0 right-0 rotate-180",
  };

  return (
    <div className={`absolute ${positionStyles[position]} w-8 h-8 pointer-events-none z-10`}>
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <path
          d="M 0 0 L 16 0 C 12 4, 8 8, 4 12 L 0 16 Z"
          fill="url(#goldFrame)"
        />
        <defs>
          <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#b8860b" />
            <stop offset="100%" stopColor="#daa520" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Floating mystical particles
function MirrorParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? "#a855f7" : "#3b82f6",
            boxShadow: `0 0 6px ${i % 2 === 0 ? "#a855f7" : "#3b82f6"}`,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}
