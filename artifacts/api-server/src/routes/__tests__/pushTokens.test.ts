/**
 * Push-token lifecycle tests.
 *
 * Verifies the critical security property: one Expo push token can belong to
 * exactly one user at a time. When user B registers a token already owned by
 * user A, ownership transfers to user B so user A stops receiving pushes on
 * that device.
 *
 * Also covers:
 * - DELETE only removes tokens owned by the requesting user
 * - Repeated registration of the same token is idempotent for the same user
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import supertest from "supertest";
import { db, devicePushTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Mock requireAuth so tests don't need a real Clerk session.
// Each test controls the active userId via the module-level variable below.
// ---------------------------------------------------------------------------

let activeUserId = "user_test_default";

vi.mock("../../middlewares/requireAuth", () => ({
  requireAuth: (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
    req.userId = activeUserId;
    next();
  },
}));

// ---------------------------------------------------------------------------
// Import the router AFTER mocking (ESM mock hoisting handles ordering)
// ---------------------------------------------------------------------------

const { default: pushTokensRouter } = await import("../pushTokens");

function makeTestApp(userId: string) {
  activeUserId = userId;
  const app = express();
  app.use(express.json());
  app.use(pushTokensRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Test tokens / user IDs (unique to avoid interference with real data)
// ---------------------------------------------------------------------------

const TOKEN_A = "ExponentPushToken[test-lifecycle-aaa-111]";
const TOKEN_B = "ExponentPushToken[test-lifecycle-bbb-222]";
const USER_1 = "user_push_test_lifecycle_1";
const USER_2 = "user_push_test_lifecycle_2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOwner(token: string): Promise<string | undefined> {
  const [row] = await db
    .select({ userId: devicePushTokensTable.userId })
    .from(devicePushTokensTable)
    .where(eq(devicePushTokensTable.token, token));
  return row?.userId;
}

async function cleanup(...tokens: string[]) {
  for (const token of tokens) {
    await db
      .delete(devicePushTokensTable)
      .where(eq(devicePushTokensTable.token, token));
  }
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await cleanup(TOKEN_A, TOKEN_B);
});

afterEach(async () => {
  await cleanup(TOKEN_A, TOKEN_B);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /push-tokens — registration", () => {
  it("registers a new token for the user", async () => {
    const res = await supertest(makeTestApp(USER_1))
      .post("/push-tokens")
      .send({ token: TOKEN_A });

    expect(res.status).toBe(204);
    expect(await getOwner(TOKEN_A)).toBe(USER_1);
  });

  it("is idempotent: re-registering the same token by the same user is a no-op", async () => {
    const app = makeTestApp(USER_1);
    await supertest(app).post("/push-tokens").send({ token: TOKEN_A });
    const res = await supertest(app).post("/push-tokens").send({ token: TOKEN_A });

    expect(res.status).toBe(204);
    expect(await getOwner(TOKEN_A)).toBe(USER_1);
  });

  it("transfers token ownership when a second user registers the same device token", async () => {
    // User 1 registers the device first (e.g. they signed in on this phone)
    await supertest(makeTestApp(USER_1)).post("/push-tokens").send({ token: TOKEN_A });
    expect(await getOwner(TOKEN_A)).toBe(USER_1);

    // User 2 signs in on the same phone and registers the same token
    const res = await supertest(makeTestApp(USER_2))
      .post("/push-tokens")
      .send({ token: TOKEN_A });

    expect(res.status).toBe(204);
    // Token now belongs exclusively to User 2 — no more pushes reach User 1
    expect(await getOwner(TOKEN_A)).toBe(USER_2);
  });

  it("rejects a missing token", async () => {
    const res = await supertest(makeTestApp(USER_1))
      .post("/push-tokens")
      .send({});
    expect(res.status).toBe(400);
  });

  it("rejects an empty token string", async () => {
    const res = await supertest(makeTestApp(USER_1))
      .post("/push-tokens")
      .send({ token: "" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /push-tokens — deregistration", () => {
  it("removes a token owned by the requesting user", async () => {
    const app = makeTestApp(USER_1);
    await supertest(app).post("/push-tokens").send({ token: TOKEN_A });

    const res = await supertest(app).delete("/push-tokens").send({ token: TOKEN_A });

    expect(res.status).toBe(204);
    expect(await getOwner(TOKEN_A)).toBeUndefined();
  });

  it("does NOT remove a token owned by a different user (cross-account safety)", async () => {
    // User 1 owns TOKEN_A
    await supertest(makeTestApp(USER_1)).post("/push-tokens").send({ token: TOKEN_A });

    // User 2 tries to delete it — must not succeed
    const res = await supertest(makeTestApp(USER_2))
      .delete("/push-tokens")
      .send({ token: TOKEN_A });

    expect(res.status).toBe(204); // endpoint is idempotent (no error)…
    // …but User 1's token must still be intact
    expect(await getOwner(TOKEN_A)).toBe(USER_1);
  });

  it("is idempotent: deleting a non-existent token returns 204", async () => {
    const res = await supertest(makeTestApp(USER_1))
      .delete("/push-tokens")
      .send({ token: TOKEN_A });
    expect(res.status).toBe(204);
  });

  it("rejects a missing token", async () => {
    const res = await supertest(makeTestApp(USER_1))
      .delete("/push-tokens")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("account-switch scenario: sign-out DELETE failure then new sign-in", () => {
  it("new user's POST takes ownership even when previous sign-out DELETE was skipped", async () => {
    // User 1 registers token — simulates normal sign-in
    await supertest(makeTestApp(USER_1)).post("/push-tokens").send({ token: TOKEN_A });
    expect(await getOwner(TOKEN_A)).toBe(USER_1);

    // Simulate sign-out DELETE failing (device was offline) by simply NOT calling it.
    // TOKEN_A still points to USER_1 in the DB.

    // User 2 signs in on the same device and registers the token — the upsert must take ownership
    await supertest(makeTestApp(USER_2)).post("/push-tokens").send({ token: TOKEN_A });

    // After User 2's registration, the token belongs to User 2 only.
    // User 1 will receive no further push notifications on this device.
    expect(await getOwner(TOKEN_A)).toBe(USER_2);
  });
});
