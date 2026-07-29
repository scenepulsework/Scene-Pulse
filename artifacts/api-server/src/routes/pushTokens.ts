import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, devicePushTokensTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

function parseToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const token = (body as Record<string, unknown>)["token"];
  if (typeof token !== "string" || token.length === 0 || token.length > 512) return null;
  return token;
}

/**
 * Register a device Expo push token for the authenticated user.
 *
 * Enforces one-device-one-owner: the unique index is on `token` alone, so
 * registering a token that already belongs to another user reassigns it to
 * the current user. This prevents cross-account push leakage when a device
 * is shared or an Expo token is reused after a factory reset.
 */
router.post("/push-tokens", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const token = parseToken(req.body);
  if (!token) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  await db
    .insert(devicePushTokensTable)
    .values({ userId: req.userId!, token })
    // If another user owns this token, take ownership now.
    .onConflictDoUpdate({
      target: devicePushTokensTable.token,
      set: { userId: req.userId! },
    });

  res.status(204).end();
});

/**
 * Unregister a device push token (e.g. on sign-out or opt-out).
 * Only removes the row when the token belongs to the current user —
 * never touches tokens registered to other accounts.
 */
router.delete("/push-tokens", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const token = parseToken(req.body);
  if (!token) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  await db
    .delete(devicePushTokensTable)
    .where(
      and(
        eq(devicePushTokensTable.userId, req.userId!),
        eq(devicePushTokensTable.token, token),
      ),
    );

  res.status(204).end();
});

export default router;
