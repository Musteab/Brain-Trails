"use client";

import { useEffect, useRef } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function useKonamiCode(onUnlock: () => void) {
  const sequenceRef = useRef<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const newSequence = [...sequenceRef.current, key];
      if (newSequence.length > KONAMI_CODE.length) {
        newSequence.shift();
      }
      
      // Check if the sequence matches
      if (newSequence.join("").toLowerCase() === KONAMI_CODE.join("").toLowerCase()) {
        onUnlock();
        sequenceRef.current = []; // Reset after unlock
      } else {
        sequenceRef.current = newSequence;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUnlock]);
}
