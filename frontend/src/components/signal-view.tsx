"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Minus, RefreshCw } from "lucide-react";
import { fetchSignal } from "@/lib/api";
import type { MarketType, PairInfo, SignalResponse, TradeDuration } from "@/lib/types";
import { cn, formatCountdown } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CLEAR_MIN = 8;
const CLEAR_MAX = 10;
const FETCH_MIN = 5;
const FETCH_MAX = 7;

interface SignalViewProps {
  pair: PairInfo;
  market: MarketType;
  duration: TradeDuration;
  onBack: () => void;
  onReset: () => void;
}

function getCandleTiming(durationMinutes: TradeDuration) {
  const durationMs = durationMinutes * 60 * 1000;
  const now = Date.now();
  const closesAt = Math.floor(now / durationMs) * durationMs + durationMs;
  const secondsUntilClose = Math.max(0, Math.ceil((closesAt - now) / 1000));
  return { closesAt, secondsUntilClose };
}

function signalLabel(direction: SignalResponse["direction"]): "UP" | "DOWN" | null {
  if (direction === "CALL") return "UP";
  if (direction === "PUT") return "DOWN";
  return null;
}

function fmtPrice(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 10) return value.toFixed(3);
  return value.toFixed(5);
}

export function SignalView({ pair, market, duration, onBack, onReset }: SignalViewProps) {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [signal, setSignal] = useState<SignalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);
  const fetchedForCloseRef = useRef<number | null>(null);

  const loadSignal = useCallback(async (closesAt: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSignal(pair.id, market, duration);
      setSignal(data);
      fetchedForCloseRef.current = closesAt;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch signal");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [pair.id, market, duration]);

  useEffect(() => {
    setMounted(true);

    const tick = () => {
      const { closesAt, secondsUntilClose } = getCandleTiming(duration);
      setCountdown(secondsUntilClose);

      const inFetchWindow =
        secondsUntilClose <= FETCH_MAX && secondsUntilClose >= FETCH_MIN;

      if (inFetchWindow && fetchedForCloseRef.current !== closesAt && !fetchingRef.current) {
        void loadSignal(closesAt);
      }
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [duration, loadSignal]);

  if (!mounted) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const inClearWindow = countdown <= CLEAR_MAX && countdown >= CLEAR_MIN;
  const label = signal ? signalLabel(signal.direction) : null;
  const livePrice = signal?.liveSignal?.livePrice ?? signal?.liveMarket?.currentPrice;
  const showSignal = !inClearWindow && !loading && label;
  const showNoSignal = !inClearWindow && !loading && !error && signal && !label;
  const showIdle = !inClearWindow && !loading && !error && !signal;
  const secondsUntilNext = Math.max(0, countdown - CLEAR_MAX);

  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        <div className="border-b border-border/50 px-5 py-4 text-center">
          <p className="text-lg font-semibold">{pair.label}</p>
          <p className="text-sm text-muted-foreground">
            {duration} min · {market === "real" ? "Live" : "OTC"}
          </p>
        </div>

        <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-10">
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading live price…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-rose-400">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const { closesAt } = getCandleTiming(duration);
                  void loadSignal(closesAt);
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && inClearWindow && (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-5xl font-bold tabular-nums text-muted-foreground/50">
                {countdown}
              </p>
              <p className="text-sm text-muted-foreground">Next signal incoming…</p>
            </div>
          )}

          {!loading && !error && !inClearWindow && showSignal && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className={cn(
                  "flex h-40 w-40 items-center justify-center rounded-full transition-all duration-300",
                  label === "UP"
                    ? "bg-emerald-500/15 ring-4 ring-emerald-500/30"
                    : "bg-rose-500/15 ring-4 ring-rose-500/30"
                )}
              >
                {label === "UP" ? (
                  <ArrowUp className="h-20 w-20 text-emerald-400" strokeWidth={2.5} />
                ) : (
                  <ArrowDown className="h-20 w-20 text-rose-400" strokeWidth={2.5} />
                )}
              </div>
              <p
                className={cn(
                  "text-5xl font-black tracking-tight",
                  label === "UP" ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {label}
              </p>
              {livePrice != null && (
                <p className="text-sm tabular-nums text-muted-foreground">{fmtPrice(livePrice)}</p>
              )}
            </div>
          )}

          {!loading && !error && !inClearWindow && (showNoSignal || showIdle) && (
            <div className="flex flex-col items-center gap-3 text-center">
              <Minus className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-base text-muted-foreground">Waiting for signal</p>
              {secondsUntilNext > 0 && (
                <p className="text-sm tabular-nums text-muted-foreground/60">
                  Next in {formatCountdown(secondsUntilNext)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border/50 p-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Change Pair
          </Button>
          <Button variant="ghost" onClick={onReset} className="flex-1">
            Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
