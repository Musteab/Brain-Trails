"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface StreakCalendarProps {
  studyData: Record<string, number>; // { "2025-03-15": 2.5, ... } (hours)
}

export default function StreakCalendar({ studyData }: StreakCalendarProps) {
  const { card, isSun, title: titleStyle, muted } = useCardStyles();

  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const days: { date: string; hours: number; dayOfWeek: number }[] = [];

    // Go back 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: key,
        hours: studyData[key] || 0,
        dayOfWeek: d.getDay(),
      });
    }

    // Group into weeks
    const wks: typeof days[] = [];
    let currentWeek: typeof days = [];
    for (const day of days) {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        wks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) wks.push(currentWeek);

    // Month labels
    const mnths: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < wks.length; w++) {
      const month = new Date(wks[w][0].date).getMonth();
      if (month !== lastMonth) {
        mnths.push({
          label: new Date(wks[w][0].date).toLocaleString("default", { month: "short" }),
          col: w,
        });
        lastMonth = month;
      }
    }

    return { weeks: wks, months: mnths };
  }, [studyData]);

  const getColor = (hours: number): string => {
    if (hours === 0) return isSun ? "#e2e8f0" : "#1e293b";
    if (hours < 0.5) return isSun ? "#c4b5fd" : "#4c1d95";
    if (hours < 1) return isSun ? "#a78bfa" : "#6d28d9";
    if (hours < 2) return isSun ? "#8b5cf6" : "#7c3aed";
    if (hours < 3) return isSun ? "#7c3aed" : "#8b5cf6";
    return isSun ? "#6d28d9" : "#a78bfa";
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className={`${card} p-4`}>
      <h3 className={`text-sm font-bold font-[family-name:var(--font-nunito)] mb-3 ${titleStyle}`}>
        📅 Study Streak Calendar
      </h3>

      {/* Month labels */}
      <div className="flex gap-0 ml-6 mb-1">
        {months.map((m, i) => (
          <span
            key={i}
            className={`text-[10px] ${muted}`}
            style={{ position: "relative", left: m.col * 13 - (i > 0 ? months[i - 1].col * 13 + 26 : 0) }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((label, i) => (
            <span key={i} className={`text-[9px] ${muted} h-[11px] flex items-center`}>
              {label}
            </span>
          ))}
        </div>

        {/* Weeks grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, di) => {
                const day = week.find(d => d.dayOfWeek === di);
                if (!day) {
                  return <div key={di} className="w-[11px] h-[11px]" />;
                }
                return (
                  <motion.div
                    key={di}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: wi * 0.005 + di * 0.01 }}
                    title={`${day.date}: ${day.hours.toFixed(1)}h`}
                    className="w-[11px] h-[11px] rounded-sm cursor-pointer hover:ring-1 hover:ring-purple-400 transition-all"
                    style={{ backgroundColor: getColor(day.hours) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className={`text-[10px] ${muted}`}>Less</span>
        {[0, 0.3, 0.8, 1.5, 2.5, 4].map((h, i) => (
          <div
            key={i}
            className="w-[11px] h-[11px] rounded-sm"
            style={{ backgroundColor: getColor(h) }}
          />
        ))}
        <span className={`text-[10px] ${muted}`}>More</span>
      </div>
    </div>
  );
}
