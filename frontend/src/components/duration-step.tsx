"use client";

import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TradeDuration } from "@/lib/types";

const DURATIONS: { value: TradeDuration; label: string; description: string }[] = [
  { value: 1, label: "1 Minute", description: "Fast scalping entries" },
  { value: 2, label: "2 Minutes", description: "Short momentum trades" },
  { value: 5, label: "5 Minutes", description: "Stronger trend confirmation" },
];

interface DurationStepProps {
  onSelect: (duration: TradeDuration) => void;
}

export function DurationStep({ onSelect }: DurationStepProps) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Clock3 className="h-6 w-6" />
        </div>
        <CardTitle>Choose Trade Duration</CardTitle>
        <CardDescription>
          Pick how long your binary option trade will run on Quotex.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {DURATIONS.map((item) => (
          <Button
            key={item.value}
            variant="outline"
            size="lg"
            className="h-auto flex-col items-start gap-1 rounded-2xl border-border/70 px-5 py-4 text-left hover:border-primary/50 hover:bg-primary/5"
            onClick={() => onSelect(item.value)}
          >
            <span className="text-base font-semibold">{item.label}</span>
            <span className="text-sm font-normal text-muted-foreground">{item.description}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
