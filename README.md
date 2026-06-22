# Quotex Signal Bot

Live binary options signal bot with an Express backend (Twelve Data API) and a Next.js frontend.

## Setup

```bash
npm run install:all
```

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and add your Twelve Data API key:

```
TWELVE_DATA_API_KEY=your_key_here
PORT=4000
CORS_ORIGIN=http://localhost:3006
```

### Frontend (`frontend/.env.local`)

```
BACKEND_URL=http://localhost:4000
```

## Run

```bash
npm run dev
```

- **Backend:** http://localhost:4000
- **Frontend:** http://localhost:3006

## Flow

1. Choose trade duration (1, 2, or 5 minutes)
2. Select Real or OTC market
3. Pick a pair
4. **UP** or **DOWN** signal appears 5–7 seconds before candle close (clears at 8–10s for the next signal)

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/pairs?market=real\|otc` | List pairs |
| GET | `/api/signal/:pairId?market=&duration=` | Live signal |

## Notes

- **Real market** uses live prices from [Twelve Data](https://twelvedata.com)
- **OTC market** uses simulated candles (broker OTC feeds are not public)
- Never commit `.env` files or API keys
