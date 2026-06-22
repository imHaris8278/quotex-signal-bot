"use client";

import { Building2, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketType } from "@/lib/types";

const MARKETS: {
  value: MarketType;
  label: string;
  description: string;
  icon: typeof Building2;
  note: string;
}[] = [
  {
    value: "real",
    label: "Real Market",
    description: "Live forex prices from Twelve Data API",
    icon: Building2,
    note: "Best accuracy — real market candles",
  },
  {
    value: "otc",
    label: "OTC Market",
    description: "Quotex OTC pairs (simulated analysis)",
    icon: Moon,
    note: "OTC prices are broker-specific — simulated data used",
  },
];

interface MarketStepProps {
  onSelect: (market: MarketType) => void;
  onBack: () => void;
}

export function MarketStep({ onSelect, onBack }: MarketStepProps) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle>Select Market Type</CardTitle>
        <CardDescription>Real market uses live API data. OTC uses simulated candles.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {MARKETS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.value}
              variant="outline"
              size="lg"
              className="h-auto flex-col items-start gap-2 rounded-2xl border-border/70 px-5 py-4 text-left hover:border-primary/50 hover:bg-primary/5"
              onClick={() => onSelect(item.value)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">{item.label}</span>
              </div>
              <span className="text-sm font-normal text-muted-foreground">{item.description}</span>
              <span className="text-xs font-normal text-muted-foreground/80">{item.note}</span>
            </Button>
          );
        })}
        <Button variant="ghost" onClick={onBack} className="mt-2">
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
