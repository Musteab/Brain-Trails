"use client";

import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface StudyChartProps {
  data: { label: string; value: number; color?: string }[];
  type: "bar" | "donut";
  title: string;
  unit?: string;
  height?: number;
}

export default function StudyChart({ data, type, title, unit = "", height = 180 }: StudyChartProps) {
  const { card, isSun, title: titleStyle, muted } = useCardStyles();

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (type === "donut") {
    const radius = 60;
    const cx = 80;
    const cy = 80;
    const circumference = 2 * Math.PI * radius;

    // Pre-compute offsets to avoid mutable variable in render
    const offsets: number[] = [];
    let runningOffset = 0;
    for (const d of data) {
      offsets.push(runningOffset);
      const pct = total > 0 ? d.value / total : 0;
      runningOffset += circumference * pct;
    }

    return (
      <div className={`${card} p-4`}>
        <h3 className={`text-sm font-bold font-[family-name:var(--font-nunito)] mb-3 ${titleStyle}`}>
          {title}
        </h3>
        <div className="flex items-center gap-4">
          <svg width={160} height={160} viewBox="0 0 160 160">
            {data.map((d, i) => {
              const pct = total > 0 ? d.value / total : 0;
              const dash = circumference * pct;
              const gap = circumference - dash;
              const color = d.color || `hsl(${(i * 60 + 240) % 360}, 70%, 60%)`;
              return (
                <motion.circle
                  key={i}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={20}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offsets[i]}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              );
            })}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-lg font-bold ${isSun ? "fill-slate-700" : "fill-white"}`}
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              {total.toFixed(0)}{unit}
            </text>
          </svg>
          <div className="space-y-1.5">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color || `hsl(${(i * 60 + 240) % 360}, 70%, 60%)` }}
                />
                <span className={`text-xs ${muted}`}>
                  {d.label}: {d.value}{unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bar chart
  return (
    <div className={`${card} p-4`}>
      <h3 className={`text-sm font-bold font-[family-name:var(--font-nunito)] mb-3 ${titleStyle}`}>
        {title}
      </h3>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / maxVal) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="w-full rounded-t-md min-h-[4px]"
              style={{
                background: d.color || (isSun
                  ? `linear-gradient(to top, rgb(139, 92, 246), rgb(124, 58, 237))`
                  : `linear-gradient(to top, rgb(124, 58, 237), rgb(167, 139, 250))`),
              }}
              title={`${d.label}: ${d.value}${unit}`}
            />
            <span className={`text-[9px] ${muted} text-center truncate w-full`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
