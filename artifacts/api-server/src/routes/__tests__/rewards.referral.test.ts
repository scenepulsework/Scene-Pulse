/**
 * Integration tests for POST /me/referral/redeem
 *
 * Covers:
 * 1. Valid code → new user earns +25 pts, referrer earns +100 pts, usesCount increments.
 * 2. Invalid / nonexistent code → 404 (not a crash).
 * 3. Missing code in request body → 400.
 * 4. Self-referral → 400 (a user cannot redeem their own code).
 * 5. No code entered (control) → point totals stay at 0.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import supertest from "supertest";
import { db, userPointsTable, pointTransactionsTable, referralCodesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Mock requireAuth — each test controls the active user via `activeUserId`.
// ---------------------------------------------------------------------------

let activeUserId = "rewards_referral_test_default";

vi.mock("../../middlewares/requireAuth", () => ({
  requireAuth: (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
    req.userId = activeUserId;
    next();
  },
}));

const { default: rewardsRouter } = await import("../rewards");

function makeApp(userId: string) {
  activeUserId = userId;
  const app = express();
  app.use(express.json());
  app.use(rewardsRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Test identifiers (unique prefix guards against interference with real data)
// ---------------------------------------------------------------------------

const REFERRER_ID = "rewards_ref_test_referrer_1";
const NEW_USER_ID = "rewards_ref_test_newuser_1";
const SELF_USER_ID = "rewards_ref_test_self_1";
const TEST_CODE = "TESTREF1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTotalPoints(userId: string): Promise<number> {
  const [row] = await db
    .select({ totalPoints: userPointsTable.totalPoints })
    .from(userPointsTable)
    .where(eq(userPointsTable.userId, userId));
  return row?.totalPoints ?? 0;
}

async function getTransactionCount(userId: string): Promise<number> {
  const rows = await db
    .select({ id: pointTransactionsTable.id })
    .from(pointTransactionsTable)
    .where(eq(pointTransactionsTable.userId, userId));
  return rows.length;
}

async function getUsesCount(code: string): Promise<number> {
  const [row] = await db
    .select({ usesCount: referralCodesTable.usesCount })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.code, code));
  return row?.usesCount ?? 0;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Seed referrer's referral code (used in most tests).
  await db
    .insert(referralCodesTable)
    .values({ userId: REFERRER_ID, code: TEST_CODE, usesCount: 0 })
    .onConflictDoNothing();
});

afterEach(async () => {
  // Clean up in dependency order.
  await db
    .delete(pointTransactionsTable)
    .where(eq(pointTransactionsTable.userId, NEW_USER_ID));
  await db
    .delete(pointTransactionsTable)
    .where(eq(pointTransactionsTable.userId, REFERRER_ID));
  await db
    .delete(pointTransactionsTable)
    .where(eq(pointTransactionsTable.userId, SELF_USER_ID));

  await db
    .delete(userPointsTable)
    .where(eq(userPointsTable.userId, NEW_USER_ID));
  await db
    .delete(userPointsTable)
    .where(eq(userPointsTable.userId, REFERRER_ID));
  await db
    .delete(userPointsTable)
    .where(eq(userPointsTable.userId, SELF_USER_ID));

  await db
    .delete(referralCodesTable)
    .where(eq(referralCodesTable.userId, REFERRER_ID));
  await db
    .delete(referralCodesTable)
    .where(eq(referralCodesTable.userId, SELF_USER_ID));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /me/referral/redeem", () => {
  it("awards +25 pts to the new user and +100 pts to the referrer on a valid code", async () => {
    const res = await supertest(makeApp(NEW_USER_ID))
      .post("/me/referral/redeem")
      .send({ code: TEST_CODE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pointsEarned).toBe(25);

    const newUserPts = await getTotalPoints(NEW_USER_ID);
    const referrerPts = await getTotalPoints(REFERRER_ID);

    expect(newUserPts).toBe(25);
    expect(referrerPts).toBe(100);
  });

  it("increments the referral code usesCount after a successful redeem", async () => {
    const before = await getUsesCount(TEST_CODE);

    await supertest(makeApp(NEW_USER_ID))
      .post("/me/referral/redeem")
      .send({ code: TEST_CODE });

    const after = await getUsesCount(TEST_CODE);
    expect(after).toBe(before + 1);
  });

  it("creates a transaction record for both the new user and the referrer", async () => {
    await supertest(makeApp(NEW_USER_ID))
      .post("/me/referral/redeem")
      .send({ code: TEST_CODE });

    const newUserTxCount = await getTransactionCount(NEW_USER_ID);
    const referrerTxCount = await getTransactionCount(REFERRER_ID);

    expect(newUserTxCount).toBeGreaterThanOrEqual(1);
    expect(referrerTxCount).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for an invalid / nonexistent referral code (does not crash)", async () => {
    const res = await supertest(makeApp(NEW_USER_ID))
      .post("/me/referral/redeem")
      .send({ code: "INVALID0" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
    // No points should have been awarded.
    expect(await getTotalPoints(NEW_USER_ID)).toBe(0);
  });

  it("returns 400 when the code field is missing from the request body", async () => {
    const res = await supertest(makeApp(NEW_USER_ID))
      .post("/me/referral/redeem")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 when a user tries to redeem their own referral code", async () => {
    // Seed a code owned by SELF_USER_ID.
    await db
      .insert(referralCodesTable)
      .values({ userId: SELF_USER_ID, code: "SELFREF1", usesCount: 0 })
      .onConflictDoNothing();

    const res = await supertest(makeApp(SELF_USER_ID))
      .post("/me/referral/redeem")
      .send({ code: "SELFREF1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own/i);
    // Self user earns no points.
    expect(await getTotalPoints(SELF_USER_ID)).toBe(0);
  });

  it("leaves rewards unchanged when no code is submitted (control)", async () => {
    // Simulate a normal sign-up with no referral: no redeem call at all.
    // Both users start at 0 and stay at 0.
    expect(await getTotalPoints(NEW_USER_ID)).toBe(0);
    expect(await getTotalPoints(REFERRER_ID)).toBe(0);
    expect(await getTransactionCount(NEW_USER_ID)).toBe(0);
  });

  it("awards +25 only once — second redeem with the same code returns 409 and no extra points", async () => {
    const app = makeApp(NEW_USER_ID);

    // First redeem — should succeed.
    const first = await supertest(app)
      .post("/me/referral/redeem")
      .send({ code: TEST_CODE });
    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);

    const ptsAfterFirst = await getTotalPoints(NEW_USER_ID);
    const referrerPtsAfterFirst = await getTotalPoints(REFERRER_ID);
    expect(ptsAfterFirst).toBe(25);
    expect(referrerPtsAfterFirst).toBe(100);

    // Second redeem — must be rejected.
    const second = await supertest(app)
      .post("/me/referral/redeem")
      .send({ code: TEST_CODE });
    expect(second.status).toBe(409);
    expect(second.body.error).toBeTruthy();

    // Points must not have changed.
    expect(await getTotalPoints(NEW_USER_ID)).toBe(25);
    expect(await getTotalPoints(REFERRER_ID)).toBe(100);
  });
});
