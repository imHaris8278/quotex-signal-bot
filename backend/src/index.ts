import dns from "node:dns";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { pairsRouter } from "./routes/pairs.js";
import { signalRouter } from "./routes/signal.js";

// Prefer IPv4 — avoids ENETUNREACH on networks without IPv6 routing
dns.setDefaultResultOrder("ipv4first");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      const allowed = [
        config.corsOrigin,
        "http://localhost:3000",
        "http://localhost:3006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3006",
      ];
      if (
        !origin ||
        allowed.includes(origin) ||
        /^https:\/\/[\w-]+\.herokuapp\.com$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/pairs", pairsRouter);
app.use("/api/signal", signalRouter);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Signal backend running on port ${config.port}`);
});
