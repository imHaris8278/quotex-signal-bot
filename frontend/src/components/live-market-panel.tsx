"use client";

import { ArrowDown, ArrowUp, Radio } from "lucide-react";
import type { LiveMarketData } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LiveMarketPanelProps {
  data: LiveMarketData;
  dataSource: "live" | "simulated";
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 10) return value.toFixed(3);
  return value.toFixed(5);
}

function formatCandleTime(datetime: string): string {
  const parsed = new Date(datetime);
  if (Number.isNaN(parsed.getTime())) return datetime;
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveMarketPanel({ data, dataSource }: LiveMarketPanelProps) {
  const isUp = data.change >= 0;

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4 text-emerald-400" />
            Live Market Data
          </CardTitle>
          <Badge variant={dataSource === "live" ? "buy" : "muted"}>
            {dataSource === "live" ? "Twelve Data" : "Simulated"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {data.symbol} · {data.interval} · Updated {formatTime(data.fetchedAt)}
          {data.exchange ? ` · ${data.exchange}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Price</p>
            <p className="text-3xl font-bold tabular-nums">{formatPrice(data.currentPrice)}</p>
          </div>
          <div className={cn("text-right", isUp ? "text-emerald-400" : "text-rose-400")}>
            <div className="flex items-center justify-end gap-1 text-lg font-semibold tabular-nums">
              {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {isUp ? "+" : ""}
              {formatPrice(data.change)}
            </div>
            <p className="text-sm tabular-nums">
              {isUp ? "+" : ""}
              {data.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Open" value={formatPrice(data.lastCandle.open)} />
          <Stat label="High" value={formatPrice(data.lastCandle.high)} />
          <Stat label="Low" value={formatPrice(data.lastCandle.low)} />
          <Stat label="Close" value={formatPrice(data.lastCandle.close)} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span>Prev close: {formatPrice(data.previousClose)}</span>
          <span>Candles analyzed: {data.candleCount}</span>
          <span>Last candle: {formatCandleTime(data.lastCandle.datetime)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
