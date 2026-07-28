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
  VerifyVenueClaimParams,
  VerifyVenueClaimBody,
  VerifyVenueClaimResponse,
  CancelVenueClaimParams,
  ListOperatorVenuesResponse,
} from "@workspace/api-zod";
import { presentVenue } from "../lib/venuePresenter";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

type ClaimRow = typeof venueClaimsTable.$inferSelect;

// No email provider is connected yet, so in development the code is surfaced
// to the claimant directly instead of being emailed to the venue's contact.
function presentClaim(claim: ClaimRow) {
  const { verificationCode, ...rest } = claim;
  const isDev = process.env.NODE_ENV !== "production";
  return {
    ...rest,
    ...(isDev && claim.status === "pending" ? { devVerificationCode: verificationCode } : {}),
  };
}

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
    .where(
      and(
        eq(venueClaimsTable.venueId, params.data.id),
        eq(venueClaimsTable.operatorUserId, req.userId!),
      ),
    );
  if (!claim) {
    res.status(403).json({ error: "You have not claimed this venue" });
    return;
  }
  if (claim.status !== "verified") {
    res.status(403).json({ error: "Your claim is pending verification — verify it before editing" });
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

const CLAIM_TTL_MS = 24 * 60 * 60 * 1000;

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
  const claims = await db
    .select()
    .from(venueClaimsTable)
    .where(eq(venueClaimsTable.venueId, params.data.id));
  // Only a VERIFIED claim blocks other operators; pending claims from others don't.
  const verified = claims.find((c) => c.status === "verified");
  if (verified) {
    if (verified.operatorUserId === req.userId) {
      res.status(201).json(ClaimVenueResponse.parse(presentClaim(verified)));
      return;
    }
    res.status(409).json({ error: "Venue already claimed by a verified operator" });
    return;
  }
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + CLAIM_TTL_MS);
  const own = claims.find((c) => c.operatorUserId === req.userId);
  if (own) {
    // Re-claiming refreshes the code and expiry.
    const [refreshed] = await db
      .update(venueClaimsTable)
      .set({ verificationCode, expiresAt })
      .where(eq(venueClaimsTable.id, own.id))
      .returning();
    req.log.info({ venueId: refreshed.venueId }, "Venue claim refreshed, new verification code issued");
    res.status(201).json(ClaimVenueResponse.parse(presentClaim(refreshed)));
    return;
  }
  const [claim] = await db
    .insert(venueClaimsTable)
    .values({ venueId: params.data.id, operatorUserId: req.userId!, verificationCode, expiresAt })
    .returning();
  req.log.info({ venueId: claim.venueId }, "Venue claim created, verification code issued");
  res.status(201).json(ClaimVenueResponse.parse(presentClaim(claim)));
});

router.delete("/venues/:id/claim", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = CancelVenueClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted = await db
    .delete(venueClaimsTable)
    .where(
      and(
        eq(venueClaimsTable.venueId, params.data.id),
        eq(venueClaimsTable.operatorUserId, req.userId!),
        eq(venueClaimsTable.status, "pending"),
      ),
    )
    .returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "No pending claim by you for this venue" });
    return;
  }
  res.status(204).end();
});

router.post("/venues/:id/claim/verify", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = VerifyVenueClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = VerifyVenueClaimBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [claim] = await db
    .select()
    .from(venueClaimsTable)
    .where(
      and(
        eq(venueClaimsTable.venueId, params.data.id),
        eq(venueClaimsTable.operatorUserId, req.userId!),
      ),
    );
  if (!claim || claim.status !== "pending") {
    res.status(404).json({ error: "No pending claim by you for this venue" });
    return;
  }
  if (claim.expiresAt && claim.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Verification code expired — re-submit the claim to get a new code" });
    return;
  }
  if (body.data.code !== claim.verificationCode) {
    res.status(400).json({ error: "Incorrect verification code" });
    return;
  }
  const [alreadyVerified] = await db
    .select()
    .from(venueClaimsTable)
    .where(
      and(eq(venueClaimsTable.venueId, params.data.id), eq(venueClaimsTable.status, "verified")),
    );
  if (alreadyVerified) {
    res.status(409).json({ error: "Venue already claimed by a verified operator" });
    return;
  }
  const [verified] = await db
    .update(venueClaimsTable)
    .set({ status: "verified", verifiedAt: new Date() })
    .where(eq(venueClaimsTable.id, claim.id))
    .returning();
  // Competing pending claims are now moot.
  await db
    .delete(venueClaimsTable)
    .where(
      and(eq(venueClaimsTable.venueId, params.data.id), eq(venueClaimsTable.status, "pending")),
    );
  res.json(VerifyVenueClaimResponse.parse(presentClaim(verified)));
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
  const statusByVenue = new Map(claims.map((c) => [c.venueId, c.status]));
  res.json(
    ListOperatorVenuesResponse.parse(
      rows.map((v) => ({ ...presentVenue(v), claimStatus: statusByVenue.get(v.id) })),
    ),
  );
});

export default router;
