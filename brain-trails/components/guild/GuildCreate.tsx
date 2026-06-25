"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Sparkles, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { useCardStyles } from "@/hooks/useCardStyles";
import Image from "next/image";

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
  const [emblemUrl, setEmblemUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded emblem options
  const emblemOptions = [
    "🛡️", "⚔️", "🏰", "👑", "🔱", "⚡", "🔥", "❄️",
    "🌟", "✨", "💎", "🏆", "📚", "🎯", "🦅", "🦁",
    "🐉", "🦉", "🐺", "🦊", "🌙", "☀️", "🌊", "🌲",
    "🗡️", "🏹", "🪓", "🔨", "🧙", "🧝", "🧛", "🧚"
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast("Please upload an image file", "error");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast("Image must be less than 2MB", "error");
      return;
    }

    setUploading(true);

    try {
      // Upload to supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `guild-emblem-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `guild-emblems/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist or upload fails, convert to base64 as fallback
        console.warn("Storage upload failed, using base64 fallback:", uploadError.message);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          setEmblemUrl(base64String);
          setEmblem(""); // Clear emoji when using image
          addToast("Emblem uploaded! ✨", "success");
          setUploading(false);
        };
        reader.onerror = () => {
          addToast("Failed to process image", "error");
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setEmblemUrl(data.publicUrl);
      setEmblem(""); // Clear emoji when using image
      addToast("Emblem uploaded successfully!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      addToast("Failed to upload emblem. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

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
          emblem: emblemUrl || emblem.trim() || "🛡️",
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
      setEmblemUrl(null);
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
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {/* Emblem Preview */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 cursor-pointer transition-all overflow-hidden ${
                        isSun ? "bg-white/50 border-emerald-500/20 hover:border-emerald-500/40" : "bg-white/5 border-emerald-400/20 hover:border-emerald-400/40"
                      }`}
                      onClick={() => setShowEmblemPicker(!showEmblemPicker)}
                    >
                      {emblemUrl ? (
                        <Image 
                          src={emblemUrl} 
                          alt="Guild emblem" 
                          width={64} 
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        emblem || "🛡️"
                      )}
                    </div>
                    
                    {/* Input and Upload */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={emblem}
                        onChange={(e) => {
                          setEmblem(e.target.value);
                          setEmblemUrl(null); // Clear image when typing
                        }}
                        placeholder="Enter an emoji or upload an image"
                        maxLength={4}
                        disabled={!!emblemUrl}
                        className={`w-full px-4 py-3 rounded-xl outline-none text-lg font-[family-name:var(--font-quicksand)] ${
                          isSun
                            ? "bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-purple-400 disabled:opacity-50"
                            : "bg-white/10 border-2 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-400/50 disabled:opacity-50"
                        } transition-colors`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowEmblemPicker(!showEmblemPicker)}
                          className={`text-xs font-medium ${isSun ? "text-purple-600 hover:text-purple-700" : "text-purple-400 hover:text-purple-300"} transition-colors`}
                        >
                          {showEmblemPicker ? "Hide Picker" : "Pick Emoji"}
                        </button>
                        <span className={`text-xs ${muted}`}>•</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className={`text-xs font-medium flex items-center gap-1 ${isSun ? "text-emerald-600 hover:text-emerald-700" : "text-emerald-400 hover:text-emerald-300"} transition-colors disabled:opacity-50`}
                        >
                          {uploading ? (
                            <>
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              Upload Image
                            </>
                          )}
                        </button>
                        {emblemUrl && (
                          <>
                            <span className={`text-xs ${muted}`}>•</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEmblemUrl(null);
                                setEmblem("🛡️");
                              }}
                              className={`text-xs font-medium ${isSun ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300"} transition-colors`}
                            >
                              Clear Image
                            </button>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {/* Emblem Picker Grid */}
                  <AnimatePresence>
                    {showEmblemPicker && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`grid grid-cols-8 gap-2 p-4 rounded-xl ${
                          isSun ? "bg-slate-50" : "bg-white/5"
                        }`}>
                          {emblemOptions.map((emoji) => (
                            <motion.button
                              key={emoji}
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setEmblem(emoji);
                                setEmblemUrl(null);
                                setShowEmblemPicker(false);
                              }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                                emblem === emoji && !emblemUrl
                                  ? isSun 
                                    ? "bg-purple-200 ring-2 ring-purple-400"
                                    : "bg-purple-500/30 ring-2 ring-purple-400"
                                  : isSun
                                  ? "bg-white hover:bg-purple-50"
                                  : "bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
