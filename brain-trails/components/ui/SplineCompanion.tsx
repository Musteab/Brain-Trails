"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { usePerformanceTier } from '@/hooks/usePerformanceTier';

// Lazy load Spline with SSR disabled
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null, // We handle loading state ourselves
});

interface SplineCompanionProps {
  scene: string;
  className?: string;
}

/**
 * Deferred Spline 3D companion.
 * Shows a lightweight 2D fallback immediately, then loads the 3D scene
 * after a delay so it doesn't block the initial page load.
 */
export default function SplineCompanion({ scene, className = "" }: SplineCompanionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad3D, setShouldLoad3D] = useState(false);
  const { tier, isReady } = usePerformanceTier();

  // Defer loading the heavy Spline scene by 3 seconds after mount
  // so the rest of the page renders and becomes interactive first.
  useEffect(() => {
    if (!isReady || tier === "low") return;

    const timer = setTimeout(() => {
      setShouldLoad3D(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isReady, tier]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Fallback 2D companion (shown while 3D loads or on low-end devices / errors)
  const Fallback = (
    <div className={`flex items-center justify-center w-full h-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl hover:bg-white/20 transition-all ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-7xl transition-transform duration-300 drop-shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>🤖</div>
        <span className="text-sm font-bold opacity-80 font-[family-name:var(--font-quicksand)] bg-white/20 px-3 py-1 rounded-full">
          {!isReady ? "Detecting hardware..." : shouldLoad3D && isLoading ? "Loading companion..." : "Companion"}
        </span>
      </div>
    </div>
  );

  // While checking hardware, show fallback
  if (!isReady) return Fallback;

  // Gracefully degrade to 2D for low-end devices or errors
  if (tier === "low" || hasError) return Fallback;

  // Haven't started loading 3D yet — show fallback
  if (!shouldLoad3D) return Fallback;

  // Render Spline (with fallback visible until loaded)
  return (
    <div className={`relative w-full h-full overflow-hidden rounded-3xl ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10">
          {Fallback}
        </div>
      )}
      {/* Make Spline taller and push down to hide the logo */}
      <div className="absolute w-full h-[calc(100%+60px)] -bottom-14">
        <Spline
          scene={scene}
          onLoad={handleLoad}
          onError={handleError}
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        />
      </div>
    </div>
  );
}