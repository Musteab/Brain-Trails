"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import NodeEditor from "@/components/knowledge/NodeEditor";
import NodeDetail from "@/components/knowledge/NodeDetail";
import { useCardStyles } from "@/hooks/useCardStyles";
import type { KnowledgePath, KnowledgeNode } from "@/lib/database.types";

interface KnowledgeMapProps {
  path: KnowledgePath;
  nodes: KnowledgeNode[];
  onNodesChanged: () => void;
}

/* ── Layout constants ── */
const NODE_W = 160;
const NODE_H = 80;
const LEVEL_GAP_Y = 140;
const SIBLING_GAP_X = 200;

/* ── Tree‑position helpers ── */
interface PositionedNode extends KnowledgeNode {
  _x: number;
  _y: number;
  _children: string[];
}

function buildTree(nodes: KnowledgeNode[]): Map<string, PositionedNode> {
  const map = new Map<string, PositionedNode>();
  nodes.forEach((n) =>
    map.set(n.id, { ...n, _x: 0, _y: 0, _children: [] })
  );
  nodes.forEach((n) => {
    if (n.parent_node_id && map.has(n.parent_node_id)) {
      map.get(n.parent_node_id)!._children.push(n.id);
    }
  });
  // Sort children by sort_order
  map.forEach((n) => {
    n._children.sort((a, b) => {
      const na = map.get(a)!;
      const nb = map.get(b)!;
      return na.sort_order - nb.sort_order;
    });
  });
  return map;
}

function layoutSubtree(
  nodeId: string,
  depth: number,
  xOffset: number,
  map: Map<string, PositionedNode>
): number {
  const node = map.get(nodeId)!;
  node._y = depth * LEVEL_GAP_Y + 60;

  if (node._children.length === 0) {
    node._x = xOffset;
    return SIBLING_GAP_X;
  }

  let currentX = xOffset;
  let totalWidth = 0;
  for (const childId of node._children) {
    const childWidth = layoutSubtree(childId, depth + 1, currentX, map);
    currentX += childWidth;
    totalWidth += childWidth;
  }

  const firstChild = map.get(node._children[0])!;
  const lastChild = map.get(node._children[node._children.length - 1])!;
  node._x = (firstChild._x + lastChild._x) / 2;

  return Math.max(totalWidth, SIBLING_GAP_X);
}

