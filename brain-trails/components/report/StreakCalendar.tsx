"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

interface StreakCalendarProps {
  studyData: Record<string, number>; // { "2025-03-15": 2.5, ... } hours per day
}

const CELL = 11;   // px
const GAP = 3;     // px
const COL = CELL + GAP;
const GUTTER = 26; // px reserved for the weekday labels column

export default function StreakCalendar({ studyData }: StreakCalendarProps) {
  const { card, isSun, title: titleStyle, muted } = useCardStyles();

  const { weeks, months, total, activeDays } = useMemo(() => {
    const today = new Date();
    const days: { date: string; hours: number; dow: number }[] = [];

    // Start 52 weeks back, aligned to the start of that week (Sunday).
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // back up to Sunday

    let total = 0;
    let activeDays = 0;
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = cursor.toISOString().split("T")[0];
      const hours = studyData[key] || 0;
      if (hours > 0) { total += hours; activeDays++; }
      days.push({ date: key, hours, dow: cursor.getDay() });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Columns of 7 (Sun..Sat).
    const wks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) wks.push(days.slice(i, i + 7));

    // Month labels positioned at the week column where the month changes.
    const mnths: { label: string; col: number }[] = [];
    let last = -1;
    wks.forEach((w, col) => {
      const m = new Date(w[0].date).getMonth();
      if (m !== last) {
        mnths.push({ label: new Date(w[0].date).toLocaleString("default", { month: "short" }), col });
        last = m;
      }
    });

    return { weeks: wks, months: mnths, total, activeDays };
  }, [studyData]);

  const getColor = (hours: number): string => {
    if (hours === 0) return isSun ? "#e9edf2" : "#1e293b";
    if (hours < 0.5) return isSun ? "#ddd6fe" : "#4c1d95";
    if (hours < 1) return isSun ? "#c4b5fd" : "#6d28d9";
    if (hours < 2) return isSun ? "#a78bfa" : "#7c3aed";
    if (hours < 3) return isSun ? "#8b5cf6" : "#9333ea";
    return isSun ? "#7c3aed" : "#c4b5fd";
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const gridWidth = weeks.length * COL;

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`flex items-center gap-2 text-sm font-bold font-[family-name:var(--font-nunito)] ${titleStyle}`}>
          <CalendarDays className="w-4 h-4" /> Study activity
        </h3>
        <span className={`text-[11px] ${muted}`}>{activeDays} active days &middot; {Math.round(total)}h total</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: gridWidth + GUTTER }}>
          {/* Month labels */}
          <div className="relative h-4" style={{ marginLeft: GUTTER }}>
            {months.map((m, i) => (
              <span key={i} className={`absolute top-0 text-[10px] ${muted}`} style={{ left: m.col * COL }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Weekday labels + grid */}
          <div className="flex">
            <div className="flex flex-col" style={{ gap: GAP, width: GUTTER }}>
              {dayLabels.map((label, i) => (
                <span key={i} className={`text-[9px] ${muted} flex items-center`} style={{ height: CELL }}>{label}</span>
              ))}
            </div>
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {Array.from({ length: 7 }, (_, di) => {
                    const day = week.find((d) => d.dow === di);
                    if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                    return (
                      <motion.div
                        key={di}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: wi * 0.004 }}
                        title={`${day.date}: ${day.hours.toFixed(1)}h`}
                        className="rounded-sm cursor-pointer hover:ring-1 hover:ring-violet-400 transition-all"
                        style={{ width: CELL, height: CELL, backgroundColor: getColor(day.hours) }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className={`text-[10px] ${muted}`}>Less</span>
        {[0, 0.3, 0.8, 1.5, 2.5, 4].map((h, i) => (
          <div key={i} className="rounded-sm" style={{ width: CELL, height: CELL, backgroundColor: getColor(h) }} />
        ))}
        <span className={`text-[10px] ${muted}`}>More</span>
      </div>
    </div>
  );
}
