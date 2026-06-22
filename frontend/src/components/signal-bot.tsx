"use client";

import { useEffect, useState } from "react";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { checkHealth } from "@/lib/api";
import type { AppStep, MarketType, PairInfo, TradeDuration } from "@/lib/types";
import { DurationStep } from "@/components/duration-step";
import { MarketStep } from "@/components/market-step";
import { PairsStep } from "@/components/pairs-step";
import { SignalView } from "@/components/signal-view";
import { StepIndicator } from "@/components/step-indicator";
import { Badge } from "@/components/ui/badge";

export function SignalBot() {
  const [step, setStep] = useState<AppStep>("duration");
  const [duration, setDuration] = useState<TradeDuration | null>(null);
  const [market, setMarket] = useState<MarketType | null>(null);
  const [selectedPair, setSelectedPair] = useState<PairInfo | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setBackendOnline);
    const interval = setInterval(() => {
      checkHealth().then(setBackendOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const reset = () => {
    setStep("duration");
    setDuration(null);
    setMarket(null);
    setSelectedPair(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Quotex Signal Bot</h1>
            <p className="text-sm text-muted-foreground">Live binary options signals</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {backendOnline === null ? (
            <Badge variant="muted">Checking backend...</Badge>
          ) : backendOnline ? (
            <Badge variant="buy" className="gap-1">
              <Wifi className="h-3 w-3" /> Backend online
            </Badge>
          ) : (
            <Badge variant="sell" className="gap-1">
              <WifiOff className="h-3 w-3" /> Backend offline — start backend on port 4000
            </Badge>
          )}
        </div>

        <StepIndicator currentStep={step} />
      </header>

      {step === "duration" && (
        <DurationStep
          onSelect={(value) => {
            setDuration(value);
            setStep("market");
          }}
        />
      )}

      {step === "market" && (
        <MarketStep
          onSelect={(value) => {
            setMarket(value);
            setStep("pairs");
          }}
          onBack={() => setStep("duration")}
        />
      )}

      {step === "pairs" && market && (
        <PairsStep
          market={market}
          onSelect={(pair) => {
            setSelectedPair(pair);
            setStep("signal");
          }}
          onBack={() => setStep("market")}
        />
      )}

      {step === "signal" && selectedPair && market && duration && (
        <SignalView
          pair={selectedPair}
          market={market}
          duration={duration}
          onBack={() => setStep("pairs")}
          onReset={reset}
        />
      )}
    </div>
  );
}
