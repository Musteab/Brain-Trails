"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import ExamCramMode from "@/components/study/ExamCramMode";

/**
 * Exam Cram - subject-scoped distraction-free study session.
 * Lives under the Codex hub (replaces the retired arcane-archive route).
 */
export default function ExamCramPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = String(params.id);
  const { user } = useAuth();

  const [subjectName, setSubjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchSubject = async () => {
      const { data } = await (supabase.from("subjects") as any)
        .select("name")
        .eq("id", subjectId)
        .single();
      if (data) setSubjectName(data.name);
      setIsLoading(false);
    };

    fetchSubject();
  }, [user, subjectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-purple-600">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <ExamCramMode
      subjectId={subjectId}
      subjectName={subjectName || "Subject"}
      onExit={() => router.push(`/codex/${subjectId}`)}
    />
  );
}
