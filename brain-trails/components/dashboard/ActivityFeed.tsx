"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: string;
}

export default function ActivityFeed() {
  const { card, title, subtitle, isSun } = useCardStyles();
  
  const recentEvents: ActivityEvent[] = [
    {
      id: "1",
      user: "Ethan",
      action: "completed Physics Ch 3",
      time: "2m ago",
      icon: "📚"
    },
    {
      id: "2", 
      user: "Rezq",
      action: "found a Rare Item",
      time: "5m ago",
      icon: "✨"
    },
    {
      id: "3",
      user: "Maya",
      action: "achieved 7-day streak",
      time: "12m ago", 
      icon: "🔥"
    },
    {
      id: "4",
      user: "Alex",
      action: "defeated Quiz Boss",
      time: "18m ago",
      icon: "⚔️"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`${card} p-5`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 relative">
          <Image
            src="/assets/icons/paper.png"
            alt="Activity Feed"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
        <div>
          <h3 className={`${title} text-base`}>
            Activity Feed
          </h3>
          <p className={`${subtitle} text-xs`}>Guild updates</p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {recentEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
              isSun 
                ? "bg-amber-50/60 border border-amber-200/50 hover:bg-amber-100/70 hover:border-amber-300/60"
                : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            {/* Event Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              isSun ? "bg-amber-100" : "bg-white/10"
            }`}>
              {event.icon}
            </div>

            {/* Event Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-700" : "text-white"}`}>
                <span className={`font-semibold ${isSun ? "text-purple-600" : "text-[#C77DFF]"}`}>{event.user}</span>{" "}
                <span className={isSun ? "text-slate-600" : "text-slate-300"}>{event.action}</span>
              </p>
            </div>

            {/* Time */}
            <div className="flex-shrink-0">
              <span className={`text-[10px] font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>{event.time}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Footer */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`w-full mt-3 pt-3 text-xs font-semibold transition-colors font-[family-name:var(--font-quicksand)] ${
          isSun 
            ? "border-t border-amber-200/50 text-purple-600 hover:text-purple-700"
            : "border-t border-white/10 text-[#C77DFF] hover:text-[#E0AAFF]"
        }`}
      >
        View All Activity →
      </motion.button>
    </motion.div>
  );
}