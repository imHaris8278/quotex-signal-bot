import { Router } from "express";
import { durationToInterval, findPair } from "../data/pairs.js";
import { analyzeCandles } from "../services/analyzer.js";
import { getCandleTiming } from "../services/candleTiming.js";
import {
  buildLiveMarketSnapshot,
  buildSimulatedMarketSnapshot,
  fetchLiveMarketData,
  generateSimulatedCandles,
} from "../services/twelveData.js";
import type { MarketType, TradeDuration } from "../types.js";

export const signalRouter = Router();

signalRouter.get("/timing/:duration", (req, res) => {
  const duration = parseInt(req.params.duration, 10) as TradeDuration;

  if (![1, 2, 5].includes(duration)) {
    res.status(400).json({ error: "Duration must be 1, 2, or 5 minutes." });
    return;
  }

  res.json(getCandleTiming(duration));
});

signalRouter.get("/:pairId", async (req, res) => {
  try {
    const pairId = req.params.pairId;
    const market = (req.query.market as MarketType) || "real";
    const duration = parseInt(String(req.query.duration || "1"), 10) as TradeDuration;

    if (market !== "real" && market !== "otc") {
      res.status(400).json({ error: "Invalid market type." });
      return;
    }

    if (![1, 2, 5].includes(duration)) {
      res.status(400).json({ error: "Duration must be 1, 2, or 5 minutes." });
      return;
    }

    const pair = findPair(pairId, market);
    if (!pair) {
      res.status(404).json({ error: "Pair not found." });
      return;
    }

    let candles;
    let dataSource: "live" | "simulated" = "live";
    let liveMarket;

    const timing = getCandleTiming(duration);
    const inSignalWindow =
      timing.secondsUntilClose <= 7 && timing.secondsUntilClose >= 5;

    if (market === "real") {
      try {
        const marketData = await fetchLiveMarketData(pair.symbol, duration, {
          fresh: inSignalWindow,
        });
        candles = marketData.candles;
        liveMarket = buildLiveMarketSnapshot(marketData);
      } catch (liveError) {
        const message = liveError instanceof Error ? liveError.message : "Live data unavailable";
        console.error(`[signal] Live fetch failed for ${pair.symbol}:`, message);
        res.status(502).json({
          error: message,
          hasSignal: false,
          message: "No Signal",
          candle: getCandleTiming(duration),
        });
        return;
      }
    } else {
      const seed = `${pair.id}-${timing.openedAt}`;
      candles = generateSimulatedCandles(seed, duration);
      dataSource = "simulated";
      liveMarket = buildSimulatedMarketSnapshot(
        candles,
        pair.symbol,
        durationToInterval(duration)
      );
    }

    const signal = analyzeCandles(candles, {
      symbol: pair.label,
      market,
      duration,
      dataSource,
      liveMarket,
    });

    res.json(signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
});
