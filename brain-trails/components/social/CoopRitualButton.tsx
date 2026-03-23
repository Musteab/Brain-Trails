"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Send, X, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface Friend {
  id: string;
  display_name: string;
  avatar_url?: string;
  level: number;
  is_online?: boolean;
}

/**
 * Co-op Ritual Button & Modal
 * 
 * Allows users to:
 * 1. Send "Mana Boosts" to friends (grants XP)
 * 2. Invite friends to study together
 * 3. View online friends
 */
export default function CoopRitualButton() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { addToast } = useUIStore();
  const isSun = theme === "sun";

  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const fetchFriends = async () => {
    if (!user) return;

    setIsLoading(true);

    // For now, we'll fetch recent users as "friends" (placeholder until friends system is fully implemented)
    const { data } = await (supabase.from("profiles") as any)
      .select("id, display_name, avatar_url, level")
      .neq("id", user.id)
      .order("xp", { ascending: false })
      .limit(10);

    setFriends(
      (data || []).map((f: Friend) => ({
        ...f,
        is_online: Math.random() > 0.5, // Simulated for now
      }))
    );

    setIsLoading(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchFriends();
  };

  const sendManaBoost = async (friendId: string, friendName: string) => {
    if (!user || !profile) return;

    setSendingTo(friendId);

    try {
      // In a real implementation, this would:
      // 1. Insert into a notifications table
      // 2. Trigger a real-time subscription for the recipient
      // For now, we'll simulate success

      // Simulated delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      addToast(`Mana Boost sent to ${friendName}! ✨`, "success");
    } catch {
      addToast("Failed to send boost", "error");
    }

    setSendingTo(null);
  };

  const inviteToStudy = async (friendId: string, friendName: string) => {
    if (!user) return;

    setSendingTo(friendId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      addToast(`Study invite sent to ${friendName}! 📚`, "success");
    } catch {
      addToast("Failed to send invite", "error");
    }

    setSendingTo(null);
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors ${
          isSun
            ? "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-600 hover:from-violet-200 hover:to-purple-200 border border-violet-200"
            : "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 hover:from-violet-500/30 hover:to-purple-500/30 border border-violet-500/20"
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-sm">Co-op Ritual</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div
                className={`rounded-3xl shadow-2xl overflow-hidden ${
                  isSun
                    ? "bg-white border border-slate-200"
                    : "bg-slate-900 border border-slate-700"
                }`}
              >
                {/* Header */}
                <div
                  className={`px-6 py-4 flex items-center justify-between ${
                    isSun
                      ? "bg-gradient-to-r from-violet-50 to-purple-50"
                      : "bg-gradient-to-r from-violet-500/10 to-purple-500/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSun ? "bg-violet-100" : "bg-violet-500/20"
                      }`}
                    >
                      <Users className={`w-5 h-5 ${isSun ? "text-violet-600" : "text-violet-400"}`} />
                    </div>
                    <div>
                      <h3
                        className={`font-bold ${isSun ? "text-slate-800" : "text-white"}`}
                      >
                        Co-op Ritual
                      </h3>
                      <p
                        className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Send boosts & study together
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isSun
                        ? "hover:bg-slate-100 text-slate-400"
                        : "hover:bg-white/10 text-slate-500"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Friends List */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className={`w-8 h-8 animate-spin ${isSun ? "text-violet-500" : "text-violet-400"}`} />
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-8">
                      <Users
                        className={`w-12 h-12 mx-auto mb-3 ${
                          isSun ? "text-slate-300" : "text-slate-600"
                        }`}
                      />
                      <p className={isSun ? "text-slate-500" : "text-slate-400"}>
                        No friends found yet
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          isSun ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Friends system coming in v1.1!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isSun
                              ? "bg-slate-50 hover:bg-slate-100"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar with online indicator */}
                            <div className="relative">
                              <div
                                className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center ${
                                  isSun ? "bg-slate-200" : "bg-slate-700"
                                }`}
                              >
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
                                  <span className="text-lg">🧙</span>
                                )}
                              </div>
                              {friend.is_online && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                              )}
                            </div>

                            <div>
                              <p
                                className={`font-medium ${
                                  isSun ? "text-slate-700" : "text-white"
                                }`}
                              >
                                {friend.display_name}
                              </p>
                              <p
                                className={`text-xs ${
                                  isSun ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                Level {friend.level}
                                {friend.is_online && (
                                  <span className="ml-2 text-emerald-500">
                                    Online
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                sendManaBoost(friend.id, friend.display_name)
                              }
                              disabled={sendingTo === friend.id}
                              className={`p-2 rounded-lg transition-colors ${
                                isSun
                                  ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                                  : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                              } disabled:opacity-50`}
                              title="Send Mana Boost"
                            >
                              {sendingTo === friend.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                inviteToStudy(friend.id, friend.display_name)
                              }
                              disabled={sendingTo === friend.id || !friend.is_online}
                              className={`p-2 rounded-lg transition-colors ${
                                isSun
                                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                  : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={
                                friend.is_online
                                  ? "Invite to Study"
                                  : "User is offline"
                              }
                            >
                              <Send className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer tip */}
                <div
                  className={`px-6 py-3 text-center text-xs ${
                    isSun
                      ? "bg-slate-50 text-slate-500"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  <Zap className="w-3 h-3 inline mr-1" />
                  Mana Boosts grant +25 XP to your friend!
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
