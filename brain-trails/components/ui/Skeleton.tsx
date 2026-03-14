"use client";
import { useCardStyles } from "@/hooks/useCardStyles";

interface SkeletonProps {
  variant?: "text" | "circle" | "card" | "rect";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({ variant = "text", width, height, className = "" }: SkeletonProps) {
  const { isSun } = useCardStyles();

  const baseClass = `animate-pulse rounded ${isSun ? "bg-slate-200/60" : "bg-white/10"}`;

  const variantStyles = {
    text: "h-4 rounded-md",
    circle: "rounded-full",
    card: "rounded-2xl",
    rect: "rounded-xl",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  // Defaults
  if (!width && variant === "text") style.width = "100%";
  if (!height && variant === "text") style.height = "16px";
  if (!width && variant === "circle") { style.width = "40px"; style.height = "40px"; }
  if (!height && variant === "card") style.height = "120px";
  if (!width && (variant === "card" || variant === "rect")) style.width = "100%";
  if (!height && variant === "rect") style.height = "40px";

  return <div className={`${baseClass} ${variantStyles[variant]} ${className}`} style={style} />;
}
