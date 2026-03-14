"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { usePerformanceTier } from '@/hooks/usePerformanceTier';

// Lazy load Spline with SSR disabled
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-white/20 rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin text-2xl">⚙️</div>
        <span className="text-sm text-muted font-[family-name:var(--font-quicksand)]">Loading companion...</span>
      </div>
    </div>
  ),
});

interface SplineCompanionProps {
  scene: string;
  className?: string;
}

export default function SplineCompanion({ scene, className = "" }: SplineCompanionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { tier, isReady } = usePerformanceTier();

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // While checking hardware, show loading state
  if (!isReady) {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-white/10 rounded-2xl ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin text-2xl">⚙️</div>
          <span className="text-sm text-muted font-[family-name:var(--font-quicksand)]">Detecting hardware...</span>
        </div>
      </div>
    );
  }

  // Gracefully degrade to a static 2D avatar for low-end devices
  if (tier === "low" || hasError) {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl hover:bg-white/20 transition-all ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">🤖</div>
          <span className="text-sm font-bold opacity-80 font-[family-name:var(--font-quicksand)] bg-white/20 px-3 py-1 rounded-full">
            Companion (Eco Mode)
          </span>
        </div>
      </div>
    );
  }

  // Render Spline — error boundary wraps this component externally
  return (
    <div className={`relative w-full h-full overflow-hidden rounded-3xl ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/20 rounded-2xl z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin text-2xl">⚙️</div>
            <span className="text-sm text-muted font-[family-name:var(--font-quicksand)]">Loading companion...</span>
          </div>
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