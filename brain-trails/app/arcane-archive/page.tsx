"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Sparkles, BookMarked, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import ArcaneArchiveMap from "@/components/arcane-archive/ArcaneArchiveMap";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type KnowledgePath = Database["public"]["Tables"]["knowledge_paths"]["Row"];

export default function ArcaneArchivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useUIStore();
  const isSun = theme === "sun";

  const [subjects, setSubjects] = useState<KnowledgePath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [hoveredMapSubject, setHoveredMapSubject] = useState<string | null>(null);

  // Fetch all subjects for the current user
  useEffect(() => {
    if (!user) return;
    
    const fetchSubjects = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase.from("knowledge_paths") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subjects:", error);
        addToast("Failed to load subjects", "error");
      } else {
        setSubjects(data || []);
      }
      setIsLoading(false);
    };

    fetchSubjects();
  }, [user, addToast]);

  const handleCreateSubject = async () => {
    if (!user || !newSubjectName.trim()) {
      addToast("Subject name is required", "error");
      return;
    }

    setIsCreating(true);
    const { data, error } = await (supabase.from("knowledge_paths") as any)
      .insert({
        user_id: user.id,
        name: newSubjectName,
        description: "",
        emoji: "📚",
        color: "from-purple-500 to-indigo-600",
      })
      .select()
      .single();

    if (error) {
      addToast("Failed to create subject", "error");
      console.error(error);
    } else {
      addToast("Subject created!", "success");
      setNewSubjectName("");
      setSubjects([data, ...subjects]);
      // Redirect to the new subject
      if (data) {
        router.push(`/arcane-archive/${data.id}`);
      }
    }
    setIsCreating(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <main className="relative min-h-screen flex flex-col">
      <BackgroundLayer />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
          isSun
            ? "bg-white/70 border-slate-200/50"
            : "bg-slate-900/70 border-slate-700/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              isSun
                ? "hover:bg-slate-100 text-slate-600"
                : "hover:bg-white/10 text-slate-300"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <h1
            className={`text-3xl font-bold font-[family-name:var(--font-nunito)] ${
              isSun ? "text-slate-800" : "text-white"
            }`}
          >
            ✨ Arcane Archive
          </h1>

          <div className="w-20" />
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
        {/* Create New Subject Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className={`rounded-2xl border-2 border-dashed p-8 transition-all ${
            isSun
              ? "border-purple-200 bg-purple-50/50"
              : "border-purple-500/30 bg-purple-500/5"
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <Wand2 className={`w-6 h-6 ${isSun ? "text-purple-600" : "text-purple-400"}`} />
              <h2 className={`text-xl font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
                Begin a New Journey
              </h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateSubject()}
                placeholder="Subject name (e.g., Biology, Calculus, Spanish)..."
                className={`flex-1 px-4 py-2 rounded-lg border outline-none transition-all ${
                  isSun
                    ? "bg-white border-purple-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20"
                    : "bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                }`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateSubject}
                disabled={isCreating || !newSubjectName.trim()}
                className={`px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                  isSun
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                }`}
              >
                {isCreating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Arcane Archive Map */}
        {subjects.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              isSun ? "text-slate-800" : "text-white"
            }`}>
              <Sparkles className="w-6 h-6 text-purple-500" />
              Knowledge Map
            </h2>
            <ArcaneArchiveMap
              subjects={subjects}
              onSubjectHover={setHoveredMapSubject}
            />
          </motion.div>
        )}

        {/* Subjects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-8 h-8 border-3 rounded-full ${
                isSun
                  ? "border-purple-200 border-t-purple-600"
                  : "border-purple-500/20 border-t-purple-400"
              }`}
            />
          </div>
        ) : subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <BookMarked className={`w-16 h-16 mx-auto mb-4 ${
              isSun ? "text-slate-300" : "text-slate-600"
            }`} />
            <h3 className={`text-xl font-bold mb-2 ${
              isSun ? "text-slate-500" : "text-slate-300"
            }`}>
              No subjects yet
            </h3>
            <p className={`text-sm ${isSun ? "text-slate-400" : "text-slate-500"}`}>
              Create your first subject above to begin your magical journey!
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  variants={itemVariants}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/arcane-archive/${subject.id}`)}
                  className={`group rounded-2xl p-6 cursor-pointer transition-all border ${
                    isSun
                      ? "bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-purple-300 hover:shadow-lg"
                      : "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                  }`}
                >
                  {/* Subject Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{subject.emoji || "📚"}</div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      isSun
                        ? "bg-purple-100 text-purple-700"
                        : "bg-purple-500/20 text-purple-300"
                    }`}>
                      Subject
                    </div>
                  </div>

                  {/* Subject Name */}
                  <h3 className={`text-lg font-bold mb-1 group-hover:text-purple-600 transition-colors ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}>
                    {subject.name}
                  </h3>

                  {/* Description */}
                  {subject.description && (
                    <p className={`text-sm mb-4 line-clamp-2 ${
                      isSun ? "text-slate-500" : "text-slate-400"
                    }`}>
                      {subject.description}
                    </p>
                  )}

                  {/* Progress Indicator (placeholder) */}
                  <div className={`mt-4 pt-4 border-t flex gap-3 ${
                    isSun ? "border-slate-200" : "border-slate-700"
                  }`}>
                    <div className="flex-1">
                      <div className={`text-xs font-semibold mb-1 ${
                        isSun ? "text-slate-500" : "text-slate-400"
                      }`}>
                        Progress
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${
                        isSun ? "bg-slate-200" : "bg-slate-700"
                      }`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "45%" }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <TravelerHotbar />
    </main>
  );
}
