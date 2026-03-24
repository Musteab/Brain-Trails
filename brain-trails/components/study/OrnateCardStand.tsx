"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Sparkles, Check, X } from "lucide-react";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface OrnateCardStandProps {
  cards: FlashCard[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onMarkCorrect?: (cardId: string) => void;
  onMarkIncorrect?: (cardId: string) => void;
  showControls?: boolean;
}

/**
 * Ornate Card Stand - Victorian-style Flashcard Display
 * 
 * Features:
 * - Decorative metal/wood stand holding the flashcard
 * - Victorian ornate corners and borders
 * - 3D flip animation
 * - Illustrated card faces with aged parchment texture
 */
export default function OrnateCardStand({
  cards,
  currentIndex,
  onNext,
  onPrev,
  onMarkCorrect,
  onMarkIncorrect,
  showControls = true,
}: OrnateCardStandProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentCard = cards[currentIndex];

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy": return "#4ade80";
      case "medium": return "#fbbf24";
      case "hard": return "#ef4444";
      default: return "#a78bfa";
    }
  };

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-amber-400">No cards available</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* The Stand Base */}
      <div className="relative">
        {/* Stand Back Panel (Decorative) */}
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-[340px] h-16"
          style={{
            background: "linear-gradient(180deg, #3d2817 0%, #2a1a10 50%, #1a100a 100%)",
            borderRadius: "8px 8px 0 0",
            boxShadow: `
              inset 0 2px 4px rgba(255, 200, 150, 0.15),
              0 -4px 20px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          {/* Decorative carvings */}
          <div className="absolute inset-x-4 top-2 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />
          <div className="absolute inset-x-8 top-4 h-px bg-gradient-to-r from-transparent via-amber-600/20 to-transparent" />
          
          {/* Center ornament */}
          <div 
            className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-8"
            style={{
              background: "radial-gradient(ellipse at center, #c9a86c 0%, #8b6914 50%, #5c4a1f 100%)",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              boxShadow: "0 0 10px rgba(201, 168, 108, 0.3)",
            }}
          />
        </div>

        {/* Card Holder / Easel */}
        <div className="relative z-10">
          {/* The Card */}
          <div 
            className="relative w-[300px] h-[400px] cursor-pointer"
            style={{ perspective: "1500px" }}
            onClick={handleFlip}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front of Card */}
              <div 
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{ 
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <CardFace 
                  content={currentCard.front} 
                  type="question"
                  difficulty={currentCard.difficulty}
                />
              </div>

              {/* Back of Card */}
              <div 
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{ 
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <CardFace 
                  content={currentCard.back} 
                  type="answer"
                  difficulty={currentCard.difficulty}
                />
              </div>
            </motion.div>

            {/* Victorian Corner Ornaments */}
            <VictorianCorner position="top-left" />
            <VictorianCorner position="top-right" />
            <VictorianCorner position="bottom-left" />
            <VictorianCorner position="bottom-right" />

            {/* Flip indicator */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <RotateCcw className="w-3 h-3 text-amber-300" />
              <span className="text-[10px] text-amber-300 font-medium">
                {isFlipped ? "Tap to see question" : "Tap to reveal answer"}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Stand Ledge */}
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[360px] h-8"
          style={{
            background: "linear-gradient(180deg, #4a3020 0%, #3d2817 50%, #2a1a10 100%)",
            borderRadius: "0 0 12px 12px",
            boxShadow: `
              inset 0 2px 4px rgba(255, 200, 150, 0.1),
              0 8px 20px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          {/* Metal trim */}
          <div 
            className="absolute top-0 inset-x-4 h-1 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #c9a86c, transparent)",
            }}
          />
        </div>

        {/* Stand Legs */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-32">
          <StandLeg side="left" />
          <StandLeg side="right" />
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-20 flex items-center gap-4">
          {/* Previous Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPrev}
            disabled={currentIndex === 0}
            className={`p-3 rounded-xl transition-all ${
              currentIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-amber-900/30"
            }`}
            style={{
              background: "linear-gradient(135deg, #3d2817 0%, #2a1a10 100%)",
              border: "1px solid rgba(201, 168, 108, 0.3)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <ChevronLeft className="w-6 h-6 text-amber-400" />
          </motion.button>

          {/* Card Counter */}
          <div 
            className="px-6 py-2 rounded-full"
            style={{
              background: "linear-gradient(135deg, #2a1a10 0%, #1a100a 100%)",
              border: "1px solid rgba(201, 168, 108, 0.2)",
            }}
          >
            <span className="text-amber-300 font-bold">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>

          {/* Next Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNext}
            disabled={currentIndex === cards.length - 1}
            className={`p-3 rounded-xl transition-all ${
              currentIndex === cards.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-amber-900/30"
            }`}
            style={{
              background: "linear-gradient(135deg, #3d2817 0%, #2a1a10 100%)",
              border: "1px solid rgba(201, 168, 108, 0.3)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <ChevronRight className="w-6 h-6 text-amber-400" />
          </motion.button>
        </div>
      )}

      {/* Correct/Incorrect Buttons (shown when flipped) */}
      <AnimatePresence>
        {isFlipped && onMarkCorrect && onMarkIncorrect && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 flex items-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onMarkIncorrect(currentCard.id);
                onNext();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
                border: "1px solid #ef4444",
                boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
              }}
            >
              <X className="w-5 h-5 text-red-300" />
              <span className="text-red-200">Needs Review</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onMarkCorrect(currentCard.id);
                onNext();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
                border: "1px solid #22c55e",
                boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)",
              }}
            >
              <Check className="w-5 h-5 text-green-300" />
              <span className="text-green-200">Got It!</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Card Face Component
