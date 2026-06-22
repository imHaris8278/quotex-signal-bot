"use client";

import { ArrowDown, ArrowUp, Ban, CheckCircle2 } from "lucide-react";
import type { CandleSignalRecord } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CandleHistoryProps {
  records: CandleSignalRecord[];
}

export function CandleHistory({ records }: CandleHistoryProps) {
  if (!records.length) return null;

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Live Signal History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.map((record, index) => (
          <div
            key={record.id}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm",
              record.confirmed
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-border/50 bg-background/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              {record.confirmed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Ban className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {index === 0 ? "Current" : `#${records.length - index}`} ·{" "}
                  {formatTime(record.nextCandleOpensAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {record.confirmed ? "Live checks aligned" : "Weak alignment"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {record.direction ? (
                <>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 font-semibold",
                      record.direction === "CALL" ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {record.direction === "CALL" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )}
                    {record.direction}
                  </span>
                  <Badge variant={record.veryHigh ? "very-high" : record.direction === "CALL" ? "buy" : "sell"}>
                    {record.veryHigh ? "Strong" : `${record.confidence}/5`}
                  </Badge>
                </>
              ) : (
                <Badge variant="muted">No Signal</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
