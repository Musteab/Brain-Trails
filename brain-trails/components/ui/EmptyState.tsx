"use client";
import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface EmptyStateProps {
  icon?: string; // emoji
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = "🦉", title, description, action }: EmptyStateProps) {
  const { isSun, card } = useCardStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-8 text-center max-w-sm mx-auto`}
    >
      <motion.div
        className="text-5xl mb-4"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] mb-2 ${
        isSun ? "text-slate-700" : "text-white"
      }`}>
        {title}
      </h3>
      <p className={`text-sm font-[family-name:var(--font-quicksand)] mb-4 ${
        isSun ? "text-slate-500" : "text-slate-400"
      }`}>
        {description}
      </p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-shadow"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
