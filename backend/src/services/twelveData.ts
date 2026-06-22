import { config } from "../config.js";
import type { Candle } from "../types.js";
import { durationToInterval } from "../data/pairs.js";

interface TwelveDataCandleRow {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface TwelveDataTimeSeriesResponse {
  meta?: {
    symbol?: string;
    interval?: string;
    currency?: string;
    exchange?: string;
  };
  values?: TwelveDataCandleRow[];
  status?: string;
  message?: string;
  code?: number;
}

interface TwelveDataQuoteResponse {
  symbol?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  status?: string;
  message?: string;
}

export interface LiveMarketFetchResult {
  candles: Candle[];
  meta: {
    symbol: string;
    interval: string;
    exchange?: string;
    currency?: string;
  };
  quote?: {
    close: number;
    previousClose: number;
    change: number;
    changePercent: number;
    datetime?: string;
  };
}

const FETCH_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;
const CACHE_TTL_MS = 20_000;

interface CacheEntry {
  result: LiveMarketFetchResult;
  fetchedAt: number;
}

const marketCache = new Map<string, CacheEntry>();

function cacheKey(symbol: string, interval: string): string {
  return `${symbol}:${interval}`;
}

function parseCandle(row: TwelveDataCandleRow): Candle {
  return {
    datetime: row.datetime,
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close),
  };
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url);
      const data = (await response.json()) as T & { status?: string; message?: string };

      if (!response.ok || data.status === "error") {
        throw new Error(
          (data as { message?: string }).message ||
            `${label} request failed (HTTP ${response.status})`
        );
      }

      return data;
    } catch (error) {
      lastError = normalizeFetchError(error, label);

      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 500);
        continue;
      }
    }
  }

  throw lastError ?? new Error(`${label} request failed`);
}

function normalizeFetchError(error: unknown, label: string): Error {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new Error(`${label} timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
    }

    if (error.message === "fetch failed") {
      const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
      const detail = cause?.code || cause?.message || "network error";
      if (detail === "ENETUNREACH") {
        return new Error(
          `${label}: network unreachable — slow or blocked connection to Twelve Data. Retrying...`
        );
      }
      return new Error(`${label} network error (${detail})`);
    }

    return new Error(`${label}: ${error.message}`);
  }

  return new Error(`${label} request failed`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchLiveMarketData(
  symbol: string,
  durationMinutes: number,
  options?: { fresh?: boolean }
): Promise<LiveMarketFetchResult> {
  if (!config.twelveDataApiKey) {
    throw new Error("Twelve Data API key is not configured in backend/.env");
  }

  const interval = durationToInterval(durationMinutes);
  const key = cacheKey(symbol, interval);
  const cached = marketCache.get(key);

  if (!options?.fresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const quotePromise = fetchJson<TwelveDataQuoteResponse>(
      buildUrl("quote", { symbol }),
      "Twelve Data quote"
    ).catch(() => null);

    const [seriesData, quoteData] = await Promise.all([
      fetchJson<TwelveDataTimeSeriesResponse>(
        buildUrl("time_series", { symbol, interval, outputsize: "60" }),
        "Twelve Data candles"
      ) as Promise<TwelveDataTimeSeriesResponse>,
      quotePromise,
    ]);

    if (!seriesData.values?.length) {
      throw new Error("Twelve Data returned no candle data for this pair");
    }

    const candles = [...seriesData.values].reverse().map(parseCandle);

    let quote: LiveMarketFetchResult["quote"];
    if (quoteData && quoteData.close) {
      quote = {
        close: parseFloat(quoteData.close),
        previousClose: parseFloat(quoteData.previous_close || quoteData.close),
        change: parseFloat(quoteData.change || "0"),
        changePercent: parseFloat(quoteData.percent_change || "0"),
        datetime: quoteData.datetime,
      };
      const last = candles[candles.length - 1];
      last.close = quote.close;
      last.high = Math.max(last.high, quote.close);
      last.low = Math.min(last.low, quote.close);
    }

    const result: LiveMarketFetchResult = {
      candles,
      meta: {
        symbol: seriesData.meta?.symbol || symbol,
        interval: seriesData.meta?.interval || interval,
        exchange: seriesData.meta?.exchange || quoteData?.exchange,
        currency: seriesData.meta?.currency || quoteData?.currency,
      },
      quote,
    };

    marketCache.set(key, { result, fetchedAt: Date.now() });
    return result;
  } catch (error) {
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS * 3) {
      console.warn(`[twelveData] Using cached data for ${symbol} after fetch failure`);
      return cached.result;
    }
    throw error;
  }
}

export async function fetchLiveCandles(
  symbol: string,
  durationMinutes: number
): Promise<Candle[]> {
  const result = await fetchLiveMarketData(symbol, durationMinutes);
  return result.candles;
}

export function generateSimulatedCandles(
  seed: string,
  durationMinutes: number,
  count = 60
): Candle[] {
  let state = hashSeed(seed);
  const basePrice = 1 + (state % 1000) / 100;
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  const durationMs = durationMinutes * 60 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const drift = ((state % 100) - 50) / 100000;
    const volatility = ((state % 50) + 10) / 100000;

    const open = price;
    const close = open + drift + (((state >> 8) % 100) - 50) * volatility;
    const high = Math.max(open, close) + volatility * 2;
    const low = Math.min(open, close) - volatility * 2;

    candles.push({
      datetime: new Date(now - i * durationMs).toISOString(),
      open,
      high,
      low,
      close,
    });

    price = close;
  }

  return candles;
}

function buildUrl(endpoint: string, params: Record<string, string>): string {
  const url = new URL(`https://api.twelvedata.com/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("apikey", config.twelveDataApiKey);
  return url.toString();
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildLiveMarketSnapshot(
  fetchResult: LiveMarketFetchResult
): import("../types.js").LiveMarketData {
  const { candles, meta, quote } = fetchResult;
  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles.length > 1 ? candles[candles.length - 2] : null;

  const currentPrice = quote?.close ?? lastCandle.close;
  const previousClose = quote?.previousClose ?? previousCandle?.close ?? lastCandle.open;
  const change = quote?.change ?? currentPrice - previousClose;
  const changePercent =
    quote?.changePercent ??
    (previousClose !== 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0);

  return {
    symbol: meta.symbol,
    interval: meta.interval,
    fetchedAt: new Date().toISOString(),
    currentPrice,
    previousClose,
    change,
    changePercent: Number(changePercent.toFixed(4)),
    lastCandle,
    previousCandle,
    candleCount: candles.length,
    recentCandles: candles.slice(-5),
    exchange: meta.exchange,
    currency: meta.currency,
  };
}

export function buildSimulatedMarketSnapshot(
  candles: Candle[],
  symbol: string,
  interval: string
): import("../types.js").LiveMarketData {
  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles.length > 1 ? candles[candles.length - 2] : null;
  const currentPrice = lastCandle.close;
  const previousClose = previousCandle?.close ?? lastCandle.open;
  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    interval,
    fetchedAt: new Date().toISOString(),
    currentPrice,
    previousClose,
    change,
    changePercent: Number(changePercent.toFixed(4)),
    lastCandle,
    previousCandle,
    candleCount: candles.length,
    exchange: "OTC Simulated",
  };
}
