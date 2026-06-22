"use client";

import type { LiveDirection, NextCandleClassification } from "@/lib/types";

interface ConfidenceRingProps {
  upCount: number;
  downCount: number;
  totalChecks: number;
  marketDirection: LiveDirection;
  nextCandleType: NextCandleClassification;
  strength: string;
  veryHigh?: boolean;
  direction?: "CALL" | "PUT" | null;
  size?: number;
}

export function ConfidenceRing({
  upCount,
  downCount,
  totalChecks,
  marketDirection,
  nextCandleType,
  strength,
  veryHigh = false,
  direction = null,
  size = 160,
}: ConfidenceRingProps) {
  const confirmCount =
    direction === "CALL" ? upCount :
    direction === "PUT" ? downCount :
    Math.max(upCount, downCount);
  const alignmentPercent = Math.round((confirmCount / totalChecks) * 100);

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (alignmentPercent / 100) * circumference;

  const color =
    veryHigh ? "#fbbf24" :
    nextCandleType === "UP" || marketDirection === "UP" ? "#10b981" :
    nextCandleType === "DOWN" || marketDirection === "DOWN" ? "#f43f5e" :
    nextCandleType === "DOJI" ? "#a78bfa" : "#71717a";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/40" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {confirmCount}/{totalChecks}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live confirmation</span>
        <span className="mt-0.5 text-[10px] font-medium" style={{ color }}>{strength}</span>
      </div>
    </div>
  );
}
