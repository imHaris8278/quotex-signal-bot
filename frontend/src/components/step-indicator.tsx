"use client";

import { cn } from "@/lib/utils";
import type { AppStep } from "@/lib/types";

const STEPS: { id: AppStep; label: string }[] = [
  { id: "duration", label: "Duration" },
  { id: "market", label: "Market" },
  { id: "pairs", label: "Pair" },
  { id: "signal", label: "Signal" },
];

export function StepIndicator({ currentStep }: { currentStep: AppStep }) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isComplete && "border-emerald-500 bg-emerald-500/20 text-emerald-400",
                  !isActive && !isComplete && "border-border text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] uppercase tracking-wide sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-px w-6 sm:w-10",
                  isComplete ? "bg-emerald-500/60" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
