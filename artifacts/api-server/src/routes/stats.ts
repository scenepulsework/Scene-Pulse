import { Router, type IRouter } from "express";
import { gte } from "drizzle-orm";
import { db, venuesTable, liveReportsTable } from "@workspace/db";
import { GetHeroStatsResponse, GetHotZonesQueryParams, GetHotZonesResponse } from "@workspace/api-zod";
import { presentVenue } from "../lib/venuePresenter";

const router: IRouter = Router();

router.get("/stats/hero", async (_req, res): Promise<void> => {
  const rows = await db.select().from(venuesTable);
  const markets = new Set(rows.map((r) => r.market));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const reportsToday = await db
    .select()
    .from(liveReportsTable)
    .where(gte(liveReportsTable.createdAt, startOfDay));

  const totalVenues = rows.length;
  const averageCrowdScore = totalVenues
    ? Math.round(rows.reduce((sum, r) => sum + r.crowdScore, 0) / totalVenues)
    : 0;
  const packedNow = rows.filter((r) => r.crowdLevel === "packed").length;
  const openNow = rows.filter((r) => r.crowdLevel === "open").length;

  res.json(
    GetHeroStatsResponse.parse({
      totalVenues,
      marketsCovered: markets.size,
      liveReportsToday: reportsToday.length,
      averageCrowdScore,
      packedNow,
      openNow,
    }),
  );
});

router.get("/stats/hot-zones", async (req, res): Promise<void> => {
  const query = GetHotZonesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const rows = await db.select().from(venuesTable);
  const scoped = query.data.market ? rows.filter((r) => r.market === query.data.market) : rows;
  if (scoped.length === 0) {
    res.status(404).json({ error: "No venues available for hot zones" });
    return;
  }

  const hottestPin = [...scoped].sort((a, b) => b.crowdScore - a.crowdScore)[0];
  const fastestMove = [...scoped].sort((a, b) => {
    const trendWeight = (t: string) => (t === "rising" ? 2 : t === "falling" ? 1 : 0);
    return trendWeight(b.lineTrend) - trendWeight(a.lineTrend) || b.crowdScore - a.crowdScore;
  })[0];
  const mostOpen = [...scoped].sort((a, b) => a.crowdScore - b.crowdScore)[0];

  res.json(
    GetHotZonesResponse.parse({
      hottestPin: presentVenue(hottestPin),
      fastestMove: presentVenue(fastestMove),
      mostOpen: presentVenue(mostOpen),
    }),
  );
});

export default router;
