"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Flame,
  TrendingUp,
  Calendar,
  Target,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import Skeleton from "@/components/ui/Skeleton";
import StreakCalendar from "@/components/report/StreakCalendar";
import StudyChart from "@/components/report/StudyChart";

interface WeeklyStats {
  totalMinutes: number;
  sessionCount: number;
  avgSessionLength: number;
  xpEarned: number;
  streakDays: number;
  activeDays: number;
  mostActiveDay: string;
  activitiesByType: Record<string, number>;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  delay?: number;
}) {
  const { card, isSun } = useCardStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${card} p-4`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
      >
        {icon}
      </div>
      <p
        className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
          isSun ? "text-slate-800" : "text-white"
        }`}
      >
        {value}
      </p>
      <p
        className={`text-xs font-[family-name:var(--font-quicksand)] ${
          isSun ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      {subtext && (
        <p
          className={`text-xs mt-1 ${
            isSun ? "text-emerald-600" : "text-emerald-400"
          }`}
        >
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

function ActivityBar({
  day,
  count,
  maxCount,
  isSun,
}: {
  day: string;
  count: number;
  maxCount: number;
  isSun: boolean;
}) {
  const height = maxCount > 0 ? Math.max((count / maxCount) * 100, 4) : 4;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-8 h-24 rounded-lg overflow-hidden flex items-end"
        style={{
          background: isSun ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
        }}
      >
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          className="w-full rounded-lg bg-gradient-to-t from-purple-500 to-indigo-400"
        />
      </div>
      <span
        className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}
      >
        {day}
      </span>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { card, isSun, muted: mutedText } = useCardStyles();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [dailyCounts, setDailyCounts] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchWeeklyData() {
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weekStart = startOfWeek.toISOString();

      // Fetch focus sessions this week (uses completed_at column)
      const { data: sessions } = await supabase
        .from("focus_sessions")
        .select("duration_minutes, completed_at")
        .eq("user_id", user!.id)
        .gte("completed_at", weekStart);

      // Fetch adventure log this week
      const { data: activities } = await supabase
        .from("adventure_log")
        .select("activity_type, xp_earned, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", weekStart);

      const focusSessions = sessions || [];
      const activityLog = activities || [];

      // Calculate total minutes
      const totalMinutes = focusSessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );
      const sessionCount = focusSessions.length;
      const avgSessionLength =
        sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;

      // XP earned this week
      const xpEarned = activityLog.reduce(
        (sum, a) => sum + (a.xp_earned || 0),
        0
      );

      // Activities by type
      const activitiesByType: Record<string, number> = {};
      activityLog.forEach((a) => {
        activitiesByType[a.activity_type] =
          (activitiesByType[a.activity_type] || 0) + 1;
      });

      // Daily activity counts (for bar chart)
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      focusSessions.forEach((item) => {
        const date = new Date(item.completed_at);
        const dayIndex = date.getDay();
        dayCounts[dayIndex]++;
      });
      activityLog.forEach((item) => {
        const date = new Date(item.created_at);
        const dayIndex = date.getDay();
        dayCounts[dayIndex]++;
      });

      // Most active day
      const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
      const activeDays = dayCounts.filter((c) => c > 0).length;

      setDailyCounts(dayCounts);
      setStats({
        totalMinutes,
        sessionCount,
        avgSessionLength,
        xpEarned,
        streakDays: profile?.streak_days ?? 0,
        activeDays,
        mostActiveDay: DAYS[maxDayIndex],
        activitiesByType,
      });
      setIsLoading(false);
    }

    fetchWeeklyData();
  }, [user, profile]);

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (hours === 0) return `${remaining}m`;
    return `${hours}h ${remaining}m`;
  };

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-24 pt-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/")}
              className={`p-2 rounded-xl backdrop-blur-sm border ${
                isSun
                  ? "bg-white/70 border-slate-200 text-slate-600"
                  : "bg-white/10 border-white/20 text-white"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1
                className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                  isSun ? "text-slate-800" : "text-white"
                }`}
              >
                Weekly Report
              </h1>
              <p className={`text-xs ${mutedText}`}>
                Your adventure this week
              </p>
            </div>
          </motion.div>

          {isLoading ? (
            /* Loading skeletons */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`${card} p-4`}>
                    <Skeleton variant="rect" height={40} width={40} />
                    <Skeleton variant="text" width="60%" className="mt-3" />
                    <Skeleton variant="text" width="40%" className="mt-1" />
                  </div>
                ))}
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  icon={<Clock className="w-5 h-5 text-blue-500" />}
                  label="Total Focus Time"
                  value={formatTime(stats.totalMinutes)}
                  color={isSun ? "bg-blue-100" : "bg-blue-500/20"}
                  delay={0.1}
                />
                <StatCard
                  icon={<Target className="w-5 h-5 text-emerald-500" />}
                  label="Focus Sessions"
                  value={stats.sessionCount}
                  subtext={
                    stats.avgSessionLength > 0
                      ? `~${stats.avgSessionLength}m avg`
                      : undefined
                  }
                  color={isSun ? "bg-emerald-100" : "bg-emerald-500/20"}
                  delay={0.15}
                />
                <StatCard
                  icon={<Zap className="w-5 h-5 text-amber-500" />}
                  label="XP Earned"
                  value={`+${stats.xpEarned}`}
                  color={isSun ? "bg-amber-100" : "bg-amber-500/20"}
                  delay={0.2}
                />
                <StatCard
                  icon={<Flame className="w-5 h-5 text-orange-500" />}
                  label="Current Streak"
                  value={`${stats.streakDays}d`}
                  color={isSun ? "bg-orange-100" : "bg-orange-500/20"}
                  delay={0.25}
                />
              </div>

              {/* Weekly Activity Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`${card} p-5 mb-4`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar
                    className={`w-5 h-5 ${
                      isSun ? "text-purple-600" : "text-purple-400"
                    }`}
                  />
                  <h2
                    className={`text-base font-bold font-[family-name:var(--font-nunito)] ${
                      isSun ? "text-slate-800" : "text-white"
                    }`}
                  >
                    Daily Activity
                  </h2>
                </div>
                <div className="flex items-end justify-between px-2">
                  {DAYS.map((day, i) => (
                    <ActivityBar
                      key={day}
                      day={day}
                      count={dailyCounts[i]}
                      maxCount={Math.max(...dailyCounts)}
                      isSun={isSun}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className={`text-xs ${mutedText}`}>
                    {stats.activeDays}/7 active days
                  </p>
                  <p className={`text-xs ${mutedText}`}>
                    Most active: {stats.mostActiveDay}
                  </p>
                </div>
              </motion.div>

              {/* Activity Breakdown */}
              {Object.keys(stats.activitiesByType).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`${card} p-5 mb-4`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp
                      className={`w-5 h-5 ${
                        isSun ? "text-cyan-600" : "text-cyan-400"
                      }`}
                    />
                    <h2
                      className={`text-base font-bold font-[family-name:var(--font-nunito)] ${
                        isSun ? "text-slate-800" : "text-white"
                      }`}
                    >
                      Activity Breakdown
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(stats.activitiesByType).map(
                      ([type, count]) => {
                        const total = Object.values(
                          stats.activitiesByType
                        ).reduce((a, b) => a + b, 0);
                        const pct = Math.round((count / total) * 100);
                        const label =
                          type.charAt(0).toUpperCase() +
                          type.slice(1).replace(/_/g, " ");
                        return (
                          <div key={type}>
                            <div className="flex justify-between mb-1">
                              <span
                                className={`text-xs font-medium ${
                                  isSun ? "text-slate-600" : "text-slate-300"
                                }`}
                              >
                                {label}
                              </span>
                              <span className={`text-xs ${mutedText}`}>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div
                              className={`h-2 rounded-full overflow-hidden ${
                                isSun ? "bg-slate-100" : "bg-white/10"
                              }`}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400"
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </motion.div>
              )}

              {/* Encouragement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`${card} p-5 text-center`}
              >
                <div className="text-3xl mb-2">
                  {stats.totalMinutes >= 300
                    ? "\u{1F3C6}"
                    : stats.totalMinutes >= 120
                    ? "\u2B50"
                    : stats.totalMinutes > 0
                    ? "\u{1F331}"
                    : "\u{1F989}"}
                </div>
                <p
                  className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-700" : "text-white"
                  }`}
                >
                  {stats.totalMinutes >= 300
                    ? "Legendary Week!"
                    : stats.totalMinutes >= 120
                    ? "Great Progress!"
                    : stats.totalMinutes > 0
                    ? "Good Start!"
                    : "Your adventure awaits!"}
                </p>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  {stats.totalMinutes >= 300
                    ? "You studied over 5 hours this week. A true scholar!"
                    : stats.totalMinutes >= 120
                    ? "Over 2 hours of focused study. Keep it up!"
                    : stats.totalMinutes > 0
                    ? "Every journey begins with a single step."
                    : "Start your first focus session to see stats here."}
                </p>
              </motion.div>

              {/* Activity Breakdown Donut Chart */}
              {stats.activitiesByType && Object.keys(stats.activitiesByType).length > 0 && (
                <StudyChart
                  type="donut"
                  title="📊 Activity Breakdown"
                  data={Object.entries(stats.activitiesByType).map(([type, count], i) => ({
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    value: count as number,
                    color: [
                      '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444',
                      '#10b981', '#ec4899', '#6366f1', '#14b8a6',
                    ][i % 8],
                  }))}
                  unit=""
                />
              )}

              {/* 365-Day Streak Calendar */}
              <StreakCalendar
                studyData={((): Record<string, number> => {
                  // Build study data from daily counts
                  const result: Record<string, number> = {};
                  const today = new Date();
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - (today.getDay() - (6 - i)));
                    result[d.toISOString().split('T')[0]] = (dailyCounts[6 - i] || 0) / 60;
                  }
                  return result;
                })()}
              />
            </>
          ) : null}
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}
