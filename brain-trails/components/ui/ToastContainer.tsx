"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useUIStore, type Toast } from "@/stores";

const icons: Record<Toast["type"], typeof Info> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors: Record<Toast["type"], string> = {
  success: "bg-emerald-500/90 border-emerald-400/50",
  error: "bg-red-500/90 border-red-400/50",
  info: "bg-violet-500/90 border-violet-400/50",
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl text-white shadow-lg min-w-[240px] max-w-sm ${colors[toast.type]}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-0.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
