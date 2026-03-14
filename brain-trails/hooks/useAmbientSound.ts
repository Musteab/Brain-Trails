"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AmbientSound = "none" | "rain" | "cafe" | "forest" | "lofi";

const MUTE_KEY = "braintrails_sound_muted";
const FADE_DURATION = 1; // seconds

function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Create a white-noise buffer source.
 */
function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** All active audio nodes for a single ambient sound. */
interface SoundGraph {
  masterGain: GainNode;
  sources: (AudioBufferSourceNode | OscillatorNode)[];
  nodes: AudioNode[];
  timers: ReturnType<typeof setInterval>[];
}

/**
 * Build the audio graph for rain: filtered white noise + gentle random amplitude modulation.
 */
function buildRain(ctx: AudioContext, master: GainNode): SoundGraph {
  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  const nodes: AudioNode[] = [];

  // Noise source — loop a 4-second noise buffer
  const noiseBuffer = createNoiseBuffer(ctx, 4);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  // Low-pass filter to soften into a rain-like hiss
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 4000;
  lp.Q.value = 0.7;

  // High-pass to remove rumble
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 300;
  hp.Q.value = 0.5;

  // Amplitude modulation via a slow LFO on a gain node
  const modGain = ctx.createGain();
  modGain.gain.value = 0.6;

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15; // very slow
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(modGain.gain);
  lfo.start();

  noise.connect(hp);
  hp.connect(lp);
  lp.connect(modGain);
  modGain.connect(master);

  noise.start();

  sources.push(noise, lfo);
  nodes.push(lp, hp, modGain, lfoGain);

  return { masterGain: master, sources, nodes, timers: [] };
}

/**
 * Build audio graph for cafe: warm brown noise + occasional brighter bursts.
 */
function buildCafe(ctx: AudioContext, master: GainNode): SoundGraph {
  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  const nodes: AudioNode[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];

  // Brown noise (integrate white noise): low-pass at very low frequency
  const noiseBuffer = createNoiseBuffer(ctx, 4);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 800;
  lp.Q.value = 0.3;

  const lp2 = ctx.createBiquadFilter();
  lp2.type = "lowpass";
  lp2.frequency.value = 1200;
  lp2.Q.value = 0.5;

  const baseGain = ctx.createGain();
  baseGain.gain.value = 0.5;

  noise.connect(lp);
  lp.connect(lp2);
  lp2.connect(baseGain);
  baseGain.connect(master);
  noise.start();

  sources.push(noise);
  nodes.push(lp, lp2, baseGain);

  // Occasional brighter noise bursts (simulating distant chatter/clinking)
  const burstInterval = setInterval(() => {
    try {
      const burstBuf = createNoiseBuffer(ctx, 0.3);
      const burst = ctx.createBufferSource();
      burst.buffer = burstBuf;

      const burstFilter = ctx.createBiquadFilter();
      burstFilter.type = "bandpass";
      burstFilter.frequency.value = 1500 + Math.random() * 2000;
      burstFilter.Q.value = 1.5;

      const burstGainNode = ctx.createGain();
      burstGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      burstGainNode.gain.exponentialRampToValueAtTime(0.08 + Math.random() * 0.06, ctx.currentTime + 0.05);
      burstGainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      burst.connect(burstFilter);
      burstFilter.connect(burstGainNode);
      burstGainNode.connect(master);
      burst.start();
      burst.stop(ctx.currentTime + 0.3);
    } catch {
      // context may be closed
    }
  }, 1500 + Math.random() * 3000);

  timers.push(burstInterval);

  return { masterGain: master, sources, nodes, timers };
}

/**
 * Build audio graph for forest: band-passed green noise + chirp patterns.
 */
function buildForest(ctx: AudioContext, master: GainNode): SoundGraph {
  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  const nodes: AudioNode[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];

  // Green noise: band-pass filtered noise in the mid-range
  const noiseBuffer = createNoiseBuffer(ctx, 4);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  bp.Q.value = 0.6;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2000;
  lp.Q.value = 0.4;

  const baseGain = ctx.createGain();
  baseGain.gain.value = 0.35;

  noise.connect(bp);
  bp.connect(lp);
  lp.connect(baseGain);
  baseGain.connect(master);
  noise.start();

  sources.push(noise);
  nodes.push(bp, lp, baseGain);

  // Chirp oscillator patterns (bird-like)
  const chirpInterval = setInterval(() => {
    try {
      const baseFreq = 2000 + Math.random() * 2000;
      const chirpCount = 2 + Math.floor(Math.random() * 3);
      let offset = 0;

      for (let i = 0; i < chirpCount; i++) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(
          baseFreq * (1.1 + Math.random() * 0.3),
          ctx.currentTime + offset + 0.06
        );

        const chirpGain = ctx.createGain();
        chirpGain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
        chirpGain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, ctx.currentTime + offset + 0.02);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.08);

        osc.connect(chirpGain);
        chirpGain.connect(master);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.1);

        offset += 0.1 + Math.random() * 0.05;
      }
    } catch {
      // context may be closed
    }
  }, 3000 + Math.random() * 5000);

  timers.push(chirpInterval);

  return { masterGain: master, sources, nodes, timers };
}

/**
 * Build audio graph for lofi: gentle sine-wave chord progressions + filtered noise crackle.
 */
