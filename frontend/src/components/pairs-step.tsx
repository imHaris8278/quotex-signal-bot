"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { fetchPairs } from "@/lib/api";
import type { MarketType, PairInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PairsStepProps {
  market: MarketType;
  onSelect: (pair: PairInfo) => void;
  onBack: () => void;
}

export function PairsStep({ market, onSelect, onBack }: PairsStepProps) {
  const [pairs, setPairs] = useState<PairInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPairs(market);
        if (mounted) setPairs(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load pairs");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [market]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter(
      (pair) =>
        pair.label.toLowerCase().includes(q) ||
        pair.symbol.toLowerCase().includes(q)
    );
  }, [pairs, query]);

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Select Trading Pair</CardTitle>
        <CardDescription>
          {market === "real" ? "32 live forex pairs" : "20 OTC pairs"} — tap to generate signal
        </CardDescription>
        <div className="relative pt-2">
          <Search className="absolute top-5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pairs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading pairs...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
            {filtered.map((pair) => (
              <Button
                key={pair.id}
                variant="outline"
                className="h-12 justify-between rounded-xl border-border/70 px-4 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => onSelect(pair)}
              >
                <span className="font-medium">{pair.label}</span>
                <span className="text-xs text-muted-foreground">{pair.symbol}</span>
              </Button>
            ))}
            {!filtered.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">No pairs found</p>
            )}
          </div>
        )}

        <Button variant="ghost" onClick={onBack} className="mt-4 w-full">
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
