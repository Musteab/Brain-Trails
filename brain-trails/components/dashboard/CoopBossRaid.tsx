"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

export default function CoopBossRaid() {
  const { card, isSun } = useCardStyles();
  const bossHp = 65; // Current boss HP percentage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`${card} p-6`}
    >
      {/* Red accent banner */}
      <div className={`rounded-xl p-4 mb-4 border ${
        isSun ? "bg-red-50 border-red-200" : "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30"
      }`}>
        {/* Header with Sword Icon */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <Image
              src="/assets/icons/sword.png"
              alt="Boss Raid"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className={`text-base font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-red-700" : "text-red-400"}`}>
              Boss Raid
            </h3>
            <p className={`text-xs font-[family-name:var(--font-quicksand)] ${isSun ? "text-red-600" : "text-red-300"}`}>Guild Challenge</p>
          </div>
        </div>
      </div>

      {/* Boss Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-bold font-[family-name:var(--font-quicksand)] ${isSun ? "text-red-700" : "text-red-300"}`}>🐉 Calculus Dragon</span>
          <span className={`text-xs font-semibold font-[family-name:var(--font-quicksand)] ${isSun ? "text-red-600" : "text-red-400"}`}>{bossHp}%</span>
        </div>
        
        {/* HP Bar */}
        <div className={`h-3 rounded-full overflow-hidden border ${
          isSun ? "bg-red-100 border-red-300" : "bg-red-900/50 border-red-500/30"
        }`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bossHp}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full relative"
          >
            {/* HP Bar pulse effect */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-red-400 rounded-full"
            />
          </motion.div>
        </div>
      </div>

      {/* Raid Stats */}
      <div className={`flex items-center justify-between text-xs mb-4 font-[family-name:var(--font-quicksand)] ${isSun ? "text-red-600" : "text-red-300"}`}>
        <span>👥 12 Raiders</span>
        <span>⏱️ 2h left</span>
      </div>

      {/* Join Raid Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-2.5 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-[family-name:var(--font-quicksand)] ${
          isSun
            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border border-red-400"
            : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400"
        }`}
      >
        ⚔️ Join Raid
      </motion.button>
    </motion.div>
  );
}