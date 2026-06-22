import type { Candle, SignalDirection } from "../types.js";

export type NextCandleClassification = "UP" | "DOWN" | "NORMAL" | "DOJI";
export type LiveDirection = "UP" | "DOWN" | "FLAT";

export interface LivePriceCheck {
  name: string;
  direction: LiveDirection;
  value: string;
}

export interface LivePriceSignal {
  livePrice: number;
  marketDirection: LiveDirection;
  nextCandleType: NextCandleClassification;
  entry: SignalDirection | null;
  checks: LivePriceCheck[];
  upCount: number;
  downCount: number;
  totalChecks: number;
  alignmentLabel: string;
  strength: "VERY HIGH" | "STRONG" | "MODERATE" | "WEAK";
  summary: string;
  entryPrice: string;
  entryAt: string;
  recentCandles: Candle[];
  formingCandle: Candle;
  analyzedBeforeCloseSec: number;
}

/** Signal fires in the 5–7 second window before candle close */
export const ANALYSIS_LEAD_SECONDS = 6;
export const ANALYSIS_WINDOW_MIN = 5;
export const ANALYSIS_WINDOW_MAX = 7;

export function analyzeLivePriceAction(
  candles: Candle[],
  livePrice: number,
  candleClosesAt: string,
  secondsUntilClose: number,
  durationMinutes: number
): LivePriceSignal {
  const recent = candles.slice(-5);
  const forming = { ...candles[candles.length - 1] };

  forming.close = livePrice;
  forming.high = Math.max(forming.high, livePrice);
  forming.low = Math.min(forming.low, livePrice);

  const formingMove = livePrice - forming.open;
  const formingRange = forming.high - forming.low || 0.00001;
  const bodyRatio = Math.abs(formingMove) / formingRange;

  const checks: LivePriceCheck[] = [];

  // Primary check: live price vs forming candle open (real market direction)
  if (formingMove > formingRange * 0.03) {
    checks.push({
      name: "Live price vs open",
      direction: "UP",
      value: `${fmt(livePrice)} above open ${fmt(forming.open)} (+${fmt(Math.abs(formingMove))})`,
    });
  } else if (formingMove < -formingRange * 0.03) {
    checks.push({
      name: "Live price vs open",
      direction: "DOWN",
      value: `${fmt(livePrice)} below open ${fmt(forming.open)} (-${fmt(Math.abs(formingMove))})`,
    });
  } else {
    checks.push({
      name: "Live price vs open",
      direction: "FLAT",
      value: `Price at open ${fmt(forming.open)} — doji forming`,
    });
  }

  const prevClose = candles.length > 1 ? candles[candles.length - 2].close : forming.open;
  const tickChange = livePrice - prevClose;

  if (tickChange > 0) {
    checks.push({
      name: "Live tick vs last close",
      direction: "UP",
      value: `+${fmt(Math.abs(tickChange))} above last close ${fmt(prevClose)}`,
    });
  } else if (tickChange < 0) {
    checks.push({
      name: "Live tick vs last close",
      direction: "DOWN",
      value: `-${fmt(Math.abs(tickChange))} below last close ${fmt(prevClose)}`,
    });
  } else {
    checks.push({
      name: "Live tick vs last close",
      direction: "FLAT",
      value: "Unchanged from last close",
    });
  }

  const closed = candles.slice(-4, -1);
  const greenClosed = closed.filter((c) => c.close > c.open).length;
  const redClosed = closed.filter((c) => c.close < c.open).length;

  if (greenClosed >= 2) {
    checks.push({
      name: "Recent closed candles",
      direction: "UP",
      value: `${greenClosed}/3 closed GREEN`,
    });
  } else if (redClosed >= 2) {
    checks.push({
      name: "Recent closed candles",
      direction: "DOWN",
      value: `${redClosed}/3 closed RED`,
    });
  } else {
    checks.push({
      name: "Recent closed candles",
      direction: "FLAT",
      value: "Mixed — no clear trend",
    });
  }

  const midCandle = (forming.high + forming.low) / 2;
  if (livePrice > midCandle + formingRange * 0.05) {
    checks.push({
      name: "Price in candle range",
      direction: "UP",
      value: "Live price in upper zone of forming candle",
    });
  } else if (livePrice < midCandle - formingRange * 0.05) {
    checks.push({
      name: "Price in candle range",
      direction: "DOWN",
      value: "Live price in lower zone of forming candle",
    });
  } else {
    checks.push({
      name: "Price in candle range",
      direction: "FLAT",
      value: "Live price at candle midpoint",
    });
  }

  const last3Closes = candles.slice(-3).map((c) => c.close);
  const closeTrend = livePrice - last3Closes[0];

  if (closeTrend > 0) {
    checks.push({
      name: "Live momentum",
      direction: "UP",
      value: `Rising: ${fmt(last3Closes[0])} → ${fmt(livePrice)}`,
    });
  } else if (closeTrend < 0) {
    checks.push({
      name: "Live momentum",
      direction: "DOWN",
      value: `Falling: ${fmt(last3Closes[0])} → ${fmt(livePrice)}`,
    });
  } else {
    checks.push({
      name: "Live momentum",
      direction: "FLAT",
      value: "Flat momentum",
    });
  }

  const upCount = checks.filter((c) => c.direction === "UP").length;
  const downCount = checks.filter((c) => c.direction === "DOWN").length;

  let nextCandleType: NextCandleClassification;
  let marketDirection: LiveDirection;

  if (bodyRatio < 0.08) {
    nextCandleType = "DOJI";
    marketDirection = "FLAT";
  } else if (formingMove > 0) {
    nextCandleType = "UP";
    marketDirection = "UP";
  } else if (formingMove < 0) {
    nextCandleType = "DOWN";
    marketDirection = "DOWN";
  } else {
    nextCandleType = "NORMAL";
    marketDirection = "FLAT";
  }

  // Signal follows real live price — CALL when price is above open, PUT when below
  const entry: SignalDirection | null =
    nextCandleType === "UP" ? "CALL" :
    nextCandleType === "DOWN" ? "PUT" :
    null;

  const formingDir: LiveDirection =
    formingMove > 0 ? "UP" : formingMove < 0 ? "DOWN" : "FLAT";
  const confirmCount =
    formingDir === "UP" ? upCount :
    formingDir === "DOWN" ? downCount : 0;

  const dominant = Math.max(upCount, downCount);
  const strength = getStrength(confirmCount, checks.length);

  const summary =
    marketDirection === "UP"
      ? `Live price ${fmt(livePrice)} is ABOVE open ${fmt(forming.open)} — candle closing UP · ${durationMinutes}min`
      : marketDirection === "DOWN"
        ? `Live price ${fmt(livePrice)} is BELOW open ${fmt(forming.open)} — candle closing DOWN · ${durationMinutes}min`
        : nextCandleType === "DOJI"
          ? `Live price at open ${fmt(forming.open)} — doji, no clear direction`
          : `Live price ranging at ${fmt(livePrice)}`;

  return {
    livePrice,
    marketDirection,
    nextCandleType,
    entry,
    checks,
    upCount,
    downCount,
    totalChecks: checks.length,
    alignmentLabel: `${confirmCount}/${checks.length} live checks confirm ${formingDir === "FLAT" ? "sideways" : formingDir}`,
    strength,
    summary,
    entryPrice: fmt(livePrice),
    entryAt: candleClosesAt,
    recentCandles: recent.map((c) =>
      c === candles[candles.length - 1] ? forming : c
    ),
    formingCandle: forming,
    analyzedBeforeCloseSec: secondsUntilClose || ANALYSIS_LEAD_SECONDS,
  };
}

function getStrength(
  confirmCount: number,
  total: number
): "VERY HIGH" | "STRONG" | "MODERATE" | "WEAK" {
  const ratio = confirmCount / total;
  if (ratio >= 0.8) return "VERY HIGH";
  if (ratio >= 0.6) return "STRONG";
  if (ratio >= 0.4) return "MODERATE";
  return "WEAK";
}

function fmt(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 10) return value.toFixed(3);
  return value.toFixed(5);
}
