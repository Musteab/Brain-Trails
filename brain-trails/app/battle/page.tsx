"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SkillTree, { type SkillNode } from "@/components/battle/SkillTree";
import ResourcePanel from "@/components/battle/ResourcePanel";
import CardForge from "@/components/battle/CardForge";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

// Sample skill tree data - would come from backend
const sampleSkillTree: SkillNode[] = [
  // Root
  { id: 1, label: "Algebra Basics", status: "mastered", x: 50, y: 8, parent: null, mastery: 100 },
  
  // Level 2
  { id: 2, label: "Linear Equations", status: "mastered", x: 30, y: 22, parent: 1, mastery: 100 },
  { id: 3, label: "Functions", status: "mastered", x: 70, y: 22, parent: 1, mastery: 100 },
  
  // Level 3
  { id: 4, label: "Quadratics", status: "active", x: 20, y: 38, parent: 2, mastery: 65 },
  { id: 5, label: "Systems", status: "active", x: 40, y: 38, parent: 2, mastery: 45 },
  { id: 6, label: "Limits", status: "active", x: 60, y: 38, parent: 3, mastery: 30 },
  { id: 7, label: "Continuity", status: "locked", x: 80, y: 38, parent: 3 },
  
  // Level 4
  { id: 8, label: "Polynomials", status: "locked", x: 15, y: 54, parent: 4 },
  { id: 9, label: "Matrices", status: "locked", x: 35, y: 54, parent: 5 },
  { id: 10, label: "Derivatives", status: "locked", x: 55, y: 54, parent: 6 },
  { id: 11, label: "L'Hôpital", status: "locked", x: 75, y: 54, parent: 6 },
  
  // Level 5
  { id: 12, label: "Integration", status: "locked", x: 50, y: 70, parent: 10 },
  { id: 13, label: "Taylor Series", status: "locked", x: 70, y: 70, parent: 10 },
  
  // Boss Node
  { id: 14, label: "Calculus Master", status: "locked", x: 50, y: 88, parent: 12 },
];

/**
 * ⚔️ Battle Page
 * 
 * The Arcane Archive - Skill tree visualization for curriculum mastery
 */
export default function BattlePage() {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleNodeClick = (node: SkillNode) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleForge = () => {
    // TODO: Open flashcard creation modal
    console.log("Forging new flashcards...");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950" />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-64 h-64 rounded-full
            bg-emerald-500/10 blur-3xl"
        />
        <motion.div
          animate={{
            y: [20, -20, 20],
            x: [10, -10, 10],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-40 right-20 w-96 h-96 rounded-full
            bg-teal-500/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            w-[800px] h-[800px] rounded-full
            bg-gradient-radial from-emerald-500/5 to-transparent"
        />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Page Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 pt-8 pb-4 px-8"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-nunito)]
              drop-shadow-lg">
              Arcane Archive
            </h1>
            <p className="text-teal-300/80 mt-1 text-sm">
              Master your curriculum • Unlock new knowledge
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl
              bg-amber-500/20 border border-amber-500/30">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300 text-sm font-medium">3 Mastered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl
              bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-sm font-medium">3 In Progress</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl
              bg-slate-500/20 border border-slate-500/30">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-300 text-sm font-medium">8 Locked</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Skill Tree Container */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 flex-1 px-8 pb-32"
      >
        <div className="max-w-6xl mx-auto h-[calc(100vh-200px)]
          bg-white/5 backdrop-blur-sm rounded-3xl
          border border-white/10 shadow-2xl shadow-black/20
          overflow-hidden">
          <SkillTree 
            nodes={sampleSkillTree} 
            onNodeClick={handleNodeClick}
          />
        </div>
      </motion.section>

      {/* Resource Panel */}
      <ResourcePanel 
        node={selectedNode}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />

      {/* Card Forge FAB */}
      <CardForge onForge={handleForge} />

      {/* Hotbar */}
      <TravelerHotbar />
    </main>
  );
}