function buildLofi(ctx: AudioContext, master: GainNode): SoundGraph {
  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  const nodes: AudioNode[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];

  // Chord progressions: gentle sine waves
  const chords = [
    [261.6, 329.6, 392.0], // C major
    [220.0, 277.2, 329.6], // A minor
    [246.9, 311.1, 370.0], // B dim-ish
    [293.7, 349.2, 440.0], // D minor
  ];

  let chordIdx = 0;
  const oscillators: OscillatorNode[] = [];
  const oscGains: GainNode[] = [];

  // Create 3 oscillators for the chord
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = chords[0][i];

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.06;

    // Gentle low-pass to soften
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 800;

    osc.connect(lp);
    lp.connect(oscGain);
    oscGain.connect(master);
    osc.start();

    oscillators.push(osc);
    oscGains.push(oscGain);
    sources.push(osc);
    nodes.push(oscGain, lp);
  }

  // Cycle chords every 4 seconds
  const chordTimer = setInterval(() => {
    try {
      chordIdx = (chordIdx + 1) % chords.length;
      const chord = chords[chordIdx];
      for (let i = 0; i < 3; i++) {
        oscillators[i].frequency.exponentialRampToValueAtTime(
          chord[i],
          ctx.currentTime + 1.5
        );
      }
    } catch {
      // context may be closed
    }
  }, 4000);

  timers.push(chordTimer);

  // Vinyl crackle: very quiet filtered noise
  const crackleBuffer = createNoiseBuffer(ctx, 2);
  const crackle = ctx.createBufferSource();
  crackle.buffer = crackleBuffer;
  crackle.loop = true;

  const crackleHP = ctx.createBiquadFilter();
  crackleHP.type = "highpass";
  crackleHP.frequency.value = 5000;

  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.015;

  // Random amplitude for crackle texture
  const crackleLfo = ctx.createOscillator();
  crackleLfo.type = "sawtooth";
  crackleLfo.frequency.value = 8;
  const crackleLfoGain = ctx.createGain();
  crackleLfoGain.gain.value = 0.008;
  crackleLfo.connect(crackleLfoGain);
  crackleLfoGain.connect(crackleGain.gain);
  crackleLfo.start();

  crackle.connect(crackleHP);
  crackleHP.connect(crackleGain);
  crackleGain.connect(master);
  crackle.start();

  sources.push(crackle, crackleLfo);
  nodes.push(crackleHP, crackleGain, crackleLfoGain);

  return { masterGain: master, sources, nodes, timers };
}

type BuildFn = (ctx: AudioContext, master: GainNode) => SoundGraph;
const BUILDERS: Record<Exclude<AmbientSound, "none">, BuildFn> = {
  rain: buildRain,
  cafe: buildCafe,
  forest: buildForest,
  lofi: buildLofi,
};

/**
 * Hook for procedurally-generated ambient background sounds.
 *
 * Uses the Web Audio API only — no mp3 files.
 * Supports: rain, cafe, forest, lofi.
 * Smooth 1-second crossfade when switching sounds.
 * Respects global mute state (localStorage key: braintrails_sound_muted).
 */
export function useAmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<AmbientSound>("none");

  const ctxRef = useRef<AudioContext | null>(null);
  const graphRef = useRef<SoundGraph | null>(null);

  /** Tear down the current audio graph with a fade-out. */
  const teardown = useCallback((fadeOut = true) => {
    const graph = graphRef.current;
    const ctx = ctxRef.current;
    if (!graph || !ctx) return;

    // Clear scheduled timers
    for (const t of graph.timers) clearInterval(t);

    if (fadeOut) {
      // Fade out over FADE_DURATION
      graph.masterGain.gain.setValueAtTime(graph.masterGain.gain.value, ctx.currentTime);
      graph.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION);

      // Stop sources after fade completes
      setTimeout(() => {
        for (const s of graph.sources) {
          try { s.stop(); } catch { /* already stopped */ }
        }
        for (const n of graph.nodes) {
          try { n.disconnect(); } catch { /* ok */ }
        }
        try { graph.masterGain.disconnect(); } catch { /* ok */ }
      }, FADE_DURATION * 1000 + 50);
    } else {
      for (const s of graph.sources) {
        try { s.stop(); } catch { /* already stopped */ }
      }
      for (const n of graph.nodes) {
        try { n.disconnect(); } catch { /* ok */ }
      }
      try { graph.masterGain.disconnect(); } catch { /* ok */ }
    }

    graphRef.current = null;
  }, []);

  /** Play a specific ambient sound (or stop if "none"). */
  const play = useCallback(
    (sound: AmbientSound) => {
      if (typeof window === "undefined") return;
      if (isMuted() && sound !== "none") return;

      // Tear down previous sound
      teardown(true);

      if (sound === "none") {
        setIsPlaying(false);
        setCurrentSound("none");
        return;
      }

      // Create / reuse AudioContext
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;

      // Resume if suspended (Chrome autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Master gain with fade-in
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_DURATION);
      master.connect(ctx.destination);

      const builder = BUILDERS[sound];
      const graph = builder(ctx, master);
      graphRef.current = graph;

      setCurrentSound(sound);
      setIsPlaying(true);
    },
    [teardown]
  );

  /** Stop all ambient sounds. */
  const stop = useCallback(() => {
    teardown(true);
    setIsPlaying(false);
    setCurrentSound("none");
  }, [teardown]);

  /** Toggle between playing and stopped. */
  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else if (currentSound !== "none") {
      play(currentSound);
    }
  }, [isPlaying, currentSound, play, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Force immediate teardown (no fade) on unmount
      const graph = graphRef.current;
      if (graph) {
        for (const t of graph.timers) clearInterval(t);
        for (const s of graph.sources) {
          try { s.stop(); } catch { /* ok */ }
        }
        for (const n of graph.nodes) {
          try { n.disconnect(); } catch { /* ok */ }
        }
        try { graph.masterGain.disconnect(); } catch { /* ok */ }
        graphRef.current = null;
      }
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, []);

  return { isPlaying, currentSound, play, stop, toggle };
}
