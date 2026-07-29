/**
 * Unit tests for fireWatchlistNotifications().
 *
 * Covers:
 * - Crowd-level change triggers in-app notification for subscribers
 * - Wait-time drop under 10 min triggers in-app notification
 * - No notification when nothing meaningful changed
 * - Reporter's own account is excluded from notifications
 * - Watchlist entries with alertsEnabled=false are skipped
 * - Multiple subscribers each receive their own notification row
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import {
  db,
  venuesTable,
  watchlistTable,
  notificationsTable,
  devicePushTokensTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Mock expo-server-sdk to prevent real push calls during tests.
// We capture arguments to verify push messages are constructed correctly.
// ---------------------------------------------------------------------------

const mockSendPushNotificationsAsync = vi.fn().mockResolvedValue([]);
const mockChunkPushNotifications = vi.fn((msgs: unknown[]) => [msgs]);

vi.mock("expo-server-sdk", () => ({
  Expo: class MockExpo {
    static isExpoPushToken = (token: string) =>
      typeof token === "string" && token.startsWith("ExponentPushToken[");
    chunkPushNotifications = mockChunkPushNotifications;
    sendPushNotificationsAsync = mockSendPushNotificationsAsync;
  },
}));

// Import AFTER mocking so the mock is in place for the module.
const { fireWatchlistNotifications } = await import("../reports");

// ---------------------------------------------------------------------------
// Stable test identifiers — avoids collisions with real or other test data
// ---------------------------------------------------------------------------

const TEST_PREFIX = "notif_unit_test";
const USER_A = `${TEST_PREFIX}_user_a`;
const USER_B = `${TEST_PREFIX}_user_b`;
const USER_REPORTER = `${TEST_PREFIX}_reporter`;
const PUSH_TOKEN_A = "ExponentPushToken[notif-unit-test-aaa-111]";

let testVenueId: number;

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function insertWatchlistEntry(
  userId: string,
  venueId: number,
  alertsEnabled: boolean,
): Promise<void> {
  await db.insert(watchlistTable).values({ userId, venueId, alertsEnabled });
}

async function getNotificationsFor(userId: string) {
  return db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId));
}

async function cleanupNotifications(...userIds: string[]) {
  for (const userId of userIds) {
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
  }
}

async function cleanupWatchlist(venueId: number, ...userIds: string[]) {
  for (const userId of userIds) {
    await db
      .delete(watchlistTable)
      .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.venueId, venueId)));
  }
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Insert a minimal venue to satisfy FK constraints.
  const [venue] = await db
    .insert(venuesTable)
    .values({
      name: "Test Venue (notification unit tests)",
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
  // Remove all test data seeded in beforeAll.
  await db.delete(venuesTable).where(eq(venuesTable.id, testVenueId));
});

beforeEach(async () => {
  vi.clearAllMocks();
  await cleanupNotifications(USER_A, USER_B, USER_REPORTER);
  await cleanupWatchlist(testVenueId, USER_A, USER_B, USER_REPORTER);
  await db
    .delete(devicePushTokensTable)
    .where(inArray(devicePushTokensTable.token, [PUSH_TOKEN_A]));
});

afterEach(async () => {
  await cleanupNotifications(USER_A, USER_B, USER_REPORTER);
  await cleanupWatchlist(testVenueId, USER_A, USER_B, USER_REPORTER);
  await db
    .delete(devicePushTokensTable)
    .where(inArray(devicePushTokensTable.token, [PUSH_TOKEN_A]));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fireWatchlistNotifications — crowd level change", () => {
  it("sends a notification when crowd level changes from open to packed", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(1);
    expect(notifs[0].message).toContain("packed");
    expect(notifs[0].venueId).toBe(testVenueId);
    expect(notifs[0].crowdLevel).toBe("packed");
  });

  it("sends an 'opened up' message when crowd level improves (packed → open)", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "packed",
      prevWaitMinutes: 5,
      newCrowdLevel: "open",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(1);
    expect(notifs[0].message).toMatch(/opened up/i);
  });

  it("notifies all opted-in subscribers when crowd level changes", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);
    await insertWatchlistEntry(USER_B, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "lively",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    const notifsA = await getNotificationsFor(USER_A);
    const notifsB = await getNotificationsFor(USER_B);
    expect(notifsA).toHaveLength(1);
    expect(notifsB).toHaveLength(1);
  });
});

describe("fireWatchlistNotifications — wait time drop under 10 min", () => {
  it("sends a notification when wait drops from ≥10 min to <10 min", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "lively",
      prevWaitMinutes: 15,
      newCrowdLevel: "lively", // no crowd change
      newWaitMinutes: 8,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(1);
    expect(notifs[0].message).toContain("8 min");
    expect(notifs[0].waitTimeMinutes).toBe(8);
  });

  it("does NOT send a notification when wait was already under 10 and drops further", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "lively",
      prevWaitMinutes: 5,
      newCrowdLevel: "lively",
      newWaitMinutes: 3,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(0);
  });
});

describe("fireWatchlistNotifications — no change → no notification", () => {
  it("does not notify when crowd level and wait time are unchanged", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "lively",
      prevWaitMinutes: 5,
      newCrowdLevel: "lively",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(0);
  });

  it("does not notify when wait rises above 10 (no wait-drop event)", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "lively",
      prevWaitMinutes: 5,
      newCrowdLevel: "lively",
      newWaitMinutes: 20,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(0);
  });
});

describe("fireWatchlistNotifications — reporter exclusion", () => {
  it("does not notify the user who submitted the report", async () => {
    await insertWatchlistEntry(USER_REPORTER, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: USER_REPORTER,
    });

    const notifs = await getNotificationsFor(USER_REPORTER);
    expect(notifs).toHaveLength(0);
  });

  it("only excludes the reporter, not other subscribers", async () => {
    await insertWatchlistEntry(USER_REPORTER, testVenueId, true);
    await insertWatchlistEntry(USER_A, testVenueId, true);

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: USER_REPORTER,
    });

    const notifsReporter = await getNotificationsFor(USER_REPORTER);
    const notifsA = await getNotificationsFor(USER_A);
    expect(notifsReporter).toHaveLength(0);
    expect(notifsA).toHaveLength(1);
  });
});

describe("fireWatchlistNotifications — alertsEnabled=false is respected", () => {
  it("does not notify a subscriber who opted out of alerts", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, false); // opted out

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    const notifs = await getNotificationsFor(USER_A);
    expect(notifs).toHaveLength(0);
  });

  it("notifies opted-in users while skipping opted-out ones", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);  // opted in
    await insertWatchlistEntry(USER_B, testVenueId, false); // opted out

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    const notifsA = await getNotificationsFor(USER_A);
    const notifsB = await getNotificationsFor(USER_B);
    expect(notifsA).toHaveLength(1);
    expect(notifsB).toHaveLength(0);
  });
});

describe("fireWatchlistNotifications — push notification dispatch", () => {
  it("sends a push message to a subscriber's registered device token", async () => {
    await insertWatchlistEntry(USER_A, testVenueId, true);
    await db.insert(devicePushTokensTable).values({ userId: USER_A, token: PUSH_TOKEN_A });

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: null,
    });

    expect(mockSendPushNotificationsAsync).toHaveBeenCalledOnce();
    const [chunk] = mockSendPushNotificationsAsync.mock.calls[0];
    expect(chunk).toHaveLength(1);
    expect(chunk[0].to).toBe(PUSH_TOKEN_A);
    expect(chunk[0].body).toContain("packed");
  });

  it("does NOT send a push when the reporter is the only subscriber", async () => {
    await insertWatchlistEntry(USER_REPORTER, testVenueId, true);
    await db.insert(devicePushTokensTable).values({ userId: USER_REPORTER, token: PUSH_TOKEN_A });

    await fireWatchlistNotifications({
      venueId: testVenueId,
      venueName: "Test Venue",
      prevCrowdLevel: "open",
      prevWaitMinutes: 5,
      newCrowdLevel: "packed",
      newWaitMinutes: 5,
      reporterUserId: USER_REPORTER,
    });

    expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled();
  });
});
