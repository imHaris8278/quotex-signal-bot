import { Router } from "express";
import { getPairs } from "../data/pairs.js";
import type { MarketType } from "../types.js";

export const pairsRouter = Router();

pairsRouter.get("/", (req, res) => {
  const market = (req.query.market as MarketType) || "real";

  if (market !== "real" && market !== "otc") {
    res.status(400).json({ error: "Invalid market type. Use 'real' or 'otc'." });
    return;
  }

  res.json({ market, pairs: getPairs(market) });
});
