"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ParticleVariant = "mana" | "fire" | "ice" | "nature" | "arcane" | "gold" | "rainbow";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glow: string;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "star" | "diamond" | "spark";
}

interface ManaBoostParticlesProps {
  /** Whether the effect is active */
  active: boolean;
  /** Particle style variant */
  variant?: ParticleVariant;
  /** Number of particles (default 30) */
  count?: number;
  /** Duration in ms before auto-stop (0 = infinite) */
  duration?: number;
  /** Callback when effect completes */
  onComplete?: () => void;
  /** Container class name */
  className?: string;
  /** Intensity multiplier (0.5 - 2.0) */
  intensity?: number;
  /** Origin point as percentage (default center) */
  origin?: { x: number; y: number };
}

const VARIANT_CONFIGS: Record<ParticleVariant, {
  colors: string[];
  glows: string[];
  shapes: Array<"circle" | "star" | "diamond" | "spark">;
  gravity: number;
  spread: number;
  speed: number;
}> = {
  mana: {
    colors: ["#a855f7", "#c084fc", "#e879f9", "#8b5cf6", "#d946ef"],
    glows: ["rgba(168, 85, 247, 0.8)", "rgba(192, 132, 252, 0.8)", "rgba(232, 121, 249, 0.8)"],
    shapes: ["circle", "spark", "star"],
    gravity: -0.02,
    spread: 1.2,
    speed: 1.0,
  },
  fire: {
    colors: ["#f97316", "#fb923c", "#fbbf24", "#ef4444", "#fcd34d"],
    glows: ["rgba(249, 115, 22, 0.9)", "rgba(251, 146, 60, 0.8)", "rgba(251, 191, 36, 0.7)"],
    shapes: ["circle", "spark"],
    gravity: -0.04,
    spread: 0.8,
    speed: 1.3,
  },
  ice: {
    colors: ["#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc", "#ffffff"],
    glows: ["rgba(6, 182, 212, 0.8)", "rgba(34, 211, 238, 0.7)", "rgba(165, 243, 252, 0.6)"],
    shapes: ["diamond", "star", "spark"],
    gravity: 0.01,
    spread: 1.5,
    speed: 0.7,
  },
  nature: {
    colors: ["#22c55e", "#4ade80", "#86efac", "#a3e635", "#34d399"],
    glows: ["rgba(34, 197, 94, 0.7)", "rgba(74, 222, 128, 0.6)", "rgba(134, 239, 172, 0.5)"],
    shapes: ["circle", "star"],
    gravity: 0.02,
    spread: 1.0,
    speed: 0.8,
  },
  arcane: {
    colors: ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#c084fc"],
    glows: ["rgba(59, 130, 246, 0.9)", "rgba(99, 102, 241, 0.8)", "rgba(139, 92, 246, 0.7)"],
    shapes: ["star", "diamond", "spark"],
    gravity: 0,
    spread: 1.4,
    speed: 1.1,
  },
  gold: {
    colors: ["#fbbf24", "#fcd34d", "#fde68a", "#f59e0b", "#eab308"],
    glows: ["rgba(251, 191, 36, 0.9)", "rgba(252, 211, 77, 0.8)", "rgba(253, 230, 138, 0.7)"],
    shapes: ["star", "diamond", "circle"],
    gravity: 0.01,
    spread: 1.0,
    speed: 0.9,
  },
  rainbow: {
    colors: ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"],
    glows: ["rgba(239, 68, 68, 0.7)", "rgba(34, 197, 94, 0.7)", "rgba(59, 130, 246, 0.7)", "rgba(236, 72, 153, 0.7)"],
    shapes: ["circle", "star", "spark", "diamond"],
    gravity: 0,
    spread: 1.6,
    speed: 1.0,
  },
};

/**
 * ManaBoostParticles
 * 
 * A magical particle effect component for visual feedback:
 * - Use on mana boosts, level ups, achievements, XP gains
 * - Multiple variants: mana, fire, ice, nature, arcane, gold, rainbow
 * - Canvas-based for smooth 60fps performance
 * - Configurable intensity, duration, and origin point
 */
