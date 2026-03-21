"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow } from "date-fns";

interface ActivityEvent {
  id: string;
  action: string;
  time: string;
  icon: string;
  xp: number;
}

const ActivityFeed = memo(function ActivityFeed() {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFeed = async () => {
      const { data, error } = await supabase
        .from('adventure_log')
        .select('id, activity_type, xp_earned, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching activity feed:", error);
        setIsLoading(false);
        return;
      }

      const formattedEvents: ActivityEvent[] = (data || []).map((log) => {
        let action = "completed a task";
        let icon = "✨";

        switch (log.activity_type) {
          case 'focus':
            action = `Completed a focus session`;
            icon = "⏱️";
            break;
          case 'flashcard':
            action = `Reviewed flashcards`;
            icon = "📚";
            break;
          case 'note':
            action = "Wrote a note";
            icon = "📜";
            break;
          case 'quest':
            action = `Completed a quest`;
            icon = "⚔️";
            break;
          case 'login':
            action = "Entered the realm";
            icon = "🚪";
            break;
        }

        return {
          id: log.id,
          action,
          time: formatDistanceToNow(new Date(log.created_at), { addSuffix: true }),
          icon,
          xp: log.xp_earned ?? 0,
        };
      });

      setEvents(formattedEvents);
      setIsLoading(false);
    };

    fetchFeed();

    const channel = supabase
      .channel('user_activity')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'adventure_log',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
          Activity Feed
        </h3>
      </div>

      {/* Activity List */}
      <div className="space-y-3 flex-1">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-[48px] rounded-2xl animate-pulse ${isSun ? "bg-white/50" : "bg-white/5"}`} />
          ))
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm opacity-50 py-4">
            No activity yet.
          </div>
        ) : (
          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-2xl transition-colors
                  ${isSun ? "hover:bg-white/40" : "hover:bg-white/5"}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm ${isSun ? "bg-white text-slate-700" : "bg-white/10 text-white"}`}>
                    {event.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                      {event.action}
                    </p>
                    <p className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                      {event.time.replace('about ', '')}
                    </p>
                  </div>
                </div>
                {event.xp > 0 && (
                  <span className={`text-xs font-bold ${isSun ? "text-purple-600" : "text-purple-400"}`}>
                    +{event.xp} XP
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});

export default ActivityFeed;