"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import ExamCramMode from "@/components/study/ExamCramMode";

/**
 * Exam Cram Mode Route
 * Subject-specific distraction-free study session
 */
export default function ExamCramPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { user } = useAuth();

  const [subjectName, setSubjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchSubject = async () => {
      const { data } = await (supabase.from("subjects") as any)
        .select("name, emoji")
        .eq("id", subjectId)
        .single();

      if (data) {
        setSubjectName(`${data.emoji || "📚"} ${data.name}`);
      }
      setIsLoading(false);
    };

    fetchSubject();
  }, [user, subjectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-purple-600">
        <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ExamCramMode
      subjectId={subjectId}
      subjectName={subjectName || "Subject"}
      onExit={() => router.push(`/arcane-archive/${subjectId}`)}
    />
  );
}
