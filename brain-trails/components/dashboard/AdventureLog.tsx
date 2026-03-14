"use client";

import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { subDays, format, isSameDay } from "date-fns";

// We show about 20 weeks (140 days) to perfectly fit a sidebar component, 
// rather than full 365 days which requires a massive horizontal space.
const DAYS_TO_SHOW = 140;

interface DayData {
  date: Date;
  count: number;
}

const AdventureLog = memo(function AdventureLog() {
  const { card, title, subtitle, isSun } = useCardStyles();
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<DayData[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLog = async () => {
      // Calculate start date (140 days ago)
      const startDate = subDays(new Date(), DAYS_TO_SHOW - 1);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('adventure_log')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (error) {
        console.error("Error fetching adventure log:", error);
        setIsLoading(false);
        return;
      }

      setTotalActivities(data?.length || 0);

      // Build the grid data structure
      const grid: DayData[] = [];
      const today = new Date();
      
      // We process backwards from today to build exactly DAYS_TO_SHOW days
      for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
        const d = subDays(today, i);
        grid.push({ date: d, count: 0 });
      }

      // Populate counts
      (data || []).forEach(log => {
        const logDate = new Date(log.created_at);
        const cell = grid.find(g => isSameDay(g.date, logDate));
        if (cell) {
          cell.count++;
        }
      });

      // Calculate streak
      let streak = 0;
      for (let i = grid.length - 1; i >= 0; i--) {
        if (grid[i].count > 0) {
          streak++;
        } else if (i !== grid.length - 1) {
          // If a past day (not today) has 0, streak is broken
          break;
        }
      }

      setActivityData(grid);
      setCurrentStreak(streak);
      setIsLoading(false);
    };

    fetchLog();
  }, [user]);

  // Heatmap color logic
  const getCellColor = (count: number) => {
    if (count === 0) return isSun ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/5";
    if (count <= 2) return isSun ? "bg-emerald-200 border-emerald-300" : "bg-emerald-900 border-emerald-800";
    if (count <= 4) return isSun ? "bg-emerald-400 border-emerald-500" : "bg-emerald-700 border-emerald-600";
    return isSun ? "bg-emerald-600 border-emerald-700 shadow-md shadow-emerald-500/20" : "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
  };

  // Convert flat array to week columns for GitHub style vertical rendering
  const weeks = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full p-5 ${card}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`text-lg font-bold ${title} font-[family-name:var(--font-nunito)]`}>
            Adventure Log
          </h3>
          <p className={`text-xs ${subtitle} font-[family-name:var(--font-quicksand)]`}>
            {totalActivities.toLocaleString()} quests completed
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSun ? "text-orange-500" : "text-orange-400"}`}>Current Streak</span>
          <div className="flex items-center gap-1">
            <span className="text-xl">🔥</span>
            <span className={`text-xl font-black ${title}`}>{currentStreak}</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
        {isLoading ? (
          <div className="flex gap-[3px] opacity-50 px-1">
            {Array.from({ length: 20 }).map((_, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dIndex) => (
                  <div key={`${wIndex}-${dIndex}`} className={`w-3 h-3 rounded-sm ${isSun ? "bg-slate-200" : "bg-slate-800"} animate-pulse`} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-[3px] min-w-max px-1">
            {weeks.map((week, wIndex) => (
              <motion.div 
                key={wIndex} 
                className="flex flex-col gap-[3px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wIndex * 0.02 }}
              >
                {week.map((day, dIndex) => (
                  <div
                    key={dIndex}
                    title={`${day.count} activities on ${format(day.date, 'MMM do')}`}
                    className={`w-3 h-3 rounded-[3px] border hover:scale-125 transition-transform duration-200 cursor-crosshair z-10 hover:z-20 ${getCellColor(day.count)}`}
                  />
                ))}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className={`text-[10px] ${subtitle}`}>Less</span>
        <div className="flex gap-[3px]">
          <div className={`w-2 h-2 rounded-sm ${getCellColor(0)}`} />
          <div className={`w-2 h-2 rounded-sm ${getCellColor(1)}`} />
          <div className={`w-2 h-2 rounded-sm ${getCellColor(3)}`} />
          <div className={`w-2 h-2 rounded-sm ${getCellColor(5)}`} />
        </div>
        <span className={`text-[10px] ${subtitle}`}>More</span>
      </div>
    </motion.div>
  );
});

export default AdventureLog;
