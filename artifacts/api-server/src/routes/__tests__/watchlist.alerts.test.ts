/**
 * Integration tests for PUT /watchlist/:venueId/alerts
 *
 * Covers:
 * - Toggle alertsEnabled from true → false and back
 * - 400 on invalid venue id
 * - 400 on missing / wrong body shape
 * - 404 when venue is not in the user's watchlist
 * - Another user's watchlist entry is unaffected (ownership isolation)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import supertest from "supertest";
import { db, venuesTable, watchlistTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Mock requireAuth
// ---------------------------------------------------------------------------

let activeUserId = "watchlist_alerts_test_user_default";

vi.mock("../../middlewares/requireAuth", () => ({
  requireAuth: (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
    req.userId = activeUserId;
    next();
  },
}));

const { default: watchlistRouter } = await import("../watchlist");

function makeApp(userId: string) {
  activeUserId = userId;
  const app = express();
  app.use(express.json());
  app.use(watchlistRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Test identifiers
// ---------------------------------------------------------------------------

const USER_1 = "watchlist_alerts_test_user_1";
const USER_2 = "watchlist_alerts_test_user_2";
const TEST_PREFIX = "watchlist_alerts_test";

let testVenueId: number;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  const [venue] = await db
    .insert(venuesTable)
    .values({
      name: `${TEST_PREFIX} Venue`,
      category: "Bar",
      city: "Testville",
      market: "test",
      region: "test",
      country: "US",
      latitude: 0,
      longitude: 0,
      address: "1 Test St",
      rating: 4.0,
      crowdScore: 50,
      crowdLevel: "lively",
      waitTimeMinutes: 5,
      headcount: 100,
      lineTrend: "steady",
      seatingOdds: "50%",
      noiseLevel: "moderate",
      coverCost: "none",
      bestTimeWindow: "10pm-midnight",
      bestFor: [],
      operatorGapNote: "",
      peakPressureWindow: "",
      reservationSignal: "none",
      staffingSignal: "adequate",
      dataSignalsTracked: [],
      arrivalTips: [],
      photos: [],
    })
    .returning({ id: venuesTable.id });

  testVenueId = venue.id;
});

afterAll(async () => {
  await db.delete(venuesTable).where(eq(venuesTable.id, testVenueId));
});

async function addToWatchlist(userId: string, venueId: number, alertsEnabled = true) {
  await db
    .insert(watchlistTable)
    .values({ userId, venueId, alertsEnabled })
    .onConflictDoNothing();
}

async function removeFromWatchlist(userId: string, venueId: number) {
  await db
    .delete(watchlistTable)
    .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.venueId, venueId)));
}

async function getWatchlistEntry(userId: string, venueId: number) {
  const [row] = await db
    .select()
    .from(watchlistTable)
    .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.venueId, venueId)));
  return row;
}

beforeEach(async () => {
  await removeFromWatchlist(USER_1, testVenueId);
  await removeFromWatchlist(USER_2, testVenueId);
});

afterEach(async () => {
  await removeFromWatchlist(USER_1, testVenueId);
  await removeFromWatchlist(USER_2, testVenueId);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /watchlist/:venueId/alerts", () => {
  it("disables alerts for a watchlist entry (true → false)", async () => {
    await addToWatchlist(USER_1, testVenueId, true);

    const res = await supertest(makeApp(USER_1))
      .put(`/watchlist/${testVenueId}/alerts`)
      .send({ alertsEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.alertsEnabled).toBe(false);

    const row = await getWatchlistEntry(USER_1, testVenueId);
    expect(row?.alertsEnabled).toBe(false);
  });

  it("enables alerts for a watchlist entry (false → true)", async () => {
    await addToWatchlist(USER_1, testVenueId, false);

    const res = await supertest(makeApp(USER_1))
      .put(`/watchlist/${testVenueId}/alerts`)
      .send({ alertsEnabled: true });

    expect(res.status).toBe(200);
    expect(res.body.alertsEnabled).toBe(true);

    const row = await getWatchlistEntry(USER_1, testVenueId);
    expect(row?.alertsEnabled).toBe(true);
  });

  it("does not affect another user's watchlist entry", async () => {
    await addToWatchlist(USER_1, testVenueId, true);
    await addToWatchlist(USER_2, testVenueId, true);

    await supertest(makeApp(USER_1))
      .put(`/watchlist/${testVenueId}/alerts`)
      .send({ alertsEnabled: false });

    const rowUser2 = await getWatchlistEntry(USER_2, testVenueId);
    expect(rowUser2?.alertsEnabled).toBe(true); // USER_2's setting unchanged
  });

  it("returns 404 when the venue is not in the user's watchlist", async () => {
    const res = await supertest(makeApp(USER_1))
      .put(`/watchlist/${testVenueId}/alerts`)
      .send({ alertsEnabled: false });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 for a non-integer venue id", async () => {
    const res = await supertest(makeApp(USER_1))
      .put("/watchlist/abc/alerts")
      .send({ alertsEnabled: false });

    expect(res.status).toBe(400);
  });

  it("returns 400 when alertsEnabled is missing from the body", async () => {
    await addToWatchlist(USER_1, testVenueId, true);

    const res = await supertest(makeApp(USER_1))
      .put(`/watchlist/${testVenueId}/alerts`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 when alertsEnabled is not a boolean", async () => {
    await addToWatchlist(USER_1, testVenueId, true);

    const res = await supertest(makeApp(USER_1))
      .put(`/watchlist/${testVenueId}/alerts`)
      .send({ alertsEnabled: "yes" });

    expect(res.status).toBe(400);
  });
});