function CardFace({ 
  content, 
  type, 
  difficulty 
}: { 
  content: string; 
  type: "question" | "answer";
  difficulty?: string;
}) {
  const isQuestion = type === "question";
  
  return (
    <div 
      className="w-full h-full p-6 flex flex-col"
      style={{
        background: `
          linear-gradient(135deg, 
            ${isQuestion ? "#fef7e8" : "#f0f9f0"} 0%, 
            ${isQuestion ? "#fdf2d4" : "#e8f5e8"} 50%, 
            ${isQuestion ? "#fce8c2" : "#dcf0dc"} 100%
          )
        `,
        boxShadow: `
          inset 0 0 60px rgba(139, 92, 46, 0.15),
          inset 0 0 100px rgba(0, 0, 0, 0.05)
        `,
      }}
    >
      {/* Card type indicator */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{
            background: isQuestion 
              ? "linear-gradient(135deg, #854d0e 0%, #a16207 100%)"
              : "linear-gradient(135deg, #166534 0%, #15803d 100%)",
          }}
        >
          <Sparkles className="w-3 h-3 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isQuestion ? "Question" : "Answer"}
          </span>
        </div>
        
        {difficulty && (
          <div 
            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
            style={{
              background: `${difficulty === "easy" ? "#dcfce7" : difficulty === "medium" ? "#fef3c7" : "#fee2e2"}`,
              color: difficulty === "easy" ? "#166534" : difficulty === "medium" ? "#92400e" : "#991b1b",
            }}
          >
            {difficulty}
          </div>
        )}
      </div>

      {/* Decorative line */}
      <div 
        className="h-px mb-4"
        style={{
          background: `linear-gradient(90deg, transparent, ${isQuestion ? "#d97706" : "#16a34a"}40, transparent)`,
        }}
      />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <p 
          className="text-center text-lg leading-relaxed"
          style={{
            color: isQuestion ? "#78350f" : "#14532d",
            fontFamily: "var(--font-nunito), serif",
          }}
        >
          {content}
        </p>
      </div>

      {/* Bottom ornament */}
      <div className="flex justify-center mt-4">
        <div 
          className="w-16 h-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${isQuestion ? "#d97706" : "#16a34a"}60, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

// Victorian Corner Ornament
function VictorianCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const positionStyles: Record<string, string> = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0 rotate-90",
    "bottom-left": "bottom-0 left-0 -rotate-90",
    "bottom-right": "bottom-0 right-0 rotate-180",
  };

  return (
    <div className={`absolute ${positionStyles[position]} w-12 h-12 pointer-events-none`}>
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#b8860b" />
            <stop offset="100%" stopColor="#daa520" />
          </linearGradient>
        </defs>
        {/* Corner flourish */}
        <path
          d="M 0 0 L 24 0 C 20 4, 16 8, 12 12 C 8 16, 4 20, 0 24 Z"
          fill="url(#goldGradient)"
          opacity="0.9"
        />
        {/* Inner detail */}
        <path
          d="M 0 0 L 16 0 C 12 4, 8 8, 4 12 L 0 16 Z"
          fill="#ffd700"
          opacity="0.6"
        />
        {/* Decorative curl */}
        <path
          d="M 8 0 Q 12 8, 0 12"
          fill="none"
          stroke="#b8860b"
          strokeWidth="1"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

// Stand Leg Component
function StandLeg({ side }: { side: "left" | "right" }) {
  return (
    <div 
      className="w-4 h-12"
      style={{
        background: "linear-gradient(180deg, #3d2817 0%, #2a1a10 50%, #1a100a 100%)",
        borderRadius: "0 0 4px 4px",
        transform: side === "left" ? "rotate(-10deg)" : "rotate(10deg)",
        boxShadow: "2px 4px 8px rgba(0, 0, 0, 0.4)",
      }}
    />
  );
}
