"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import type { KnowledgeNode, Database } from "@/lib/database.types";

type NodeInsert = Database["public"]["Tables"]["knowledge_nodes"]["Insert"];
type NodeUpdate = Database["public"]["Tables"]["knowledge_nodes"]["Update"];

interface NodeEditorProps {
  pathId: string;
  existing: KnowledgeNode | null;
  parentNodeId: string | null;
  allNodes: KnowledgeNode[];
  onClose: () => void;
  onSaved: () => void;
}

interface DeckOption {
  id: string;
  name: string;
  emoji: string;
}

export default function NodeEditor({
  pathId,
  existing,
  parentNodeId,
  allNodes,
  onClose,
  onSaved,
}: NodeEditorProps) {
  const { isSun } = useCardStyles();
  const { addToast } = useUIStore();

  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [nodeType, setNodeType] = useState<"topic" | "boss" | "checkpoint">(
    existing?.node_type ?? "topic"
  );
  const [parentId, setParentId] = useState<string | null>(
    existing?.parent_node_id ?? parentNodeId
  );
  const [requiredFocusMinutes, setRequiredFocusMinutes] = useState(
    existing?.required_focus_minutes ?? 30
  );
  const [requiredCardReviews, setRequiredCardReviews] = useState(
    existing?.required_card_reviews ?? 20
  );
  const [requiredMasteryPct, setRequiredMasteryPct] = useState(
    existing?.required_mastery_pct ?? 80
  );
  const [bossDeckId, setBossDeckId] = useState<string | null>(
    existing?.boss_deck_id ?? null
  );
  const [bossHp, setBossHp] = useState(existing?.boss_hp ?? 100);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user decks for boss node linking
  const [decks, setDecks] = useState<DeckOption[]>([]);
  useEffect(() => {
    if (nodeType !== "boss") return;
    const fetchDecks = async () => {
      const { data } = await (supabase.from("decks") as any)
        .select("id, name, emoji")
        .order("name");
      if (data) setDecks(data);
    };
    fetchDecks();
  }, [nodeType]);

  // Possible parents: all nodes in this path except self (and descendants if editing)
  const possibleParents = allNodes.filter((n) => {
    if (isEditing && n.id === existing.id) return false;
    return true;
  });

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    if (isEditing) {
      const updateData: NodeUpdate = {
        name: name.trim(),
        description: description.trim(),
        node_type: nodeType,
        parent_node_id: parentId || null,
      };

      if (nodeType === "topic") {
        updateData.required_focus_minutes = requiredFocusMinutes;
        updateData.required_card_reviews = requiredCardReviews;
        updateData.required_mastery_pct = requiredMasteryPct;
      } else if (nodeType === "boss") {
        updateData.boss_deck_id = bossDeckId;
        updateData.boss_hp = bossHp;
        updateData.required_mastery_pct = requiredMasteryPct;
      }

      const { error } = await (supabase.from("knowledge_nodes") as any)
        .update(updateData)
        .eq("id", existing.id);

      if (error) {
        addToast("Failed to update node", "error");
        console.error(error);
      } else {
        addToast("Node updated!", "success");
        onSaved();
      }
    } else {
      // Calculate sort_order: max among siblings + 1
      const siblings = allNodes.filter((n) => n.parent_node_id === parentId);
      const maxSort = siblings.reduce((max, s) => Math.max(max, s.sort_order), -1);

      const insertData: NodeInsert = {
        path_id: pathId,
        name: name.trim(),
        description: description.trim(),
        node_type: nodeType,
        parent_node_id: parentId || null,
        sort_order: maxSort + 1,
        is_unlocked: !parentId, // Root nodes start unlocked
        position_x: 0,
        position_y: 0,
      };

      if (nodeType === "topic") {
        insertData.required_focus_minutes = requiredFocusMinutes;
        insertData.required_card_reviews = requiredCardReviews;
        insertData.required_mastery_pct = requiredMasteryPct;
      } else if (nodeType === "boss") {
        insertData.boss_deck_id = bossDeckId;
        insertData.boss_hp = bossHp;
        insertData.required_mastery_pct = requiredMasteryPct;
      }

      const { error } = await (supabase.from("knowledge_nodes") as any)
        .insert(insertData);

      if (error) {
        addToast("Failed to create node", "error");
        console.error(error);
      } else {
        addToast("Node created!", "success");
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

  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  const typeOptions: { value: "topic" | "boss" | "checkpoint"; label: string; icon: string; desc: string }[] = [
    { value: "topic", label: "Topic", icon: "\uD83D\uDCD6", desc: "Standard learning node" },
    { value: "boss", label: "Boss", icon: "\u2694\uFE0F", desc: "Flashcard battle challenge" },
    { value: "checkpoint", label: "Checkpoint", icon: "\uD83D\uDCA0", desc: "Milestone marker" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border-[3px] ${
          isSun
            ? "bg-white/95 backdrop-blur-xl border-emerald-600/40"
            : "bg-slate-900/95 backdrop-blur-xl border-emerald-400/30"
        }`}
      >
        {/* Close */}
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
          {isEditing ? "Edit Node" : "Add Node"}
        </h2>

        <div className="space-y-5">
          {/* Node Type */}
          <div>
            <label className={labelClass}>Node Type</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNodeType(opt.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    nodeType === opt.value
                      ? isSun
                        ? "border-purple-400 bg-purple-50"
                        : "border-purple-500 bg-purple-500/10"
                      : isSun
                      ? "border-slate-200 hover:border-slate-300"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] mt-1 ${
                    isSun ? "text-slate-700" : "text-slate-200"
                  }`}>
                    {opt.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
              placeholder="e.g. Linear Algebra Basics"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`w-full px-4 py-3 rounded-xl outline-none resize-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
              placeholder="What does this node cover?"
            />
          </div>

          {/* Parent Node */}
          <div>
            <label className={labelClass}>Parent Node</label>
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${selectClass}`}
            >
              <option value="">None (root node)</option>
              {possibleParents.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.node_type === "boss" ? "\u2694\uFE0F " : n.node_type === "checkpoint" ? "\uD83D\uDCA0 " : "\uD83D\uDCD6 "}
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic-specific fields */}
          {nodeType === "topic" && (
            <div className={`space-y-4 p-4 rounded-2xl border-2 ${
              isSun ? "bg-purple-50/50 border-purple-200" : "bg-purple-500/5 border-purple-500/20"
            }`}>
              <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] uppercase tracking-wider ${
                isSun ? "text-purple-600" : "text-purple-400"
              }`}>
                Mastery Requirements
              </p>

              <div>
                <label className={labelClass}>Required Focus Minutes</label>
                <input
                  type="number"
                  value={requiredFocusMinutes}
                  onChange={(e) => setRequiredFocusMinutes(Number(e.target.value))}
                  min={0}
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
                />
              </div>

              <div>
                <label className={labelClass}>Required Card Reviews</label>
                <input
                  type="number"
                  value={requiredCardReviews}
                  onChange={(e) => setRequiredCardReviews(Number(e.target.value))}
                  min={0}
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
                />
              </div>

              <div>
                <label className={labelClass}>Required Mastery %</label>
                <input
                  type="number"
                  value={requiredMasteryPct}
                  onChange={(e) => setRequiredMasteryPct(Number(e.target.value))}
                  min={0}
                  max={100}
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
                />
              </div>
            </div>
          )}

          {/* Boss-specific fields */}
          {nodeType === "boss" && (
            <div className={`space-y-4 p-4 rounded-2xl border-2 ${
              isSun ? "bg-red-50/50 border-red-200" : "bg-red-500/5 border-red-500/20"
            }`}>
              <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] uppercase tracking-wider ${
                isSun ? "text-red-600" : "text-red-400"
              }`}>
                Boss Configuration
              </p>

              <div>
                <label className={labelClass}>Linked Flashcard Deck</label>
                <select
                  value={bossDeckId ?? ""}
                  onChange={(e) => setBossDeckId(e.target.value || null)}
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${selectClass}`}
                >
                  <option value="">No deck linked</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.emoji} {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Boss HP</label>
                <input
                  type="number"
                  value={bossHp}
                  onChange={(e) => setBossHp(Number(e.target.value))}
                  min={10}
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
                />
              </div>

              <div>
                <label className={labelClass}>Required Mastery %</label>
                <input
                  type="number"
                  value={requiredMasteryPct}
                  onChange={(e) => setRequiredMasteryPct(Number(e.target.value))}
                  min={0}
                  max={100}
                  className={`w-full px-4 py-3 rounded-xl outline-none font-[family-name:var(--font-quicksand)] ${inputClass}`}
                />
              </div>
            </div>
          )}

          {/* Checkpoint - no extra fields needed */}
          {nodeType === "checkpoint" && (
            <div className={`p-4 rounded-2xl border-2 ${
              isSun ? "bg-blue-50/50 border-blue-200" : "bg-blue-500/5 border-blue-500/20"
            }`}>
              <p className={`text-xs font-[family-name:var(--font-quicksand)] ${
                isSun ? "text-blue-600" : "text-blue-400"
              }`}>
                Checkpoints are milestone markers with no specific requirements.
                They unlock automatically when their parent node is completed.
              </p>
            </div>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold font-[family-name:var(--font-nunito)] shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : isEditing ? "Update Node" : "Create Node"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
