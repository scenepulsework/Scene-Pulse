/**
 * Integration tests for the notifications endpoints.
 *
 * GET /notifications
 * - Returns only the requesting user's notifications, ordered newest-first
 * - Returns an empty array when the user has no notifications
 * - Returns 401 without a valid session
 *
 * PUT /notifications/read-all
 * - Marks all unread notifications as read for the requesting user
 * - Does not affect another user's notifications
 *
 * PUT /notifications/:id/read
 * - Marks a single notification as read
 * - Returns 404 for a notification belonging to another user (ownership isolation)
 * - Returns 400 for an invalid (non-integer) notification id
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import supertest from "supertest";
import { db, venuesTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Mock requireAuth
// ---------------------------------------------------------------------------

let activeUserId: string | null = "notif_test_default";

vi.mock("../../middlewares/requireAuth", () => ({
  requireAuth: (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
    if (!activeUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.userId = activeUserId;
    next();
  },
}));

const { default: notificationsRouter } = await import("../notifications");

function makeApp(userId: string | null) {
  activeUserId = userId;
  const app = express();
  app.use(express.json());
  app.use(notificationsRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Test identifiers
// ---------------------------------------------------------------------------

const USER_A = "notif_test_user_a";
const USER_B = "notif_test_user_b";
const TEST_PREFIX = "notif_test";

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

async function seedNotification(userId: string, overrides?: Partial<{ message: string; isRead: boolean }>) {
  const [row] = await db
    .insert(notificationsTable)
    .values({
      userId,
      venueId: testVenueId,
      venueName: "Test Venue",
      message: overrides?.message ?? "Test notification",
      crowdLevel: "packed",
      waitTimeMinutes: 5,
    })
    .returning();
  if (overrides?.isRead) {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, row.id));
    return { ...row, isRead: true };
  }
  return row;
}

async function cleanupNotifications(...userIds: string[]) {
  for (const userId of userIds) {
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
  }
}

beforeEach(async () => {
  await cleanupNotifications(USER_A, USER_B);
});

afterEach(async () => {
  await cleanupNotifications(USER_A, USER_B);
});

// ---------------------------------------------------------------------------
// Tests: GET /notifications
// ---------------------------------------------------------------------------

describe("GET /notifications", () => {
  it("returns an empty array when the user has no notifications", async () => {
    const res = await supertest(makeApp(USER_A)).get("/notifications");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns notifications for the authenticated user", async () => {
    await seedNotification(USER_A, { message: "Venue is now open" });

    const res = await supertest(makeApp(USER_A)).get("/notifications");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].message).toBe("Venue is now open");
    expect(res.body[0].userId).toBe(USER_A);
  });

  it("does not return another user's notifications", async () => {
    await seedNotification(USER_B, { message: "User B's private notification" });

    const res = await supertest(makeApp(USER_A)).get("/notifications");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("returns notifications ordered newest-first", async () => {
    // Insert two notifications; the second one will have a later createdAt.
    await seedNotification(USER_A, { message: "First notification" });
    // Small delay so timestamps differ.
    await new Promise((r) => setTimeout(r, 10));
    await seedNotification(USER_A, { message: "Second notification" });

    const res = await supertest(makeApp(USER_A)).get("/notifications");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].message).toBe("Second notification");
    expect(res.body[1].message).toBe("First notification");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await supertest(makeApp(null)).get("/notifications");
    expect(res.status).toBe(401);
  });

  it("includes isRead field set to false for new notifications", async () => {
    await seedNotification(USER_A);

    const res = await supertest(makeApp(USER_A)).get("/notifications");

    expect(res.status).toBe(200);
    expect(res.body[0].isRead).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: PUT /notifications/read-all
// ---------------------------------------------------------------------------

describe("PUT /notifications/read-all", () => {
  it("marks all unread notifications as read for the user", async () => {
    await seedNotification(USER_A);
    await seedNotification(USER_A);

    const markRes = await supertest(makeApp(USER_A)).put("/notifications/read-all");
    expect(markRes.status).toBe(204);

    const getRes = await supertest(makeApp(USER_A)).get("/notifications");
    expect(getRes.body.every((n: { isRead: boolean }) => n.isRead === true)).toBe(true);
  });

  it("does not affect another user's notifications", async () => {
    await seedNotification(USER_A);
    await seedNotification(USER_B);

    await supertest(makeApp(USER_A)).put("/notifications/read-all");

    // USER_B's notification must remain unread.
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, USER_B));
    expect(rows[0].isRead).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    const res = await supertest(makeApp(null)).put("/notifications/read-all");
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Tests: PUT /notifications/:id/read
// ---------------------------------------------------------------------------

describe("PUT /notifications/:id/read", () => {
  it("marks a single notification as read", async () => {
    const notif = await seedNotification(USER_A);

    const res = await supertest(makeApp(USER_A)).put(`/notifications/${notif.id}/read`);

    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
    expect(res.body.id).toBe(notif.id);
  });

  it("returns 404 for a notification belonging to another user (ownership isolation)", async () => {
    const notif = await seedNotification(USER_B);

    // USER_A tries to mark USER_B's notification as read.
    const res = await supertest(makeApp(USER_A)).put(`/notifications/${notif.id}/read`);

    expect(res.status).toBe(404);

    // USER_B's notification must still be unread.
    const [row] = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notif.id));
    expect(row?.isRead).toBe(false);
  });

  it("returns 400 for a non-integer notification id", async () => {
    const res = await supertest(makeApp(USER_A)).put("/notifications/abc/read");
    expect(res.status).toBe(400);
  });

  it("returns 400 for id = 0", async () => {
    const res = await supertest(makeApp(USER_A)).put("/notifications/0/read");
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const notif = await seedNotification(USER_A);
    const res = await supertest(makeApp(null)).put(`/notifications/${notif.id}/read`);
    expect(res.status).toBe(401);
  });
});
