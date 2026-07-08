import { Router, type IRouter } from "express";
import { db, venuesTable } from "@workspace/db";
import { ListMarketsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/markets", async (_req, res): Promise<void> => {
  const rows = await db.select().from(venuesTable);
  const byMarket = new Map<string, { market: string; city: string; region: string; country: string; venueCount: number }>();
  for (const row of rows) {
    const existing = byMarket.get(row.market);
    if (existing) {
      existing.venueCount += 1;
    } else {
      byMarket.set(row.market, {
        market: row.market,
        city: row.city,
        region: row.region,
        country: row.country,
        venueCount: 1,
      });
    }
  }
  const markets = Array.from(byMarket.values()).sort((a, b) => a.market.localeCompare(b.market));
  res.json(ListMarketsResponse.parse(markets));
});

export default router;
