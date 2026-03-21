"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { useCardStyles } from "@/hooks/useCardStyles";

interface GuildCreateProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function GuildCreate({ open, onClose, onCreated }: GuildCreateProps) {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useUIStore();
  const { card, isSun, title, muted } = useCardStyles();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emblem, setEmblem] = useState("🛡️");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || submitting) return;

    setSubmitting(true);

    try {
      // 1. Insert guild
      const { data: guild, error: guildError } = await (supabase.from("guilds") as any)
        .insert({
          name: name.trim(),
          description: description.trim(),
          emblem: emblem.trim() || "🛡️",
          leader_id: user.id,
          max_members: 30,
          member_count: 1,
          weekly_xp: 0,
        })
        .select()
        .single();

      if (guildError) {
        if (guildError.code === "23505") {
          addToast("A guild with that name already exists.", "error");
        } else {
          addToast("Failed to create guild: " + guildError.message, "error");
        }
        setSubmitting(false);
        return;
      }

      // 2. Insert creator as leader in guild_members
      const { error: memberError } = await (supabase.from("guild_members") as any)
        .insert({
          guild_id: guild.id,
          user_id: user.id,
          role: "leader",
          weekly_xp: 0,
        });

      if (memberError) {
        addToast("Guild created but failed to add you as member.", "error");
        setSubmitting(false);
        return;
      }

      // 3. Update profile.guild_id
      await (supabase.from("profiles") as any)
        .update({ guild_id: guild.id })
        .eq("id", user.id);

      await refreshProfile();
      addToast("Guild created successfully!", "success");
      setName("");
      setDescription("");
      setEmblem("🛡️");
      onCreated();
      onClose();
    } catch {
      addToast("An unexpected error occurred.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={`relative w-full max-w-lg p-8 ${card}`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                isSun ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-slate-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl ${title}`}>Create Guild</h2>
                <p className={`text-sm ${muted} font-[family-name:var(--font-quicksand)]`}>
                  Found a new study guild
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Emblem */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${muted} font-[family-name:var(--font-nunito)]`}>
                  Guild Emblem
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 ${
                      isSun ? "bg-white/50 border-emerald-500/20" : "bg-white/5 border-emerald-400/20"
                    }`}
                  >
                    {emblem || "🛡️"}
                  </div>
                  <input
                    type="text"
                    value={emblem}
                    onChange={(e) => setEmblem(e.target.value)}
                    placeholder="Enter an emoji"
                    maxLength={4}
                    className={`flex-1 px-4 py-3 rounded-xl outline-none text-lg font-[family-name:var(--font-quicksand)] ${
                      isSun
                        ? "bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-purple-400"
                        : "bg-white/10 border-2 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400/50"
                    } transition-colors`}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${muted} font-[family-name:var(--font-nunito)]`}>
                  Guild Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Study Knights"
                  maxLength={40}
                  required
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${
                    isSun
                      ? "bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-purple-400"
                      : "bg-white/10 border-2 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400/50"
                  } transition-colors`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${muted} font-[family-name:var(--font-nunito)]`}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's your guild about?"
                  maxLength={200}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl outline-none resize-none font-[family-name:var(--font-quicksand)] ${
                    isSun
                      ? "bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-purple-400"
                      : "bg-white/10 border-2 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400/50"
                  } transition-colors`}
                />
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!name.trim() || submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-[family-name:var(--font-nunito)]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Found Guild
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
