"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Map, Trash2, ChevronLeft } from "lucide-react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import KnowledgeMap from "@/components/knowledge/KnowledgeMap";
import PathCreator from "@/components/knowledge/PathCreator";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import type { KnowledgePath, KnowledgeNode } from "@/lib/database.types";

interface PathWithNodes extends KnowledgePath {
  knowledge_nodes: KnowledgeNode[];
}

export default function KnowledgePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { card, isSun, title, muted } = useCardStyles();
  const { addToast } = useUIStore();

  const [paths, setPaths] = useState<PathWithNodes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<PathWithNodes | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editingPath, setEditingPath] = useState<KnowledgePath | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    const run = async () => {
      // Fetch paths first
      const { data: pathData, error: pathError } = await supabase
        .from("knowledge_paths")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (pathError) {
        console.error("Error fetching paths:", pathError.message ?? pathError);
        addToast("Failed to load knowledge paths", "error");
        setIsLoading(false);
        return;
      }

      const pathList = pathData ?? [];

      // Fetch all nodes for this user's paths in one query
      if (pathList.length > 0) {
        const pathIds = pathList.map((p) => p.id);
        const { data: nodeData } = await supabase
          .from("knowledge_nodes")
          .select("*")
          .in("path_id", pathIds);

        if (cancelled) return;

        const nodesByPath: Record<string, KnowledgeNode[]> = {};
        (nodeData ?? []).forEach((node) => {
          const pid = node.path_id;
          if (!nodesByPath[pid]) nodesByPath[pid] = [];
          nodesByPath[pid].push(node as KnowledgeNode);
        });

        setPaths(
          pathList.map((p) => ({
            ...(p as KnowledgePath),
            knowledge_nodes: nodesByPath[p.id] ?? [],
          }))
        );
      } else {
        setPaths([]);
      }

      setIsLoading(false);
    };

    void run();
    return () => { cancelled = true; };
  }, [user, authLoading, addToast, fetchKey]);

  const refetchPaths = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  const handleDeletePath = async (e: React.MouseEvent, pathId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this knowledge path? All nodes inside will be removed.")) return;

    const { error } = await supabase.from("knowledge_paths").delete().eq("id", pathId);
    if (error) {
      addToast("Failed to delete path", "error");
    } else {
      setPaths((prev) => prev.filter((p) => p.id !== pathId));
      if (selectedPath?.id === pathId) setSelectedPath(null);
      addToast("Path deleted", "success");
    }
  };

  const handlePathCreated = () => {
    setShowCreator(false);
    setEditingPath(null);
    refetchPaths();
  };

  const handleEditPath = (e: React.MouseEvent, path: KnowledgePath) => {
    e.stopPropagation();
    setEditingPath(path);
    setShowCreator(true);
  };

  const getCompletionPct = (nodes: KnowledgeNode[]) => {
    if (nodes.length === 0) return 0;
    const completed = nodes.filter((n) => n.is_completed).length;
    return Math.round((completed / nodes.length) * 100);
  };

  // ===== Visual Node Map View =====
  if (selectedPath) {
    return (
      <main className="relative min-h-screen">
        <div
          className={`fixed inset-0 ${
            isSun
              ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
              : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
          }`}
        />

        <div className="relative z-10 flex flex-col h-screen pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-6 py-4"
          >
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPath(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                isSun ? "hover:bg-slate-100 text-slate-600" : "hover:bg-white/10 text-slate-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium font-[family-name:var(--font-quicksand)]">Paths</span>
            </motion.button>

            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{selectedPath.emoji}</span>
              <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                {selectedPath.name}
              </h2>
              <span className={`text-sm px-3 py-1 rounded-full font-[family-name:var(--font-quicksand)] ${
                isSun ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {getCompletionPct(selectedPath.knowledge_nodes)}% complete
              </span>
            </div>
          </motion.div>

          {/* Map */}
          <div className="flex-1 overflow-hidden">
            <KnowledgeMap
              path={selectedPath}
              nodes={selectedPath.knowledge_nodes}
              onNodesChanged={refetchPaths}
            />
          </div>
        </div>

        <TravelerHotbar />
      </main>
    );
  }

  // ===== Path List View =====
  return (
    <main className="relative min-h-screen">
      <div
        className={`fixed inset-0 ${
          isSun
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        }`}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-32">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-between items-end"
        >
          <div>
            <h1 className={`text-4xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
              Arcane Archive
            </h1>
            <p className={`mt-2 font-[family-name:var(--font-quicksand)] ${muted}`}>
              Chart your knowledge paths and conquer the skill tree.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingPath(null); setShowCreator(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold font-[family-name:var(--font-nunito)]">New Path</span>
          </motion.button>
        </motion.div>

        {/* Path Creator Modal */}
        <AnimatePresence>
          {showCreator && (
            <PathCreator
              existing={editingPath}
              onClose={() => { setShowCreator(false); setEditingPath(null); }}
              onSaved={handlePathCreated}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : paths.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${card} p-12 text-center`}
          >
            <div className="text-7xl mb-6">
              <Map className={`w-20 h-20 mx-auto ${isSun ? "text-purple-300" : "text-purple-500/50"}`} />
            </div>
            <h3 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] mb-3 ${title}`}>
              No Knowledge Paths Yet
            </h3>
            <p className={`max-w-md mx-auto mb-8 font-[family-name:var(--font-quicksand)] ${muted}`}>
              Create your first knowledge path to start building a visual skill tree.
              Add topics, set mastery goals, and challenge boss nodes along the way!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreator(true)}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 font-bold font-[family-name:var(--font-nunito)]"
            >
              Create Your First Path
            </motion.button>
          </motion.div>
        ) : (
          /* Path Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((path, i) => {
              const pct = getCompletionPct(path.knowledge_nodes);
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group"
                >
                  <button
                    onClick={() => setSelectedPath(path)}
                    className={`w-full h-full p-6 rounded-2xl text-left transition-all ${
                      isSun
                        ? "bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:shadow-xl hover:border-purple-300 hover:-translate-y-1"
                        : "bg-white/5 backdrop-blur-sm border-2 border-white/10 hover:shadow-xl hover:border-purple-400/40 hover:-translate-y-1"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-4xl">{path.emoji}</span>
                      <span
                        className="w-8 h-8 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${path.color}, transparent)` }}
                      />
                    </div>

                    <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                      {path.name}
                    </h3>
                    {path.description && (
                      <p className={`text-sm mt-1 line-clamp-2 font-[family-name:var(--font-quicksand)] ${muted}`}>
                        {path.description}
                      </p>
                    )}

                    <div className={`flex items-center gap-3 mt-4 text-xs font-[family-name:var(--font-quicksand)] ${muted}`}>
                      <span>{path.knowledge_nodes.length} nodes</span>
                      <span>{pct}% complete</span>
                    </div>

                    {/* Progress bar */}
                    <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                      />
                    </div>
                  </button>

                  {/* Hover actions */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditPath(e, path)}
                      className={`p-2 rounded-lg transition-colors ${
                        isSun ? "bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600" : "bg-white/10 text-slate-400 hover:bg-purple-500/20 hover:text-purple-300"
                      }`}
                      title="Edit path"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button
                      onClick={(e) => handleDeletePath(e, path.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete path"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <TravelerHotbar />
    </main>
  );
}
