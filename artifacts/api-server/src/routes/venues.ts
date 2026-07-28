import { Router, type IRouter } from "express";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { db, venuesTable, venueClaimsTable } from "@workspace/db";
import {
  ListVenuesQueryParams,
  ListVenuesResponse,
  GetVenueParams,
  GetVenueResponse,
  UpdateVenueParams,
  UpdateVenueBody,
  UpdateVenueResponse,
  ClaimVenueParams,
  ClaimVenueResponse,
  ListOperatorVenuesResponse,
} from "@workspace/api-zod";
import { presentVenue } from "../lib/venuePresenter";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

const INTENT_TAG_MATCH: Record<string, string[]> = {
  dateNight: ["date night"],
  noWait: [],
  retailDrops: [],
  liveMusic: ["live music"],
  patioEnergy: ["patio"],
  lateNightFood: ["late-night food", "late night food"],
  speakeasy: ["speakeasy"],
  interactiveBars: ["pool table", "shuffleboard", "bar game", "game bar", "interactive bar", "darts", "foosball", "ping pong", "bocce"],
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

router.patch("/venues/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = UpdateVenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateVenueBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  const [claim] = await db
    .select()
    .from(venueClaimsTable)
    .where(eq(venueClaimsTable.venueId, params.data.id));
  if (!claim || claim.operatorUserId !== req.userId) {
    res.status(403).json({ error: "You have not claimed this venue" });
    return;
  }
  const updates = Object.fromEntries(
    Object.entries(body.data).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(updates).length === 0) {
    res.json(UpdateVenueResponse.parse(presentVenue(venue)));
    return;
  }
  const [updated] = await db
    .update(venuesTable)
    .set(updates)
    .where(eq(venuesTable.id, params.data.id))
    .returning();
  res.json(UpdateVenueResponse.parse(presentVenue(updated)));
});

router.post("/venues/:id/claim", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = ClaimVenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  const [existing] = await db
    .select()
    .from(venueClaimsTable)
    .where(eq(venueClaimsTable.venueId, params.data.id));
  if (existing) {
    if (existing.operatorUserId === req.userId) {
      res.status(201).json(ClaimVenueResponse.parse(existing));
      return;
    }
    res.status(409).json({ error: "Venue already claimed by another operator" });
    return;
  }
  const [claim] = await db
    .insert(venueClaimsTable)
    .values({ venueId: params.data.id, operatorUserId: req.userId! })
    .returning();
  res.status(201).json(ClaimVenueResponse.parse(claim));
});

router.get("/operator/venues", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const claims = await db
    .select()
    .from(venueClaimsTable)
    .where(eq(venueClaimsTable.operatorUserId, req.userId!));
  if (claims.length === 0) {
    res.json([]);
    return;
  }
  const rows = await db
    .select()
    .from(venuesTable)
    .where(inArray(venuesTable.id, claims.map((c) => c.venueId)));
  res.json(ListOperatorVenuesResponse.parse(rows.map(presentVenue)));
});

export default router;
