"use client";

import { ArrowDown, ArrowUp, Minus, Pause, Radio } from "lucide-react";
import type { Candle, LivePriceSignal, SignalResponse } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LiveSignalPanelProps {
  liveSignal: LivePriceSignal;
  signal: SignalResponse;
}

function fmt(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 10) return value.toFixed(3);
  return value.toFixed(5);
}

function candleColor(c: Candle): "green" | "red" | "doji" {
  const range = c.high - c.low;
  if (range === 0) return "doji";
  const body = c.close - c.open;
  if (body > range * 0.05) return "green";
  if (body < -range * 0.05) return "red";
  return "doji";
}

export function LiveSignalPanel({ liveSignal, signal }: LiveSignalPanelProps) {
  const isUp = liveSignal.marketDirection === "UP";
  const isDown = liveSignal.marketDirection === "DOWN";

  return (
    <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-5 w-5 animate-pulse text-emerald-400" />
          Live Market — real price data
        </CardTitle>
        <p className="text-sm text-muted-foreground">{liveSignal.summary}</p>
        <p className="text-xs text-muted-foreground">
          Twelve Data · read {liveSignal.analyzedBeforeCloseSec}s before candle close ·{" "}
          {signal.dataSource === "live" ? "Real market" : "Simulated"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className={cn(
            "rounded-xl border-2 p-4 text-center",
            isUp && "border-emerald-500/50 bg-emerald-500/10",
            isDown && "border-rose-500/50 bg-rose-500/10",
            !isUp && !isDown && "border-border/50 bg-background/50"
          )}
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Live price now</p>
          <div className={cn("mt-1 flex items-center justify-center gap-2 text-3xl font-bold", isUp && "text-emerald-400", isDown && "text-rose-400")}>
            {isUp && <ArrowUp className="h-8 w-8" />}
            {isDown && <ArrowDown className="h-8 w-8" />}
            {!isUp && !isDown && <Minus className="h-8 w-8" />}
            {isUp ? "PRICE ABOVE OPEN" : isDown ? "PRICE BELOW OPEN" : "AT OPEN"}
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{fmt(liveSignal.livePrice)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open {fmt(liveSignal.formingCandle.open)} · {liveSignal.alignmentLabel}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {(["UP", "DOWN", "NORMAL", "DOJI"] as const).map((t) => (
            <Badge
              key={t}
              variant={liveSignal.nextCandleType === t ? (t === "UP" ? "buy" : t === "DOWN" ? "sell" : "muted") : "outline"}
              className={cn(liveSignal.nextCandleType === t && t === "DOJI" && "border-violet-400/50 bg-violet-500/15 text-violet-300")}
            >
              Closing: {t}{liveSignal.nextCandleType === t ? " ✓" : ""}
            </Badge>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Last 5 candles (live OHLC from market)
          </p>
          <div className="space-y-1.5">
            {liveSignal.recentCandles.map((c, i) => {
              const color = candleColor(c);
              const isForming = i === liveSignal.recentCandles.length - 1;
              return (
                <div
                  key={`${c.datetime}-${i}`}
                  className={cn(
                    "grid grid-cols-[auto_1fr] gap-2 rounded-lg border px-3 py-2 text-xs tabular-nums",
                    isForming && "border-primary/40 bg-primary/5",
                    color === "green" && "border-emerald-500/20",
                    color === "red" && "border-rose-500/20"
                  )}
                >
                  <span className={cn("font-semibold uppercase", color === "green" && "text-emerald-400", color === "red" && "text-rose-400")}>
                    {isForming ? "LIVE" : color === "green" ? "UP" : color === "red" ? "DOWN" : "—"}
                  </span>
                  <span className="text-muted-foreground">
                    O {fmt(c.open)} · H {fmt(c.high)} · L {fmt(c.low)} · C {fmt(c.close)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/40 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Live price confirmation checks
          </p>
          <ul className="space-y-2">
            {liveSignal.checks.map((check) => (
              <li key={check.name} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{check.name}</span>
                <span className={cn("text-right font-medium", check.direction === "UP" && "text-emerald-400", check.direction === "DOWN" && "text-rose-400")}>
                  {check.direction === "UP" ? "↑" : check.direction === "DOWN" ? "↓" : "—"} {check.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {liveSignal.entry && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center text-sm">
            <p className="font-semibold">
              {liveSignal.entry} at {liveSignal.entryPrice}
            </p>
            <p className="text-xs text-muted-foreground">Candle closes {formatTime(liveSignal.entryAt)}</p>
          </div>
        )}

        {(liveSignal.nextCandleType === "DOJI" || liveSignal.nextCandleType === "NORMAL") && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Pause className="h-4 w-4" />
            No trade — live price shows {liveSignal.nextCandleType.toLowerCase()} candle
          </div>
        )}
      </CardContent>
    </Card>
  );
}
