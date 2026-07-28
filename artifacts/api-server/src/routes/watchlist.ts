import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import {
  db,
  watchlistTable,
  venuesTable,
  liveReportsTable,
  commentsTable,
} from "@workspace/db";
import {
  ListWatchlistResponse,
  AddToWatchlistResponse,
  GetMyActivityResponse,
} from "@workspace/api-zod";
import { presentVenue } from "../lib/venuePresenter";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/watchlist", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select({ venue: venuesTable })
    .from(watchlistTable)
    .innerJoin(venuesTable, eq(watchlistTable.venueId, venuesTable.id))
    .where(eq(watchlistTable.userId, req.userId!))
    .orderBy(desc(watchlistTable.createdAt));
  res.json(ListWatchlistResponse.parse(rows.map((r) => presentVenue(r.venue))));
});

router.post("/watchlist/:venueId", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const venueId = Number(req.params["venueId"]);
  if (!Number.isInteger(venueId) || venueId < 1) {
    res.status(400).json({ error: "Invalid venue id" });
    return;
  }
  const [venue] = await db.select({ id: venuesTable.id }).from(venuesTable).where(eq(venuesTable.id, venueId));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  const [inserted] = await db
    .insert(watchlistTable)
    .values({ userId: req.userId!, venueId })
    .onConflictDoNothing()
    .returning();
  if (inserted) {
    res.status(201).json(AddToWatchlistResponse.parse(inserted));
    return;
  }
  const [existing] = await db
    .select()
    .from(watchlistTable)
    .where(and(eq(watchlistTable.userId, req.userId!), eq(watchlistTable.venueId, venueId)));
  res.status(201).json(AddToWatchlistResponse.parse(existing));
});

router.delete("/watchlist/:venueId", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const venueId = Number(req.params["venueId"]);
  if (!Number.isInteger(venueId) || venueId < 1) {
    res.status(400).json({ error: "Invalid venue id" });
    return;
  }
  await db
    .delete(watchlistTable)
    .where(and(eq(watchlistTable.userId, req.userId!), eq(watchlistTable.venueId, venueId)));
  res.status(204).end();
});

router.get("/me/activity", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const [reports, comments] = await Promise.all([
    db
      .select({ report: liveReportsTable, venueName: venuesTable.name })
      .from(liveReportsTable)
      .innerJoin(venuesTable, eq(liveReportsTable.venueId, venuesTable.id))
      .where(eq(liveReportsTable.reporterId, req.userId!))
      .orderBy(desc(liveReportsTable.createdAt)),
    db
      .select({ comment: commentsTable, venueName: venuesTable.name })
      .from(commentsTable)
      .innerJoin(venuesTable, eq(commentsTable.venueId, venuesTable.id))
      .where(eq(commentsTable.authorId, req.userId!))
      .orderBy(desc(commentsTable.createdAt)),
  ]);
  res.json(
    GetMyActivityResponse.parse({
      reports: reports.map((r) => ({ ...r.report, venueName: r.venueName })),
      comments: comments.map((c) => ({ ...c.comment, venueName: c.venueName })),
    }),
  );
});

export default router;
