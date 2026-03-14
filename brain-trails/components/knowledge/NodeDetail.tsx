"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, Swords, Clock, BookOpen, Trophy } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import type { KnowledgeNode } from "@/lib/database.types";

interface NodeDetailProps {
  node: KnowledgeNode;
  allNodes: KnowledgeNode[];
  onClose: () => void;
  onEdit: () => void;
  onAddChild: () => void;
  onNodesChanged: () => void;
}

function ProgressBar({
  label,
  current,
  total,
  icon,
  color,
  isSun,
}: {
  label: string;
  current: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  isSun: boolean;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-xs font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
            {label}
          </span>
        </div>
        <span className={`text-xs font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
          {current} / {total}
        </span>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function MasteryRing({ pct, size = 100, isSun }: { pct: number; size?: number; isSun: boolean }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  let strokeColor = "#a855f7"; // purple
  if (pct >= 80) strokeColor = "#22c55e"; // green
  else if (pct >= 50) strokeColor = "#3b82f6"; // blue
  else if (pct >= 20) strokeColor = "#f59e0b"; // amber

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isSun ? "#e2e8f0" : "#334155"}
          strokeWidth="6"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
          {pct}%
        </span>
        <span className={`text-[10px] font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
          mastery
        </span>
      </div>
    </div>
  );
}

export default function NodeDetail({
  node,
  allNodes,
  onClose,
  onEdit,
  onAddChild,
  onNodesChanged,
}: NodeDetailProps) {
  const router = useRouter();
  const { isSun } = useCardStyles();
  const { addToast } = useUIStore();

  const childCount = allNodes.filter((n) => n.parent_node_id === node.id).length;
  const parentNode = node.parent_node_id
    ? allNodes.find((n) => n.id === node.parent_node_id)
    : null;

  const handleDelete = async () => {
    if (!confirm("Delete this node? Children will become orphaned.")) return;

    const { error } = await supabase
      .from("knowledge_nodes")
      .delete()
      .eq("id", node.id);

    if (error) {
      addToast("Failed to delete node", "error");
    } else {
      addToast("Node deleted", "success");
      onNodesChanged();
    }
  };

  const handleChallengeBoss = () => {
    if (node.boss_deck_id) {
      router.push(`/battle?deck=${node.boss_deck_id}`);
    } else {
      addToast("No deck linked to this boss node", "error");
    }
  };

  // Determine what's missing for locked nodes
  const getMissingRequirements = () => {
    if (node.is_unlocked) return [];
    const missing: string[] = [];

    if (parentNode && !parentNode.is_completed) {
      missing.push(`Complete parent node "${parentNode.name}" first`);
    }

    return missing;
  };

  const missingReqs = getMissingRequirements();

  const typeLabel =
    node.node_type === "boss"
      ? "\u2694\uFE0F Boss Node"
      : node.node_type === "checkpoint"
      ? "\uD83D\uDCA0 Checkpoint"
      : "\uD83D\uDCD6 Topic Node";

  const statusLabel = node.is_completed
    ? "Completed"
    : node.is_unlocked
    ? "In Progress"
    : "Locked";

  const statusColor = node.is_completed
    ? "text-emerald-500"
    : node.is_unlocked
    ? "text-purple-500"
    : "text-slate-400";

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute top-0 right-0 h-full w-[380px] z-30 overflow-y-auto border-l-[3px] shadow-2xl ${
        isSun
          ? "bg-white/95 backdrop-blur-xl border-emerald-600/40"
          : "bg-slate-900/95 backdrop-blur-xl border-emerald-400/30"
      }`}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] uppercase tracking-wider ${
              isSun ? "text-slate-400" : "text-slate-500"
            }`}>
              {typeLabel}
            </p>
            <h3 className={`text-xl font-bold font-[family-name:var(--font-nunito)] mt-1 ${
              isSun ? "text-slate-800" : "text-white"
            }`}>
              {node.name}
            </h3>
            <p className={`text-sm font-bold ${statusColor}`}>{statusLabel}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isSun ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-slate-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        {node.description && (
          <p className={`text-sm font-[family-name:var(--font-quicksand)] leading-relaxed ${
            isSun ? "text-slate-600" : "text-slate-300"
          }`}>
            {node.description}
          </p>
        )}

        {/* Mastery Ring */}
        {node.node_type !== "checkpoint" && (
          <div className="flex justify-center">
            <MasteryRing pct={node.mastery_pct} isSun={isSun} />
          </div>
        )}

        {/* Progress Bars (topic nodes) */}
        {node.node_type === "topic" && node.is_unlocked && (
          <div className="space-y-4">
            <ProgressBar
              label="Focus Time"
              current={node.focus_minutes_logged}
              total={node.required_focus_minutes}
              icon={<Clock className={`w-3.5 h-3.5 ${isSun ? "text-blue-500" : "text-blue-400"}`} />}
              color="bg-gradient-to-r from-blue-400 to-blue-600"
              isSun={isSun}
            />
            <ProgressBar
              label="Card Reviews"
              current={node.card_reviews_logged}
              total={node.required_card_reviews}
              icon={<BookOpen className={`w-3.5 h-3.5 ${isSun ? "text-amber-500" : "text-amber-400"}`} />}
              color="bg-gradient-to-r from-amber-400 to-amber-600"
              isSun={isSun}
            />
            <ProgressBar
              label="Mastery"
              current={node.mastery_pct}
              total={node.required_mastery_pct}
              icon={<Trophy className={`w-3.5 h-3.5 ${isSun ? "text-purple-500" : "text-purple-400"}`} />}
              color="bg-gradient-to-r from-purple-400 to-purple-600"
              isSun={isSun}
            />
          </div>
        )}

        {/* Boss node info */}
        {node.node_type === "boss" && node.is_unlocked && (
          <div className={`p-4 rounded-2xl border-2 ${
            isSun ? "bg-red-50/50 border-red-200" : "bg-red-500/5 border-red-500/20"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold font-[family-name:var(--font-nunito)] uppercase tracking-wider ${
                isSun ? "text-red-600" : "text-red-400"
              }`}>
                Boss Battle
              </span>
              <span className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                isSun ? "text-red-700" : "text-red-300"
              }`}>
                HP: {node.boss_hp}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleChallengeBoss}
              disabled={node.is_completed}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold font-[family-name:var(--font-nunito)] shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              {node.is_completed ? "Boss Defeated!" : "Challenge Boss"}
            </motion.button>
          </div>
        )}

        {/* Completed info */}
        {node.is_completed && node.completed_at && (
          <div className={`p-4 rounded-2xl border-2 ${
            isSun ? "bg-emerald-50/50 border-emerald-200" : "bg-emerald-500/5 border-emerald-500/20"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">&#127942;</span>
              <span className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                isSun ? "text-emerald-700" : "text-emerald-300"
              }`}>
                Completed!
              </span>
            </div>
            <p className={`text-xs font-[family-name:var(--font-quicksand)] ${
              isSun ? "text-emerald-600" : "text-emerald-400"
            }`}>
              {new Date(node.completed_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Locked info */}
        {!node.is_unlocked && missingReqs.length > 0 && (
          <div className={`p-4 rounded-2xl border-2 ${
            isSun ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
          }`}>
            <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] uppercase tracking-wider mb-2 ${
              isSun ? "text-slate-500" : "text-slate-400"
            }`}>
              Requirements to Unlock
            </p>
            <ul className="space-y-1">
              {missingReqs.map((req, i) => (
                <li key={i} className={`text-sm font-[family-name:var(--font-quicksand)] flex items-center gap-2 ${
                  isSun ? "text-slate-600" : "text-slate-300"
                }`}>
                  <span className="text-red-400">&#x2716;</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Meta info */}
        <div className={`text-xs space-y-1 font-[family-name:var(--font-quicksand)] ${
          isSun ? "text-slate-400" : "text-slate-500"
        }`}>
          {parentNode && (
            <p>Parent: {parentNode.name}</p>
          )}
          <p>{childCount} child node{childCount !== 1 ? "s" : ""}</p>
          <p>Created: {new Date(node.created_at).toLocaleDateString()}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddChild}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold font-[family-name:var(--font-nunito)] shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4" />
            Add Child
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] transition-colors ${
              isSun
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            <Pencil className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
