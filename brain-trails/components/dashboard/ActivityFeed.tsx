"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCardStyles } from "@/hooks/useCardStyles";
import { formatDistanceToNow } from "date-fns";

interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: string;
}

const ActivityFeed = memo(function ActivityFeed() {
  const { card, title, subtitle, isSun } = useCardStyles();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      // Fetch latest 6 global activities
      const { data, error } = await supabase
        .from('adventure_log')
        .select(`
          id,
          activity_type,
          created_at,
          profiles:user_id ( display_name )
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching activity feed:", error);
        setIsLoading(false);
        return;
      }

      const formattedEvents: ActivityEvent[] = (data || []).map((log: any) => {
        // Map activity types to fun text and icons
        let action = "completed a mysterious task";
        let icon = "✨";

        switch (log.activity_type) {
          case 'focus':
            action = "completed a focus session";
            icon = "⏱️";
            break;
          case 'flashcard':
            action = "mastered flashcards";
            icon = "📚";
            break;
          case 'note':
            action = "scribed a new magical note";
            icon = "📜";
            break;
          case 'quest':
            action = "completed a heroic bounty";
            icon = "⚔️";
            break;
          case 'login':
            action = "entered the realm";
            icon = "🚪";
            break;
        }

        return {
          id: log.id,
          user: log.profiles?.display_name || "Unknown Traveler",
          action,
          time: formatDistanceToNow(new Date(log.created_at), { addSuffix: true }),
          icon,
        };
      });

      setEvents(formattedEvents);
      setIsLoading(false);
    };

    fetchFeed();

    // Listen for live global activity (if RLS allows, otherwise falls back to static fetch for now)
    const channel = supabase
      .channel('global_activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'adventure_log' }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-5`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 relative bg-white/10 rounded-full p-1 border border-white/20">
          <Image
            src="/assets/icons/paper.png"
            alt="Activity Feed"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
        <div>
          <h3 className={`${title} text-base font-bold`}>
            Realm Feed
          </h3>
          <p className={`${subtitle} text-xs`}>Live study activity</p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2 relative min-h-[200px]">
        {isLoading ? (
          // Loading Skeletons
          [1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-12 rounded-lg animate-pulse ${isSun ? "bg-slate-200" : "bg-slate-800"}`} />
          ))
        ) : events.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
            It is very quiet in the realm right now...
          </div>
        ) : (
          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                  isSun 
                    ? "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                {/* Event Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner ${
                  isSun ? "bg-white border text-xl" : "bg-slate-800 border-slate-700 text-xl"
                }`}>
                  {event.icon}
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0 leading-tight">
                  <p className={`text-xs font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-700" : "text-white"}`}>
                    <span className={`font-bold ${isSun ? "text-indigo-600" : "text-indigo-400"}`}>{event.user}</span>{" "}
                    <span className={isSun ? "text-slate-500" : "text-slate-400"}>{event.action}</span>
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0">
                  <span className={`text-[10px] font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                    {event.time.replace('about ', '')}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

export default ActivityFeed;