export default function KnowledgeMap({ path, nodes, onNodesChanged }: KnowledgeMapProps) {
  const { isSun } = useCardStyles();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null);
  const [parentForNewNode, setParentForNewNode] = useState<string | null>(null);

  /* ── Build & layout the tree ── */
  const { positioned, roots, svgWidth, svgHeight } = useMemo(() => {
    const map = buildTree(nodes);

    // Find root nodes (no parent)
    const rootIds = nodes
      .filter((n) => !n.parent_node_id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((n) => n.id);

    let xCursor = 60;
    for (const rootId of rootIds) {
      const width = layoutSubtree(rootId, 0, xCursor, map);
      xCursor += width;
    }

    // Compute SVG dimensions
    let maxX = 0;
    let maxY = 0;
    map.forEach((n) => {
      if (n._x + NODE_W > maxX) maxX = n._x + NODE_W;
      if (n._y + NODE_H > maxY) maxY = n._y + NODE_H;
    });

    return {
      positioned: map,
      roots: rootIds,
      svgWidth: Math.max(maxX + 80, 600),
      svgHeight: Math.max(maxY + 120, 400),
    };
  }, [nodes]);

  /* ── Center the view on mount ── */
  useEffect(() => {
    if (roots.length > 0) {
      const firstRoot = positioned.get(roots[0]);
      if (firstRoot) {
        setPan({
          x: -firstRoot._x + 200,
          y: 20,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roots.length]);

  /* ── Pan handlers ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  const fitToView = useCallback(() => {
    setZoom(0.8);
    if (roots.length > 0) {
      const firstRoot = positioned.get(roots[0]);
      if (firstRoot) {
        setPan({ x: -firstRoot._x + 300, y: 40 });
      }
    }
  }, [roots, positioned]);

  /* ── Node rendering ── */
  const renderNode = (nodeId: string) => {
    const node = positioned.get(nodeId);
    if (!node) return null;

    const isSelected = selectedNode?.id === nodeId;
    const masteryPct = node.mastery_pct;
    const circumference = 2 * Math.PI * 30;
    const strokeDashoffset = circumference - (masteryPct / 100) * circumference;

    // Node shape & styling based on type
    let nodeShape = "rounded-2xl";
    let typeIcon = "";
    let borderColor = "";

    if (node.node_type === "boss") {
      nodeShape = "rounded-2xl";
      typeIcon = "\u2694\uFE0F"; // sword
      borderColor = node.is_completed
        ? isSun ? "border-amber-400" : "border-amber-500"
        : node.is_unlocked
        ? isSun ? "border-red-400" : "border-red-500"
        : isSun ? "border-slate-300" : "border-slate-600";
    } else if (node.node_type === "checkpoint") {
      nodeShape = "rotate-45 rounded-lg";
      typeIcon = "\uD83D\uDCA0"; // diamond
      borderColor = node.is_completed
        ? isSun ? "border-emerald-400" : "border-emerald-500"
        : node.is_unlocked
        ? isSun ? "border-blue-400" : "border-blue-500"
        : isSun ? "border-slate-300" : "border-slate-600";
    } else {
      borderColor = node.is_completed
        ? isSun ? "border-emerald-400" : "border-emerald-500"
        : node.is_unlocked
        ? isSun ? "border-purple-400" : "border-purple-500"
        : isSun ? "border-slate-300" : "border-slate-600";
    }

    const bgColor = node.is_completed
      ? isSun ? "bg-emerald-50/90" : "bg-emerald-900/40"
      : node.is_unlocked
      ? isSun ? "bg-white/90" : "bg-slate-800/80"
      : isSun ? "bg-slate-100/60" : "bg-slate-900/60";

    const textColor = node.is_completed
      ? isSun ? "text-emerald-800" : "text-emerald-200"
      : node.is_unlocked
      ? isSun ? "text-slate-800" : "text-white"
      : isSun ? "text-slate-400" : "text-slate-500";

    const glowClass = node.is_unlocked && !node.is_completed
      ? node.node_type === "boss"
        ? "shadow-lg shadow-red-500/30"
        : "shadow-lg shadow-purple-500/20"
      : "";

    return (
      <g key={nodeId}>
        {/* Connections to children */}
        {node._children.map((childId) => {
          const child = positioned.get(childId);
          if (!child) return null;

          const startX = node._x + NODE_W / 2;
          const startY = node._y + NODE_H;
          const endX = child._x + NODE_W / 2;
          const endY = child._y;
          const midY = (startY + endY) / 2;

          const pathColor = child.is_unlocked
            ? isSun ? "#9333ea" : "#a855f7"
            : isSun ? "#d1d5db" : "#475569";

          return (
            <path
              key={`${nodeId}-${childId}`}
              d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
              fill="none"
              stroke={pathColor}
              strokeWidth={child.is_unlocked ? 3 : 2}
              strokeDasharray={child.is_unlocked ? "none" : "6 4"}
              opacity={child.is_unlocked ? 1 : 0.5}
            />
          );
        })}

        {/* Node body */}
        <foreignObject
          x={node._x}
          y={node._y}
          width={node.node_type === "boss" ? 180 : NODE_W}
          height={node.node_type === "checkpoint" ? 100 : NODE_H + 20}
          data-node="true"
        >
          <div className="relative flex items-center justify-center h-full">
            {/* Progress ring for non-checkpoint nodes */}
            {node.node_type !== "checkpoint" && node.is_unlocked && !node.is_completed && (
              <svg
                className="absolute -top-3 -right-3"
                width="32"
                height="32"
                viewBox="0 0 68 68"
              >
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill="none"
                  stroke={isSun ? "#e2e8f0" : "#334155"}
                  strokeWidth="4"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="30"
                  fill={isSun ? "#f1f5f9" : "#1e293b"}
                  stroke={node.node_type === "boss" ? "#ef4444" : "#a855f7"}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                />
                <text
                  x="34"
                  y="38"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="bold"
                  fill={isSun ? "#475569" : "#94a3b8"}
                >
                  {masteryPct}
                </text>
              </svg>
            )}

            {/* Completed check */}
            {node.is_completed && (
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm shadow-lg z-10">
                &#10003;
              </div>
            )}

            {/* Locked icon */}
            {!node.is_unlocked && (
              <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg z-10 ${
                isSun ? "bg-slate-300 text-slate-500" : "bg-slate-700 text-slate-400"
              }`}>
                &#128274;
              </div>
            )}

            <motion.button
              data-node="true"
              whileHover={node.is_unlocked ? { scale: 1.05 } : {}}
              whileTap={node.is_unlocked ? { scale: 0.97 } : {}}
              onClick={() => setSelectedNode(node)}
              className={`
                w-full px-4 py-3 border-[3px] backdrop-blur-sm transition-all cursor-pointer
                ${node.node_type === "checkpoint" ? "w-24 h-24 rotate-45" : ""}
                ${nodeShape} ${bgColor} ${borderColor} ${textColor} ${glowClass}
                ${isSelected ? "ring-2 ring-purple-400 ring-offset-2" : ""}
              `}
              style={node.node_type === "checkpoint" ? { width: 80, height: 80 } : { width: node.node_type === "boss" ? 180 : NODE_W }}
            >
              <div className={node.node_type === "checkpoint" ? "-rotate-45" : ""}>
                {node.node_type === "boss" && (
                  <span className="text-lg">{typeIcon}</span>
                )}
                {node.node_type === "checkpoint" && (
                  <span className="text-lg">{typeIcon}</span>
                )}
                <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] truncate ${
                  node.node_type === "checkpoint" ? "text-[10px]" : ""
                }`}>
                  {node.name}
                </p>
              </div>
            </motion.button>
          </div>
        </foreignObject>

        {/* Recursively render children */}
        {node._children.map(renderNode)}
      </g>
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className={`absolute top-4 right-4 z-20 flex flex-col gap-2`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingNode(null);
            setParentForNewNode(null);
            setShowNodeEditor(true);
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg"
          title="Add node"
        >
          <Plus className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            isSun ? "bg-white/80 text-slate-600" : "bg-slate-800/80 text-slate-300"
          }`}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            isSun ? "bg-white/80 text-slate-600" : "bg-slate-800/80 text-slate-300"
          }`}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={fitToView}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            isSun ? "bg-white/80 text-slate-600" : "bg-slate-800/80 text-slate-300"
          }`}
          title="Fit to view"
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Canvas */}
      <div
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
        >
          {nodes.length === 0 ? (
            /* Empty map state */
            <div className="flex items-center justify-center" style={{ width: 600, height: 400 }}>
              <div className="text-center">
                <p className={`text-6xl mb-4`}>&#x1F5FA;&#xFE0F;</p>
                <p className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                  Empty map
                </p>
                <p className={`text-sm font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                  Click the + button to add your first node
                </p>
              </div>
            </div>
          ) : (
            <svg
              width={svgWidth}
              height={svgHeight}
              className="overflow-visible"
            >
              {roots.map(renderNode)}
            </svg>
          )}
        </div>
      </div>

      {/* Node Detail Side Panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetail
            node={selectedNode}
            allNodes={nodes}
            onClose={() => setSelectedNode(null)}
            onEdit={() => {
              setEditingNode(selectedNode);
              setShowNodeEditor(true);
            }}
            onAddChild={() => {
              setParentForNewNode(selectedNode.id);
              setEditingNode(null);
              setShowNodeEditor(true);
            }}
            onNodesChanged={() => {
              setSelectedNode(null);
              onNodesChanged();
            }}
          />
        )}
      </AnimatePresence>

      {/* Node Editor Modal */}
      <AnimatePresence>
        {showNodeEditor && (
          <NodeEditor
            pathId={path.id}
            existing={editingNode}
            parentNodeId={parentForNewNode}
            allNodes={nodes}
            onClose={() => {
              setShowNodeEditor(false);
              setEditingNode(null);
              setParentForNewNode(null);
            }}
            onSaved={() => {
              setShowNodeEditor(false);
              setEditingNode(null);
              setParentForNewNode(null);
              onNodesChanged();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
