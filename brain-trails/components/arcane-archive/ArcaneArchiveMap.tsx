"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import type { Database } from "@/lib/database.types";

type KnowledgePath = Database["public"]["Tables"]["knowledge_paths"]["Row"];

interface ArcaneArchiveMapProps {
  subjects: KnowledgePath[];
  onSubjectHover?: (subjectId: string | null) => void;
}

export default function ArcaneArchiveMap({
  subjects,
  onSubjectHover,
}: ArcaneArchiveMapProps) {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  // Calculate circular positions for subjects
  const getSubjectPositions = () => {
    if (!subjects.length) return {};
    const positions: Record<string, { x: number; y: number }> = {};
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 3;

    subjects.forEach((subject, index) => {
      const angle = (index / subjects.length) * Math.PI * 2 - Math.PI / 2;
      positions[subject.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return positions;
  };

  const drawConnections = () => {
    if (!canvasRef.current || !subjects.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const positions = getSubjectPositions();

    // Draw connections between all subjects with varying opacity
    const strokeColor = isSun
      ? "rgba(147, 51, 234, 0.15)"
      : "rgba(168, 85, 247, 0.25)";
    const glowColor = isSun
      ? "rgba(139, 92, 246, 0.4)"
      : "rgba(147, 51, 234, 0.6)";

    ctx.lineWidth = 1;
    ctx.strokeStyle = strokeColor;

    subjects.forEach((subject1, i) => {
      subjects.forEach((subject2, j) => {
        if (i < j) {
          const from = positions[subject1.id];
          const to = positions[subject2.id];

          if (from && to) {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            // Add glow effect for hovered connections
            if (hoveredSubjectId === subject1.id || hoveredSubjectId === subject2.id) {
              ctx.lineWidth = 2;
              ctx.strokeStyle = glowColor;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 10;

              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();

              ctx.shadowBlur = 0;
              ctx.lineWidth = 1;
              ctx.strokeStyle = strokeColor;
            }
          }
        }
      });
    });
  };

  useEffect(() => {
    drawConnections();
    window.addEventListener("resize", drawConnections);
    return () => window.removeEventListener("resize", drawConnections);
  }, [isSun, hoveredSubjectId, subjects]);

  const positions = getSubjectPositions();

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden border-2 transition-all ${
        isSun
          ? "bg-gradient-to-br from-purple-50 to-white border-purple-200"
          : "bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30"
      }`}
      style={{ minHeight: "500px" }}
    >
      {/* Background canvas for connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Subject nodes */}
      <div className="absolute inset-0">
        {subjects.map((subject) => {
          const pos = positions[subject.id];
          if (!pos) return null;

          return (
            <motion.div
              key={subject.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              onHoverStart={() => {
                setHoveredSubjectId(subject.id);
                onSubjectHover?.(subject.id);
              }}
              onHoverEnd={() => {
                setHoveredSubjectId(null);
                onSubjectHover?.(null);
              }}
              style={{
                position: "absolute",
                left: `${(pos.x / window.innerWidth) * 100}%`,
                top: `${(pos.y / (window.innerHeight / 2)) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="cursor-pointer"
            >
              <motion.div
                animate={{
                  scale: hoveredSubjectId === subject.id ? 1.2 : 1,
                }}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all border-2 ${
                  hoveredSubjectId === subject.id
                    ? isSun
                      ? "bg-purple-200 border-purple-500 shadow-lg shadow-purple-400/50"
                      : "bg-purple-500/40 border-purple-400 shadow-lg shadow-purple-500/50"
                    : isSun
                    ? "bg-white border-purple-300 shadow-md"
                    : "bg-slate-800 border-purple-500/30 shadow-lg shadow-purple-500/10"
                }`}
              >
                {/* Glowing center dot */}
                <div
                  className={`absolute w-2 h-2 rounded-full ${
                    hoveredSubjectId === subject.id
                      ? isSun
                        ? "bg-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                        : "bg-purple-300 shadow-[0_0_12px_rgba(196,181,253,0.8)]"
                      : isSun
                      ? "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                      : "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]"
                  }`}
                />

                {/* Subject emoji/icon */}
                <div className="text-2xl">{subject.emoji || "📚"}</div>

                {/* Tooltip on hover */}
                {hoveredSubjectId === subject.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute bottom-full mb-3 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      isSun
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "bg-white text-slate-800 border border-slate-200"
                    }`}
                  >
                    {subject.name}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {!subjects.length && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className={`text-center text-sm font-medium ${
              isSun ? "text-slate-400" : "text-slate-500"
            }`}
          >
            No subjects yet. Create your first subject to see the map!
          </p>
        </div>
      )}
    </div>
  );
}
