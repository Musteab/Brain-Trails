import { useCallback, useRef } from "react";

/**
 * Sound effect identifiers used throughout the app.
 */
export type SoundEffect =
  | "click"
  | "success"
  | "levelUp"
  | "cardFlip"
  | "timerStart"
  | "timerEnd"
  | "error"
  | "navigate";

/**
 * Simple frequency-duration pairs for Web Audio API tone generation.
 * This avoids requiring .mp3 asset files.
 */
const SOUND_CONFIGS: Record<SoundEffect, { frequency: number; duration: number; type: OscillatorType; gain: number }[]> = {
  click: [
    { frequency: 600, duration: 0.05, type: "sine", gain: 0.15 },
  ],
  success: [
    { frequency: 523, duration: 0.1, type: "sine", gain: 0.2 },
    { frequency: 659, duration: 0.1, type: "sine", gain: 0.2 },
    { frequency: 784, duration: 0.15, type: "sine", gain: 0.2 },
  ],
  levelUp: [
    { frequency: 523, duration: 0.1, type: "sine", gain: 0.25 },
    { frequency: 659, duration: 0.1, type: "sine", gain: 0.25 },
    { frequency: 784, duration: 0.1, type: "sine", gain: 0.25 },
    { frequency: 1047, duration: 0.2, type: "sine", gain: 0.25 },
  ],
  cardFlip: [
    { frequency: 400, duration: 0.04, type: "triangle", gain: 0.1 },
    { frequency: 500, duration: 0.04, type: "triangle", gain: 0.1 },
  ],
  timerStart: [
    { frequency: 440, duration: 0.08, type: "sine", gain: 0.15 },
    { frequency: 554, duration: 0.08, type: "sine", gain: 0.15 },
  ],
  timerEnd: [
    { frequency: 784, duration: 0.15, type: "sine", gain: 0.2 },
    { frequency: 659, duration: 0.15, type: "sine", gain: 0.2 },
    { frequency: 784, duration: 0.2, type: "sine", gain: 0.25 },
  ],
  error: [
    { frequency: 200, duration: 0.15, type: "square", gain: 0.1 },
    { frequency: 180, duration: 0.2, type: "square", gain: 0.1 },
  ],
  navigate: [
    { frequency: 500, duration: 0.04, type: "sine", gain: 0.1 },
  ],
};

const MUTE_STORAGE_KEY = "braintrails_sound_muted";

function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Toggle global mute state. Returns the new mute value.
 */
export function toggleMute(): boolean {
  const newValue = !isMuted();
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, String(newValue));
  } catch {
    // localStorage unavailable
  }
  return newValue;
}

export function getMuted(): boolean {
  return isMuted();
}

/**
 * Play a sequence of tones using the Web Audio API.
 */
function playTones(configs: typeof SOUND_CONFIGS[SoundEffect], ctx: AudioContext) {
  let offset = 0;
  for (const { frequency, duration, type, gain: gainValue } of configs) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + offset);
    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime + offset);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime + offset);
    oscillator.stop(ctx.currentTime + offset + duration + 0.01);
    offset += duration;
  }
}

/**
 * Hook that provides a `playSound` function for triggering sound effects.
 *
 * Uses the Web Audio API to generate tones without requiring audio files.
 * Respects the global mute setting persisted in localStorage.
 *
 * @example
 * const playSound = useSoundEffects();
 * playSound("click");
 */
export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((effect: SoundEffect) => {
    if (isMuted()) return;
    if (typeof window === "undefined") return;

    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }

      const configs = SOUND_CONFIGS[effect];
      if (configs) {
        playTones(configs, ctxRef.current);
      }
    } catch {
      // Web Audio API not available
    }
  }, []);

  return playSound;
}
