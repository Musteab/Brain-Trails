// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Brain, GraduationCap, Plus, Sparkles, Scroll, Map, 
  Table, GitBranch, Search, Filter, ChevronDown, ChevronRight,
  Book, Layers, Clock, Trophy, Star, Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import WizardsDeskLayout from "@/components/layout/WizardsDeskLayout";

interface Topic {
  id: string;
  name: string;
  is_completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  emoji: string;
  topics: Topic[];
  _count?: {
    notes: number;
    decks: number;
  };
  mastery?: number;
  total_study_time?: number;
  last_studied?: string;
}

type ViewMode = "tree" | "table";

/**
 * Arcane Archive - Enhanced Main Hub
 * 
 * Features:
 * 1. Skill Tree View - Interactive node-based visualization
 * 2. Table View - Sortable data table with all subject details
 * 3. Search & Filter capabilities
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
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "mastery" | "notes" | "decks">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

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
        
        const [{ data: noteCounts }, { data: deckCounts }, { data: focusSessions }] = await Promise.all([
          (supabase.from("notes") as any)
            .select("subject_id")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
          (supabase.from("decks") as any)
            .select("subject_id")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
          (supabase.from("focus_sessions") as any)
            .select("subject_id, duration_minutes, created_at")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
        ]);

        const enriched = subData.map((s: Subject) => {
          const completedTopics = s.topics.filter(t => t.is_completed).length;
          const totalTopics = s.topics.length;
          const subjectSessions = (focusSessions ?? []).filter((f: any) => f.subject_id === s.id);
          const totalStudyTime = subjectSessions.reduce((acc: number, f: any) => acc + (f.duration_minutes || 0), 0);
          const lastStudied = subjectSessions.length > 0 
            ? subjectSessions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
            : null;

          return {
            ...s,
            _count: {
              notes: (noteCounts ?? []).filter((n: { subject_id: string }) => n.subject_id === s.id).length,
              decks: (deckCounts ?? []).filter((d: { subject_id: string }) => d.subject_id === s.id).length,
            },
            mastery: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
            total_study_time: totalStudyTime,
            last_studied: lastStudied,
          };
        });

        setSubjects(enriched);
      }
      setIsLoading(false);
    };

    fetchSubjects();
  }, [user]);

  // Filter and sort subjects
  const filteredSubjects = useMemo(() => {
    let result = [...subjects];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.topics.some(t => t.name.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "mastery":
          comparison = (a.mastery || 0) - (b.mastery || 0);
          break;
        case "notes":
          comparison = (a._count?.notes || 0) - (b._count?.notes || 0);
          break;
        case "decks":
          comparison = (a._count?.decks || 0) - (b._count?.decks || 0);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
    
    return result;
  }, [subjects, searchQuery, sortBy, sortAsc]);

  const glassCard = isSun
    ? "bg-white/40 border border-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  // Calculate positions for skill tree nodes
  const getNodePosition = (index: number, total: number) => {
    if (total === 1) return { x: 50, y: 50, level: 0 };
    if (total === 2) return index === 0 ? { x: 35, y: 40, level: 0 } : { x: 65, y: 60, level: 1 };
    
    // Create a proper tree structure with levels
    const levels = Math.ceil(Math.log2(total + 1));
    const nodesPerLevel: number[] = [];
    let remaining = total;
    
    for (let l = 0; l < levels && remaining > 0; l++) {
      const maxAtLevel = Math.pow(2, l);
      const atThisLevel = Math.min(maxAtLevel, remaining);
      nodesPerLevel.push(atThisLevel);
      remaining -= atThisLevel;
    }
    
    // Find which level this node is on
    let level = 0;
    let posInLevel = index;
    let cumulative = 0;
    
    for (let l = 0; l < nodesPerLevel.length; l++) {
      if (index < cumulative + nodesPerLevel[l]) {
        level = l;
        posInLevel = index - cumulative;
        break;
      }
      cumulative += nodesPerLevel[l];
    }
    
    const nodesAtLevel = nodesPerLevel[level] || 1;
    const x = ((posInLevel + 0.5) / nodesAtLevel) * 80 + 10;
    const y = ((level + 0.5) / (nodesPerLevel.length)) * 80 + 10;
    
    return { x, y, level };
  };

  // Generate tree connections
  const getConnections = () => {
    if (filteredSubjects.length <= 1) return [];
    
    const connections: { from: any; to: any; id: string }[] = [];
    const positions = filteredSubjects.map((_, i) => getNodePosition(i, filteredSubjects.length));
    
    // Connect nodes in a tree pattern
    for (let i = 0; i < filteredSubjects.length; i++) {
      const pos = positions[i];
      
      // Connect to children (nodes at next level)
      const childIndex1 = i * 2 + 1;
      const childIndex2 = i * 2 + 2;
      
      if (childIndex1 < filteredSubjects.length) {
        connections.push({
          from: pos,
          to: positions[childIndex1],
          id: `${i}-${childIndex1}`,
        });
      }
      if (childIndex2 < filteredSubjects.length) {
        connections.push({
          from: pos,
          to: positions[childIndex2],
          id: `${i}-${childIndex2}`,
        });
      }
    }
    
    return connections;
  };

  const toggleSubjectExpand = (id: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubjects(newExpanded);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  if (isLoading) {
    return (
      <WizardsDeskLayout showPlaque={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </WizardsDeskLayout>
    );
  }

  return (
    <WizardsDeskLayout showPlaque={false}>
      <div className="max-w-7xl mx-auto px-6 py-12 pb-24">
      {/* Parchment Header with Scroll Styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className={`${glassCard} rounded-2xl p-6 border-2 ${
          isSun ? "border-amber-200/80" : "border-amber-900/30"
        } shadow-lg`}>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={`p-3 rounded-xl ${
                isSun ? "bg-gradient-to-br from-amber-100 to-orange-100" : "bg-gradient-to-br from-amber-900/40 to-orange-900/40"
              }`}>
                <Map className={`w-7 h-7 ${isSun ? "text-amber-700" : "text-amber-400"}`} />
              </div>
              <div className="flex-1">
                <h1 className={`text-3xl md:text-4xl font-bold font-[family-name:var(--font-cinzel)] ${
                  isSun ? "text-amber-900" : "text-amber-200"
                }`}>
                  Arcane Archive
                </h1>
                {semesterName && (
                  <p className={`text-sm mt-1 ${isSun ? "text-amber-700/80" : "text-amber-300/70"}`}>
                    {semesterName} - Chart your path through the realms of knowledge
                  </p>
                )}
              </div>
            </div>

            {/* View Toggle & Search */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className={`relative ${isSun ? "text-amber-800" : "text-amber-200"}`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-xl text-sm ${
                    isSun 
                      ? "bg-white/60 border border-amber-200 placeholder:text-amber-400" 
                      : "bg-white/10 border border-amber-800/30 placeholder:text-amber-500/50"
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                />
              </div>

              {/* View Toggle */}
              <div className={`flex rounded-xl overflow-hidden border ${
                isSun ? "border-amber-200 bg-white/40" : "border-amber-800/30 bg-white/5"
              }`}>
                <button
                  onClick={() => setViewMode("tree")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === "tree"
                      ? isSun ? "bg-amber-500 text-white" : "bg-amber-600 text-white"
                      : isSun ? "text-amber-700 hover:bg-amber-100" : "text-amber-300 hover:bg-white/10"
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Skill Tree
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === "table"
                      ? isSun ? "bg-amber-500 text-white" : "bg-amber-600 text-white"
                      : isSun ? "text-amber-700 hover:bg-amber-100" : "text-amber-300 hover:bg-white/10"
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Data Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredSubjects.length === 0 && !searchQuery ? (
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
            Create a syllabus to chart your academic journey
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
      ) : viewMode === "tree" ? (
        /* ═══════════════════════════════════════════════════════════════
           SKILL TREE VIEW
           ═══════════════════════════════════════════════════════════════ */
        <motion.div 
          ref={mapRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`relative ${glassCard} rounded-3xl p-8 md:p-12 border-2 overflow-hidden ${
            isSun ? "border-amber-200/80" : "border-amber-900/30"
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
                 repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 92, 46, 0.03) 2px, rgba(139, 92, 46, 0.03) 4px)`
              : `linear-gradient(135deg, 
                  rgba(28, 25, 23, 0.95) 0%, 
                  rgba(41, 37, 36, 0.95) 25%, 
                  rgba(32, 29, 27, 0.95) 50%, 
                  rgba(38, 35, 33, 0.95) 75%, 
                  rgba(28, 25, 23, 0.95) 100%),
                 repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120, 82, 46, 0.08) 2px, rgba(120, 82, 46, 0.08) 4px)`
          }}
        >
          {/* SVG Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="manaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isSun ? "#f59e0b" : "#92400e"} stopOpacity="0.6" />
                <stop offset="50%" stopColor={isSun ? "#fbbf24" : "#b45309"} stopOpacity="0.8" />
                <stop offset="100%" stopColor={isSun ? "#f59e0b" : "#92400e"} stopOpacity="0.6" />
              </linearGradient>
              <filter id="glowFilter">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {getConnections().map((conn) => {
              const midX = (conn.from.x + conn.to.x) / 2;
              const midY = (conn.from.y + conn.to.y) / 2;
              const controlY = midY - 5;
              
              return (
                <motion.path
                  key={conn.id}
                  d={`M ${conn.from.x}% ${conn.from.y}% Q ${midX}% ${controlY}% ${conn.to.x}% ${conn.to.y}%`}
                  stroke="url(#manaGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="12 6"
                  filter="url(#glowFilter)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
              );
            })}
          </svg>

          {/* Skill Tree Nodes */}
          <div className="relative" style={{ zIndex: 1, minHeight: "500px" }}>
            {filteredSubjects.map((subject, i) => {
              const pos = getNodePosition(i, filteredSubjects.length);
              const isHovered = hoveredNode === subject.id;
              const progress = subject.mastery || 0;

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
                      className="relative"
                      whileHover={{ scale: 1.1, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Hexagonal Node */}
                      <div
                        className={`relative w-28 h-28 ${
                          progress === 100 ? "animate-pulse" : ""
                        }`}
                        style={{
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                          background: isSun 
                            ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)"
                            : "linear-gradient(135deg, #292524 0%, #44403c 50%, #57534e 100%)",
                          boxShadow: isHovered 
                            ? `0 0 30px ${isSun ? "rgba(245, 158, 11, 0.5)" : "rgba(217, 119, 6, 0.5)"}`
                            : "none",
                        }}
                      >
                        {/* Inner content */}
                        <div className="absolute inset-2 flex flex-col items-center justify-center"
                          style={{
                            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            background: isSun
                              ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                              : "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
                          }}
                        >
                          <span className="text-3xl mb-1">{subject.emoji || "📚"}</span>
                          <span className={`text-[10px] font-bold text-center leading-tight px-1 ${
                            isSun ? "text-amber-800" : "text-amber-200"
                          }`}>
                            {subject.name.length > 12 ? subject.name.slice(0, 12) + "..." : subject.name}
                          </span>
                        </div>

                        {/* Progress ring */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke={isSun ? "#fde68a" : "#44403c"}
                            strokeWidth="4"
                          />
                          <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke={isSun ? "#f59e0b" : "#d97706"}
                            strokeWidth="4"
                            strokeDasharray={`${progress * 2.83} 283`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" }}
                          />
                        </svg>
                      </div>

                      {/* Level badge */}
                      <div 
                        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSun 
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" 
                            : "bg-gradient-to-br from-amber-600 to-orange-700 text-white"
                        }`}
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                      >
                        {progress}%
                      </div>

                      {/* Completion badge */}
                      {progress === 100 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSun ? "bg-green-500 text-white" : "bg-green-600 text-white"
                          }`}
                        >
                          MASTERED
                        </motion.div>
                      )}
                    </motion.div>
                  </Link>

                  {/* Hover tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-4 z-50"
                      >
                        <div className={`${glassCard} rounded-xl p-4 min-w-[200px] border-2 ${
                          isSun ? "border-amber-300" : "border-amber-700"
                        }`}>
                          <h4 className={`font-bold mb-2 ${isSun ? "text-amber-900" : "text-amber-100"}`}>
                            {subject.name}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={isSun ? "text-amber-700" : "text-amber-300"}>
                              <Book className="w-3 h-3 inline mr-1" />
                              {subject._count?.notes || 0} Notes
                            </div>
                            <div className={isSun ? "text-amber-700" : "text-amber-300"}>
                              <Layers className="w-3 h-3 inline mr-1" />
                              {subject._count?.decks || 0} Decks
                            </div>
                            <div className={isSun ? "text-amber-700" : "text-amber-300"}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {Math.floor((subject.total_study_time || 0) / 60)}h studied
                            </div>
                            <div className={isSun ? "text-amber-700" : "text-amber-300"}>
                              <Star className="w-3 h-3 inline mr-1" />
                              {subject.topics.length} Topics
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           DATA TABLE VIEW
           ═══════════════════════════════════════════════════════════════ */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${glassCard} rounded-3xl border-2 overflow-hidden ${
            isSun ? "border-amber-200/80" : "border-amber-900/30"
          }`}
        >
          {/* Table Header */}
          <div className={`grid grid-cols-12 gap-4 p-4 border-b ${
            isSun ? "bg-amber-100/50 border-amber-200" : "bg-amber-900/20 border-amber-800/30"
          }`}>
            <button 
              onClick={() => handleSort("name")}
              className={`col-span-4 flex items-center gap-2 font-bold text-sm ${
                isSun ? "text-amber-800" : "text-amber-200"
              } hover:opacity-80 transition-opacity`}
            >
              Subject
              {sortBy === "name" && (sortAsc ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />)}
            </button>
            <button 
              onClick={() => handleSort("mastery")}
              className={`col-span-2 flex items-center gap-2 font-bold text-sm ${
                isSun ? "text-amber-800" : "text-amber-200"
              } hover:opacity-80 transition-opacity`}
            >
              Mastery
              {sortBy === "mastery" && (sortAsc ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />)}
            </button>
            <button 
              onClick={() => handleSort("notes")}
              className={`col-span-2 flex items-center gap-2 font-bold text-sm ${
                isSun ? "text-amber-800" : "text-amber-200"
              } hover:opacity-80 transition-opacity`}
            >
              Notes
              {sortBy === "notes" && (sortAsc ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />)}
            </button>
            <button 
              onClick={() => handleSort("decks")}
              className={`col-span-2 flex items-center gap-2 font-bold text-sm ${
                isSun ? "text-amber-800" : "text-amber-200"
              } hover:opacity-80 transition-opacity`}
            >
              Decks
              {sortBy === "decks" && (sortAsc ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />)}
            </button>
            <div className={`col-span-2 font-bold text-sm ${isSun ? "text-amber-800" : "text-amber-200"}`}>
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-amber-200/20">
            {filteredSubjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Main Row */}
                <div className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                  isSun ? "hover:bg-amber-50/50" : "hover:bg-white/5"
                }`}>
                  {/* Subject Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <button
                      onClick={() => toggleSubjectExpand(subject.id)}
                      className={`p-1 rounded transition-colors ${
                        isSun ? "hover:bg-amber-100" : "hover:bg-white/10"
                      }`}
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        expandedSubjects.has(subject.id) ? "rotate-90" : ""
                      } ${isSun ? "text-amber-600" : "text-amber-400"}`} />
                    </button>
                    <span className="text-2xl">{subject.emoji || "📚"}</span>
                    <div>
                      <Link 
                        href={`/arcane-archive/${subject.id}`}
                        className={`font-bold hover:underline ${isSun ? "text-amber-900" : "text-amber-100"}`}
                      >
                        {subject.name}
                      </Link>
                      <p className={`text-xs ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                        {subject.topics.length} chapters
                      </p>
                    </div>
                  </div>

                  {/* Mastery */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                        isSun ? "bg-amber-200" : "bg-amber-900/50"
                      }`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.mastery}%` }}
                          className={`h-full rounded-full ${
                            (subject.mastery || 0) === 100
                              ? "bg-gradient-to-r from-green-400 to-emerald-500"
                              : "bg-gradient-to-r from-amber-400 to-orange-500"
                          }`}
                        />
                      </div>
                      <span className={`text-sm font-bold min-w-[40px] ${
                        isSun ? "text-amber-800" : "text-amber-200"
                      }`}>
                        {subject.mastery}%
                      </span>
                    </div>
                  </div>

                  {/* Notes Count */}
                  <div className="col-span-2">
                    <div className={`flex items-center gap-2 ${isSun ? "text-amber-700" : "text-amber-300"}`}>
                      <Book className="w-4 h-4" />
                      <span className="font-medium">{subject._count?.notes || 0}</span>
                    </div>
                  </div>

                  {/* Decks Count */}
                  <div className="col-span-2">
                    <div className={`flex items-center gap-2 ${isSun ? "text-amber-700" : "text-amber-300"}`}>
                      <Layers className="w-4 h-4" />
                      <span className="font-medium">{subject._count?.decks || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex gap-2">
                    <Link
                      href={`/arcane-archive/${subject.id}/spellbook`}
                      className={`p-2 rounded-lg transition-colors ${
                        isSun 
                          ? "bg-blue-100 text-blue-600 hover:bg-blue-200" 
                          : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      }`}
                      title="Open Spellbook"
                    >
                      <Book className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/arcane-archive/${subject.id}/flashcards`}
                      className={`p-2 rounded-lg transition-colors ${
                        isSun 
                          ? "bg-purple-100 text-purple-600 hover:bg-purple-200" 
                          : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      }`}
                      title="Practice Flashcards"
                    >
                      <Brain className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/arcane-archive/${subject.id}/quiz`}
                      className={`p-2 rounded-lg transition-colors ${
                        isSun 
                          ? "bg-amber-100 text-amber-600 hover:bg-amber-200" 
                          : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      }`}
                      title="Take Quiz"
                    >
                      <Zap className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Expanded Topics */}
                <AnimatePresence>
                  {expandedSubjects.has(subject.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`overflow-hidden ${
                        isSun ? "bg-amber-50/30" : "bg-white/[0.02]"
                      }`}
                    >
                      <div className="px-4 py-3 pl-16">
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                          isSun ? "text-amber-600" : "text-amber-500"
                        }`}>
                          Chapters / Topics
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {subject.topics.map((topic) => (
                            <div
                              key={topic.id}
                              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                topic.is_completed
                                  ? isSun ? "bg-green-100 text-green-700" : "bg-green-500/20 text-green-400"
                                  : isSun ? "bg-white/60 text-amber-700" : "bg-white/5 text-amber-300"
                              }`}
                            >
                              {topic.is_completed ? (
                                <Trophy className="w-3 h-3" />
                              ) : (
                                <div className={`w-3 h-3 rounded-full border-2 ${
                                  isSun ? "border-amber-300" : "border-amber-600"
                                }`} />
                              )}
                              <span className="truncate">{topic.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* No results */}
          {filteredSubjects.length === 0 && searchQuery && (
            <div className="p-12 text-center">
              <Search className={`w-12 h-12 mx-auto mb-3 ${isSun ? "text-amber-300" : "text-amber-700"}`} />
              <p className={isSun ? "text-amber-700" : "text-amber-400"}>
                No subjects match &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
        </motion.div>
      )}
      </div>
    </WizardsDeskLayout>
  );
}