export default function ManaBoostParticles({
  active,
  variant = "mana",
  count = 30,
  duration = 2000,
  onComplete,
  className = "",
  intensity = 1.0,
  origin = { x: 50, y: 50 },
}: ManaBoostParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  const config = VARIANT_CONFIGS[variant];

  const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 4) * config.speed * intensity;
    const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
    
    return {
      x: (origin.x / 100) * canvas.width,
      y: (origin.y / 100) * canvas.height,
      vx: Math.cos(angle) * speed * config.spread,
      vy: Math.sin(angle) * speed * config.spread - 2,
      life: 1,
      maxLife: 60 + Math.random() * 60,
      size: (3 + Math.random() * 6) * intensity,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      glow: config.glows[Math.floor(Math.random() * config.glows.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      shape,
    };
  }, [config, intensity, origin]);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    const alpha = p.life;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;

    // Glow effect
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = p.size * 2;

    ctx.fillStyle = p.color;
    ctx.beginPath();

    switch (p.shape) {
      case "circle":
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        break;
      case "star":
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const innerAngle = angle + Math.PI / 5;
          const outerRadius = p.size;
          const innerRadius = p.size * 0.4;
          if (i === 0) {
            ctx.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
          } else {
            ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
          }
          ctx.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
        }
        ctx.closePath();
        break;
      case "diamond":
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        break;
      case "spark":
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.2, -p.size * 0.2);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(p.size * 0.2, p.size * 0.2);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.2, p.size * 0.2);
        ctx.lineTo(-p.size, 0);
        ctx.lineTo(-p.size * 0.2, -p.size * 0.2);
        ctx.closePath();
        break;
    }

    ctx.fill();
    ctx.restore();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += config.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.life -= 1 / p.maxLife;

      if (p.life > 0) {
        drawParticle(ctx, p);
        return true;
      }
      return false;
    });

    // Add new particles if still active
    const elapsed = Date.now() - startTimeRef.current;
    const shouldSpawn = isActiveRef.current && (duration === 0 || elapsed < duration * 0.7);
    
    if (shouldSpawn && particlesRef.current.length < count * 2) {
      const spawnCount = Math.ceil(count / 20);
      for (let i = 0; i < spawnCount; i++) {
        particlesRef.current.push(createParticle(canvas));
      }
    }

    // Continue animation or complete
    if (particlesRef.current.length > 0 || shouldSpawn) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }, [config.gravity, count, createParticle, drawParticle, duration, onComplete]);

  // Start/stop effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (active && !isActiveRef.current) {
      // Start effect
      isActiveRef.current = true;
      startTimeRef.current = Date.now();
      
      // Initial burst
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(canvas));
      }
      
      animate();
    } else if (!active && isActiveRef.current) {
      // Stop spawning but let existing particles finish
      isActiveRef.current = false;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, count, createParticle, animate]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute inset-0 pointer-events-none z-50 ${className}`}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * Burst variant - single explosion effect
 */
export function ManaBoostBurst({
  variant = "gold",
  count = 50,
  origin = { x: 50, y: 50 },
  className = "",
}: {
  variant?: ParticleVariant;
  count?: number;
  origin?: { x: number; y: number };
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = VARIANT_CONFIGS[variant];
    const particles: Particle[] = [];

    // Create burst particles
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
      
      particles.push({
        x: (origin.x / 100) * canvas.width,
        y: (origin.y / 100) * canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 40 + Math.random() * 30,
        size: 4 + Math.random() * 6,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        glow: config.glows[Math.floor(Math.random() * config.glows.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeCount = 0;
      particles.forEach((p) => {
        if (p.life <= 0) return;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += config.gravity;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.rotation += p.rotationSpeed;
        p.life -= 1 / p.maxLife;
        activeCount++;

        const alpha = p.life;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.glow;
        ctx.shadowBlur = p.size * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    // Set canvas size
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [variant, count, origin]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute inset-0 pointer-events-none z-50 ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/**
 * Trail variant - follows cursor/touch
 */
export function ManaTrailParticles({
  variant = "arcane",
  active = true,
  className = "",
}: {
  variant?: ParticleVariant;
  active?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = VARIANT_CONFIGS[variant];
    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Spawn trail particle
      if (Math.random() > 0.5) {
        const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          life: 1,
          maxLife: 30 + Math.random() * 20,
          size: 2 + Math.random() * 4,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          glow: config.glows[Math.floor(Math.random() * config.glows.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          shape,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += config.gravity;
        p.rotation += p.rotationSpeed;
        p.life -= 1 / p.maxLife;

        if (p.life > 0) {
          const alpha = p.life;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = alpha;
          ctx.shadowColor = p.glow;
          ctx.shadowBlur = p.size;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        }
        return false;
      });

      animationId = requestAnimationFrame(animate);
    };

    // Set canvas size
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    updateSize();

    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", updateSize);
    animate();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateSize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [variant, active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-40 ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
