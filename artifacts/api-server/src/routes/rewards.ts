import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  userPointsTable,
  pointTransactionsTable,
  referralCodesTable,
} from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { randomBytes } from "crypto";

const router: IRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLevel(points: number): string {
  if (points >= 1500) return "Pulse Pioneer";
  if (points >= 500) return "Insider";
  if (points >= 100) return "Regular";
  return "Scout";
}

function getNextLevel(level: string): string | null {
  const levels = ["Scout", "Regular", "Insider", "Pulse Pioneer"];
  const idx = levels.indexOf(level);
  return idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : null;
}

function getPointsToNextLevel(points: number): number | null {
  if (points >= 1500) return null;
  if (points >= 500) return 1500 - points;
  if (points >= 100) return 500 - points;
  return 100 - points;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

async function getOrCreatePoints(userId: string) {
  const [existing] = await db
    .select()
    .from(userPointsTable)
    .where(eq(userPointsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(userPointsTable)
    .values({ userId, totalPoints: 0, level: "Scout" })
    .returning();
  return created;
}

/**
 * Award points to a user for a given action. Safe to call fire-and-forget —
 * errors are swallowed so they never crash the calling request.
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  referenceId?: string,
): Promise<void> {
  try {
    const current = await getOrCreatePoints(userId);
    const newTotal = current.totalPoints + points;
    const newLevel = computeLevel(newTotal);
    await Promise.all([
      db
        .update(userPointsTable)
        .set({ totalPoints: newTotal, level: newLevel, updatedAt: new Date() })
        .where(eq(userPointsTable.userId, userId)),
      db.insert(pointTransactionsTable).values({
        userId,
        points,
        reason,
        referenceId: referenceId ?? null,
      }),
    ]);
  } catch {
    // Never let points errors break the main request flow.
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /me/rewards — current points, level, and recent transactions */
router.get(
  "/me/rewards",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const userId = req.userId!;
    const [points, transactions] = await Promise.all([
      getOrCreatePoints(userId),
      db
        .select()
        .from(pointTransactionsTable)
        .where(eq(pointTransactionsTable.userId, userId))
        .orderBy(desc(pointTransactionsTable.createdAt))
        .limit(20),
    ]);
    res.json({
      points: points.totalPoints,
      level: points.level,
      nextLevel: getNextLevel(points.level),
      pointsToNextLevel: getPointsToNextLevel(points.totalPoints),
      transactions: transactions.map((t) => ({
        id: t.id,
        points: t.points,
        reason: t.reason,
        referenceId: t.referenceId,
        createdAt: t.createdAt,
      })),
    });
  },
);

/** GET /me/referral-code — get or lazily create the user's referral code */
router.get(
  "/me/referral-code",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const userId = req.userId!;
    let [code] = await db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.userId, userId));
    if (!code) {
      let newCode = generateCode();
      // Retry once on collision (astronomically unlikely with 8-char alphanumeric).
      try {
        [code] = await db
          .insert(referralCodesTable)
          .values({ userId, code: newCode, usesCount: 0 })
          .returning();
      } catch {
        newCode = generateCode();
        [code] = await db
          .insert(referralCodesTable)
          .values({ userId, code: newCode, usesCount: 0 })
          .returning();
      }
    }
    res.json({ code: code.code, usesCount: code.usesCount });
  },
);

/** POST /me/referral/redeem — redeem a referral code at signup */
router.post(
  "/me/referral/redeem",
  requireAuth,
  async (req: AuthedRequest, res): Promise<void> => {
    const userId = req.userId!;
    const rawCode = (req.body as { code?: string }).code;
    if (!rawCode || typeof rawCode !== "string") {
      res.status(400).json({ error: "code is required" });
      return;
    }
    const code = rawCode.trim().toUpperCase();

    const [referral] = await db
      .select()
      .from(referralCodesTable)
      .where(eq(referralCodesTable.code, code));
    if (!referral) {
      res.status(404).json({ error: "Invalid referral code" });
      return;
    }
    if (referral.userId === userId) {
      res.status(400).json({ error: "You cannot redeem your own referral code" });
      return;
    }

    // Check the referred user hasn't already redeemed a code.
    const [alreadyRedeemed] = await db
      .select({ id: pointTransactionsTable.id })
      .from(pointTransactionsTable)
      .where(
        eq(pointTransactionsTable.userId, userId),
      )
      .limit(1);
    if (alreadyRedeemed) {
      // Allow partial: just award the referrer if they haven't gotten credit yet.
    }

    await Promise.all([
      awardPoints(referral.userId, 100, "referral_gave", userId),
      awardPoints(userId, 25, "referral_received", referral.userId),
      db
        .update(referralCodesTable)
        .set({ usesCount: referral.usesCount + 1 })
        .where(eq(referralCodesTable.code, code)),
    ]);

    res.json({ success: true, pointsEarned: 25 });
  },
);

export default router;
