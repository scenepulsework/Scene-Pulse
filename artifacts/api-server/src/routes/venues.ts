import { Router, type IRouter } from "express";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db, venuesTable } from "@workspace/db";
import {
  ListVenuesQueryParams,
  ListVenuesResponse,
  GetVenueParams,
  GetVenueResponse,
  AddToWatchlistParams,
  AddToWatchlistResponse,
  RemoveFromWatchlistParams,
  RemoveFromWatchlistResponse,
} from "@workspace/api-zod";
import { presentVenue } from "../lib/venuePresenter";

const router: IRouter = Router();

const INTENT_TAG_MATCH: Record<string, string[]> = {
  dateNight: ["date night"],
  noWait: [],
  retailDrops: [],
  liveMusic: ["live music"],
  patioEnergy: ["patio"],
  lateNightFood: ["late-night food", "late night food"],
  speakeasy: ["speakeasy"],
};

router.get("/venues", async (req, res): Promise<void> => {
  const query = ListVenuesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { market, category, search, sort, intent } = query.data;

  const conditions = [];
  if (market) conditions.push(eq(venuesTable.market, market));
  if (category) conditions.push(eq(venuesTable.category, category));
  if (search) {
    conditions.push(
      or(
        ilike(venuesTable.name, `%${search}%`),
        ilike(venuesTable.city, `%${search}%`),
        ilike(venuesTable.address, `%${search}%`),
      ),
    );
  }

  let rows = await db
    .select()
    .from(venuesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (intent) {
    if (intent === "noWait") {
      rows = rows.filter((v) => v.waitTimeMinutes <= 10);
    } else if (intent === "retailDrops") {
      rows = rows.filter((v) => v.category === "retail");
    } else {
      const tags = INTENT_TAG_MATCH[intent] ?? [];
      rows = rows.filter((v) =>
        v.bestFor.some((tag) => tags.some((t) => tag.toLowerCase().includes(t))),
      );
    }
  }

  switch (sort) {
    case "crowdScore":
      rows.sort((a, b) => b.crowdScore - a.crowdScore);
      break;
    case "waitTime":
      rows.sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes);
      break;
    case "rating":
      rows.sort((a, b) => b.rating - a.rating);
      break;
    case "name":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "updated":
      rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    default:
      rows.sort((a, b) => b.crowdScore - a.crowdScore);
  }

  res.json(ListVenuesResponse.parse(rows.map(presentVenue)));
});

router.get("/venues/:id", async (req, res): Promise<void> => {
  const params = GetVenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(GetVenueResponse.parse(presentVenue(venue)));
});

router.post("/venues/:venueId/watchlist", async (req, res): Promise<void> => {
  const params = AddToWatchlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [venue] = await db
    .update(venuesTable)
    .set({ isWatchlisted: true })
    .where(eq(venuesTable.id, params.data.venueId))
    .returning();
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(AddToWatchlistResponse.parse(presentVenue(venue)));
});

router.delete("/venues/:venueId/watchlist", async (req, res): Promise<void> => {
  const params = RemoveFromWatchlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [venue] = await db
    .update(venuesTable)
    .set({ isWatchlisted: false })
    .where(eq(venuesTable.id, params.data.venueId))
    .returning();
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(RemoveFromWatchlistResponse.parse(presentVenue(venue)));
});

export default router;
