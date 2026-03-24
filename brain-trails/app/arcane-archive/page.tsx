// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, GraduationCap, Plus, Sparkles, Scroll, Map } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface Subject {
  id: string;
  name: string;
  emoji: string;
  topics: { id: string; name: string; is_completed: boolean }[];
  _count?: {
    notes: number;
    decks: number;
  };
}

/**
 * Arcane Archive - Main Hub
 * Lists all subjects from the user's active syllabus
 */
export default function ArcaneArchivePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const mapRef = useRef<HTMLDivElement>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [semesterName, setSemesterName] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSubjects = async () => {
      // Get active semester
      const { data: semData } = await (supabase.from("semesters") as any)
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!semData) {
        setIsLoading(false);
        return;
      }

      setSemesterName(semData.name);

      // Get subjects with topics
      const { data: subData } = await (supabase.from("subjects") as any)
        .select(`
          id, name, emoji,
          topics ( id, name, is_completed )
        `)
        .eq("semester_id", semData.id)
        .order("name");

      if (subData) {
        // Get counts for notes and decks per subject
        const subjectIds = subData.map((s: Subject) => s.id);
        
        const [{ data: noteCounts }, { data: deckCounts }] = await Promise.all([
          (supabase.from("notes") as any)
            .select("subject_id")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
          (supabase.from("decks") as any)
            .select("subject_id")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
        ]);

        const enriched = subData.map((s: Subject) => ({
          ...s,
          _count: {
            notes: (noteCounts ?? []).filter((n: { subject_id: string }) => n.subject_id === s.id).length,
            decks: (deckCounts ?? []).filter((d: { subject_id: string }) => d.subject_id === s.id).length,
          },
        }));

        setSubjects(enriched);
      }
      setIsLoading(false);
    };

    fetchSubjects();
  }, [user]);

  const glassCard = isSun
    ? "bg-white/40 border border-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  // Calculate positions for skill tree nodes in a proper branching pattern
  const getNodePosition = (index: number, total: number) => {
    // Create a more organic skill tree layout based on levels
    // Root at top, branches spread out below
    
    if (total === 1) return { x: 50, y: 50 };
    if (total === 2) return index === 0 ? { x: 35, y: 40 } : { x: 65, y: 60 };
    if (total === 3) {
      if (index === 0) return { x: 50, y: 30 };
      return index === 1 ? { x: 30, y: 65 } : { x: 70, y: 65 };
    }
    if (total === 4) {
      if (index === 0) return { x: 50, y: 25 };
      if (index === 1) return { x: 25, y: 55 };
      if (index === 2) return { x: 75, y: 55 };
      return { x: 50, y: 75 };
    }
    if (total === 5) {
      if (index === 0) return { x: 50, y: 20 };
      if (index === 1) return { x: 20, y: 50 };
      if (index === 2) return { x: 50, y: 50 };
      if (index === 3) return { x: 80, y: 50 };
      return { x: 50, y: 75 };
    }
    
    // For 6+ subjects, use a pyramid/tree structure
    const levels = Math.ceil(Math.sqrt(total * 1.5));
    let level = 0;
    let posInLevel = index;
    let nodesInPrevLevels = 0;
    
    // Determine which level this node is on
    for (let l = 1; l <= levels; l++) {
      const nodesInLevel = Math.min(l + 1, total - nodesInPrevLevels);
      if (posInLevel < nodesInLevel) {
        level = l;
        break;
      }
      posInLevel -= nodesInLevel;
      nodesInPrevLevels += nodesInLevel;
    }
    
    const nodesInCurrentLevel = Math.min(level + 1, total - nodesInPrevLevels + (posInLevel + 1));
    const x = ((posInLevel + 1) / (nodesInCurrentLevel + 1)) * 100;
    const y = ((level + 0.5) / (levels + 1)) * 100;
    
    return { x, y };
  };

  // Generate connections between nodes in a tree pattern
  const getConnections = () => {
    if (subjects.length <= 1) return [];
    
    const connections = [];
    
    // Create branching connections instead of linear
    // Root node (0) connects to multiple children
    if (subjects.length === 2) {
      connections.push({ 
        from: getNodePosition(0, subjects.length), 
        to: getNodePosition(1, subjects.length), 
        id: '0-1' 
      });
    } else if (subjects.length === 3) {
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(1, subjects.length), id: '0-1' });
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(2, subjects.length), id: '0-2' });
    } else if (subjects.length === 4) {
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(1, subjects.length), id: '0-1' });
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(2, subjects.length), id: '0-2' });
      connections.push({ from: getNodePosition(1, subjects.length), to: getNodePosition(3, subjects.length), id: '1-3' });
      connections.push({ from: getNodePosition(2, subjects.length), to: getNodePosition(3, subjects.length), id: '2-3' });
    } else if (subjects.length === 5) {
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(1, subjects.length), id: '0-1' });
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(2, subjects.length), id: '0-2' });
      connections.push({ from: getNodePosition(0, subjects.length), to: getNodePosition(3, subjects.length), id: '0-3' });
      connections.push({ from: getNodePosition(2, subjects.length), to: getNodePosition(4, subjects.length), id: '2-4' });
    } else {
      // For 6+ subjects, connect each node to the next 2 nodes
      for (let i = 0; i < subjects.length - 1; i++) {
        const from = getNodePosition(i, subjects.length);
        const to1 = getNodePosition(i + 1, subjects.length);
        connections.push({ from, to: to1, id: `${i}-${i + 1}` });
        
        // Add second connection for branching effect
        if (i + 2 < subjects.length && i < Math.floor(subjects.length / 2)) {
          const to2 = getNodePosition(i + 2, subjects.length);
          connections.push({ from, to: to2, id: `${i}-${i + 2}` });
        }
      }
    }
    
    return connections;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      {/* Parchment Header with Scroll Styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative"
      >
        <div className={`${glassCard} rounded-2xl p-6 border-2 ${
          isSun ? "border-amber-200/80" : "border-amber-900/30"
        } shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isSun ? "bg-gradient-to-br from-amber-100 to-orange-100" : "bg-gradient-to-br from-amber-900/40 to-orange-900/40"
            }`}>
              <Map className={`w-7 h-7 ${isSun ? "text-amber-700" : "text-amber-400"}`} />
            </div>
            <div className="flex-1">
              <h1 className={`text-4xl font-bold font-[family-name:var(--font-cinzel)] ${
                isSun ? "text-amber-900" : "text-amber-200"
              }`}>
                Arcane Archive
              </h1>
              {semesterName && (
                <p className={`text-sm mt-1 ${isSun ? "text-amber-700/80" : "text-amber-300/70"} font-[family-name:var(--font-nunito)]`}>
                  {semesterName} - Chart your path through the realms of knowledge
                </p>
              )}
            </div>
            <Scroll className={`w-6 h-6 ${isSun ? "text-amber-400" : "text-amber-600/50"}`} />
          </div>
        </div>
      </motion.div>

      {/* Parchment Map Container */}
      {subjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${glassCard} rounded-3xl p-12 text-center border-2 ${
            isSun ? "border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40" : "border-amber-900/30 bg-gradient-to-br from-amber-950/20 to-orange-950/10"
          }`}
        >
          <GraduationCap className={`w-16 h-16 mx-auto mb-4 ${isSun ? "text-amber-300" : "text-amber-800/60"}`} />
          <h2 className={`text-xl font-bold mb-2 font-[family-name:var(--font-cinzel)] ${isSun ? "text-amber-800" : "text-amber-200"}`}>
            The Archive Awaits
          </h2>
          <p className={`mb-6 ${isSun ? "text-amber-700" : "text-amber-300/80"}`}>
            Create a syllabus to chart your academic journey and unlock the arcane paths
          </p>
          <Link
            href="/onboarding"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              isSun
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                : "bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-700 hover:to-orange-800"
            }`}
          >
            <Plus className="w-5 h-5" />
            Begin Your Journey
          </Link>
        </motion.div>
      ) : (
        <div 
          ref={mapRef}
          className={`relative ${glassCard} rounded-3xl p-8 md:p-12 border-2 overflow-hidden ${
            isSun 
              ? "border-amber-200/80" 
              : "border-amber-900/30"
          }`}
          style={{
            minHeight: "600px",
            background: isSun 
              ? `linear-gradient(135deg, 
                  rgba(254, 252, 232, 0.95) 0%, 
                  rgba(252, 231, 203, 0.95) 25%, 
                  rgba(254, 249, 231, 0.95) 50%, 
                  rgba(251, 228, 197, 0.95) 75%, 
                  rgba(254, 252, 232, 0.95) 100%),
                 repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 92, 46, 0.03) 2px, rgba(139, 92, 46, 0.03) 4px),
                 repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 92, 46, 0.03) 2px, rgba(139, 92, 46, 0.03) 4px)`
              : `linear-gradient(135deg, 
                  rgba(28, 25, 23, 0.95) 0%, 
                  rgba(41, 37, 36, 0.95) 25%, 
                  rgba(32, 29, 27, 0.95) 50%, 
                  rgba(38, 35, 33, 0.95) 75%, 
                  rgba(28, 25, 23, 0.95) 100%),
                 repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120, 82, 46, 0.08) 2px, rgba(120, 82, 46, 0.08) 4px),
                 repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(120, 82, 46, 0.08) 2px, rgba(120, 82, 46, 0.08) 4px)`
          }}
        >
          {/* Decorative Scroll Elements */}
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent to-transparent pointer-events-none opacity-30">
            <div className={`absolute top-4 left-8 w-16 h-16 rounded-full ${
              isSun ? "bg-amber-300/20" : "bg-amber-700/10"
            } blur-xl`} />
            <div className={`absolute top-6 right-12 w-20 h-20 rounded-full ${
              isSun ? "bg-orange-300/20" : "bg-orange-700/10"
            } blur-xl`} />
          </div>

          {/* SVG for Skill Tree Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isSun ? "#f59e0b" : "#92400e"} stopOpacity="0.4" />
                <stop offset="100%" stopColor={isSun ? "#ea580c" : "#7c2d12"} stopOpacity="0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {getConnections().map((conn) => {
              // Create curved path instead of straight line
              const midX = (conn.from.x + conn.to.x) / 2;
              const midY = (conn.from.y + conn.to.y) / 2;
              const controlY = midY - Math.abs(conn.to.y - conn.from.y) * 0.2; // Curve upward slightly
              
              return (
                <motion.path
                  key={conn.id}
                  d={`M ${conn.from.x}% ${conn.from.y}% Q ${midX}% ${controlY}% ${conn.to.x}% ${conn.to.y}%`}
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8 4"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              );
            })}
          </svg>

          {/* Skill Tree Nodes */}
          <div className="relative" style={{ zIndex: 1 }}>
            {subjects.map((subject, i) => {
              const pos = getNodePosition(i, subjects.length);
              const completedTopics = subject.topics.filter(t => t.is_completed).length;
              const totalTopics = subject.topics.length;
              const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
              const isHovered = hoveredNode === subject.id;

              return (
                <motion.div
                  key={subject.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
                  className="absolute"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredNode(subject.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <Link href={`/arcane-archive/${subject.id}`}>
                    <motion.div
                      className={`relative ${glassCard} rounded-2xl p-5 border-2 transition-all cursor-pointer shadow-lg ${
                        isSun 
                          ? "border-amber-300/60 hover:border-amber-400 hover:shadow-amber-200/50" 
                          : "border-amber-800/40 hover:border-amber-600 hover:shadow-amber-900/80"
                      }`}
                      style={{ minWidth: "200px", maxWidth: "240px" }}
                      whileHover={{ scale: 1.08, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Glow Effect on Hover */}
                      {isHovered && (
                        <motion.div
                          className={`absolute -inset-2 rounded-3xl blur-lg -z-10 ${
                            isSun ? "bg-amber-300/40" : "bg-amber-600/30"
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}

                      {/* Subject Icon & Name */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`text-4xl filter drop-shadow-lg ${
                          progress === 100 ? "animate-pulse" : ""
                        }`}>
                          {subject.emoji || "📚"}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-base font-bold font-[family-name:var(--font-cinzel)] leading-tight ${
                            isSun ? "text-amber-900" : "text-amber-100"
                          }`}>
                            {subject.name}
                          </h3>
                          <p className={`text-xs mt-0.5 ${isSun ? "text-amber-700/70" : "text-amber-300/60"}`}>
                            {totalTopics} chapters
                          </p>
                        </div>
                      </div>

                      {/* Progress Ring */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${isSun ? "text-amber-700" : "text-amber-300"}`}>
                            Mastery
                          </span>
                          <span className={`text-xs font-bold ${isSun ? "text-amber-900" : "text-amber-100"}`}>
                            {progress}%
                          </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${
                          isSun ? "bg-amber-200/50" : "bg-amber-950/50"
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                            className={`h-full rounded-full bg-gradient-to-r ${
                              isSun 
                                ? "from-amber-400 to-orange-500" 
                                : "from-amber-600 to-orange-700"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-3 text-xs">
                        <div className={`flex items-center gap-1 ${isSun ? "text-amber-700" : "text-amber-300/80"}`}>
                          <Sparkles className="w-3 h-3" />
                          <span>{subject._count?.notes || 0}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${isSun ? "text-amber-700" : "text-amber-300/80"}`}>
                          <Brain className="w-3 h-3" />
                          <span>{subject._count?.decks || 0}</span>
                        </div>
                      </div>

                      {/* Completion Badge */}
                      {progress === 100 && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                            isSun 
                              ? "bg-gradient-to-br from-green-400 to-emerald-500" 
                              : "bg-gradient-to-br from-green-600 to-emerald-700"
                          } shadow-lg border-2 ${isSun ? "border-white" : "border-slate-900"}`}
                        >
                          <span className="text-white text-sm">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Decorative Bottom Scroll Elements */}
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-transparent to-transparent pointer-events-none opacity-20">
            <div className={`absolute bottom-4 left-16 w-24 h-24 rounded-full ${
              isSun ? "bg-amber-400/20" : "bg-amber-800/10"
            } blur-2xl`} />
          </div>
        </div>
      )}
    </div>
  );
}
