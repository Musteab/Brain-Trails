"use client";

import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

export type NodeStatus = "locked" | "active" | "mastered";

export interface SkillNode {
  id: number;
  label: string;
  status: NodeStatus;
  x: number; // percentage position
  y: number; // percentage position
  parent: number | null;
  mastery?: number; // 0-100
}

interface SkillTreeProps {
  nodes: SkillNode[];
  onNodeClick: (node: SkillNode) => void;
}

/**
 * Get node colors based on status
 */
function getNodeStyles(status: NodeStatus) {
  switch (status) {
    case "mastered":
      return {
        bg: "bg-gradient-to-br from-amber-400 to-yellow-500",
        border: "border-amber-300",
        shadow: "shadow-amber-400/50",
        glow: false,
      };
    case "active":
      return {
        bg: "bg-gradient-to-br from-emerald-400 to-teal-500",
        border: "border-emerald-300",
        shadow: "shadow-emerald-400/50",
        glow: true,
      };
    case "locked":
    default:
      return {
        bg: "bg-slate-400/50",
        border: "border-slate-500/50",
        shadow: "shadow-slate-400/20",
        glow: false,
      };
  }
}

/**
 * Individual Skill Node component
 */
function SkillNodeComponent({
  node,
  onClick,
}: {
  node: SkillNode;
  onClick: () => void;
}) {
  const styles = getNodeStyles(node.status);
  const isClickable = node.status !== "locked";

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: node.id * 0.1, type: "spring", stiffness: 300 }}
    >
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        <div className="bg-slate-900/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
          <p className="font-bold">{node.label}</p>
          <p className="text-slate-300">
            Mastery: {node.mastery ?? (node.status === "mastered" ? 100 : node.status === "active" ? 45 : 0)}%
          </p>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
      </div>

      {/* Pulsing glow for active nodes */}
      {styles.glow && (
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-400/40 blur-xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "80px", height: "80px", left: "-16px", top: "-16px" }}
        />
      )}

      {/* Node Circle */}
      <motion.button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={`
          relative w-12 h-12 rounded-full
          ${styles.bg}
          border-3 ${styles.border}
          shadow-lg ${styles.shadow}
          flex items-center justify-center
          ${isClickable ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-60"}
          transition-transform duration-200
        `}
        whileHover={isClickable ? { scale: 1.15 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
      >
        {node.status === "mastered" && (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        )}
        {node.status === "locked" && (
          <Lock className="w-4 h-4 text-slate-600" />
        )}
        {node.status === "active" && (
          <motion.div
            className="w-3 h-3 rounded-full bg-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Label below node */}
      <p className={`
        absolute top-full left-1/2 -translate-x-1/2 mt-2
        text-xs font-semibold text-center whitespace-nowrap
        ${node.status === "locked" ? "text-slate-500" : "text-white"}
        font-[family-name:var(--font-quicksand)]
      `}>
        {node.label}
      </p>
    </motion.div>
  );
}

/**
 * SVG Connector Lines between nodes
 */
function TreeConnectors({ nodes }: { nodes: SkillNode[] }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id="masteredLine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="activeLine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="lockedLine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {nodes.map((node) => {
        if (node.parent === null) return null;
        const parentNode = nodes.find((n) => n.id === node.parent);
        if (!parentNode) return null;

        // Determine line color based on child status
        const lineGradient =
          node.status === "mastered"
            ? "url(#masteredLine)"
            : node.status === "active"
            ? "url(#activeLine)"
            : "url(#lockedLine)";

        return (
          <motion.line
            key={`line-${parentNode.id}-${node.id}`}
            x1={`${parentNode.x}%`}
            y1={`${parentNode.y}%`}
            x2={`${node.x}%`}
            y2={`${node.y}%`}
            stroke={lineGradient}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={node.status === "locked" ? "8 8" : "0"}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: node.id * 0.1 }}
          />
        );
      })}
    </svg>
  );
}

/**
 * 🌳 SkillTree Component
 * 
 * RPG-style skill tree visualization for study topics
 */
export default function SkillTree({ nodes, onNodeClick }: SkillTreeProps) {
  return (
    <div className="relative w-full h-full">
      {/* Connector Lines */}
      <TreeConnectors nodes={nodes} />

      {/* Skill Nodes */}
      {nodes.map((node) => (
        <SkillNodeComponent
          key={node.id}
          node={node}
          onClick={() => onNodeClick(node)}
        />
      ))}
    </div>
  );
}
