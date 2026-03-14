"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import type { KnowledgePath } from "@/lib/database.types";

interface PathCreatorProps {
  existing: KnowledgePath | null;
  onClose: () => void;
  onSaved: () => void;
}

const COLOR_PRESETS = [
  "#9333ea", // purple
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
];

export default function PathCreator({ existing, onClose, onSaved }: PathCreatorProps) {
  const { user } = useAuth();
  const { isSun } = useCardStyles();
  const { addToast } = useUIStore();

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "📚");
  const [color, setColor] = useState(existing?.color ?? COLOR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!existing;

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setIsSaving(true);

    if (isEditing) {
      const { error } = await supabase
        .from("knowledge_paths")
        .update({
          name: name.trim(),
          description: description.trim(),
          emoji,
          color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        addToast("Failed to update path", "error");
      } else {
        addToast("Path updated!", "success");
        onSaved();
      }
    } else {
      // Create path
      const { data: pathData, error: pathError } = await supabase
        .from("knowledge_paths")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim(),
          emoji,
          color,
        })
        .select()
        .single();

      if (pathError || !pathData) {
        addToast("Failed to create path", "error");
      } else {
        // Auto-create a root node
        const { error: nodeError } = await supabase
          .from("knowledge_nodes")
          .insert({
            path_id: pathData.id,
            name: name.trim(),
            description: "Root topic for this knowledge path",
            node_type: "topic",
            parent_node_id: null,
            is_unlocked: true,
            sort_order: 0,
            position_x: 0,
            position_y: 0,
          });

        if (nodeError) {
          console.error("Failed to create root node:", nodeError);
        }

        addToast("Knowledge path created!", "success");
        onSaved();
      }
    }

    setIsSaving(false);
  };

  const inputClass = isSun
    ? "bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400"
    : "bg-white/10 border border-white/10 text-white placeholder:text-slate-500";

  const labelClass = `text-sm font-bold font-[family-name:var(--font-nunito)] mb-1 block ${
    isSun ? "text-slate-700" : "text-slate-200"
  }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl border-[3px] ${
          isSun
            ? "bg-white/95 backdrop-blur-xl border-emerald-600/40"
            : "bg-slate-900/95 backdrop-blur-xl border-emerald-400/30"
        }`}
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

        <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] mb-6 ${
          isSun ? "text-slate-800" : "text-white"
        }`}>
          {isEditing ? "Edit Knowledge Path" : "Create Knowledge Path"}
        </h2>

        <div className="space-y-5">
          {/* Emoji */}
          <div>
            <label className={labelClass}>Path Icon</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className={`w-20 text-center text-2xl px-3 py-2 rounded-xl outline-none ${inputClass}`}
              placeholder="📚"
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Path Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
              placeholder="e.g. Machine Learning Fundamentals"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl outline-none resize-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
              placeholder="What will you learn on this path?"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className={labelClass}>Path Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-purple-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${
            isSun ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
          }`}>
            <span className="text-3xl">{emoji}</span>
            <div>
              <p className={`font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                {name || "Untitled Path"}
              </p>
              <p className={`text-xs font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                {description || "No description"}
              </p>
            </div>
            <div
              className="w-6 h-6 rounded-full ml-auto"
              style={{ backgroundColor: color }}
            />
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold font-[family-name:var(--font-nunito)] shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : isEditing ? "Update Path" : "Create Path"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
