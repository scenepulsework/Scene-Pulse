import { Router, type IRouter } from "express";
import { and, eq, desc, or, sql } from "drizzle-orm";
import { db, commentsTable, commentVotesTable, venuesTable } from "@workspace/db";
import {
  ListVenueCommentsParams,
  ListVenueCommentsResponse,
  CreateVenueCommentParams,
  CreateVenueCommentBody,
  CreateVenueCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const VOTER_ID_MAX_LEN = 128;

const REACTION_WINDOW_MS = 60 * 1000;
const MAX_REACTIONS_PER_WINDOW = 20;
const reactionRateMap = new Map<string, number[]>();

function extractVoterId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > VOTER_ID_MAX_LEN) return null;
  return trimmed;
}

function isReactionRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (reactionRateMap.get(ip) ?? []).filter(
    (t) => now - t < REACTION_WINDOW_MS,
  );
  if (timestamps.length >= MAX_REACTIONS_PER_WINDOW) {
    return true;
  }
  timestamps.push(now);
  reactionRateMap.set(ip, timestamps);
  return false;
}

async function hasAlreadyVoted(commentId: number, voterId: string, voterIp: string): Promise<boolean> {
  const rows = await db
    .select({ id: commentVotesTable.id })
    .from(commentVotesTable)
    .where(
      and(
        eq(commentVotesTable.commentId, commentId),
        or(
          eq(commentVotesTable.voterId, voterId),
          eq(commentVotesTable.voterIp, voterIp),
        ),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

router.get("/venues/:venueId/comments", async (req, res): Promise<void> => {
  const params = ListVenueCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.venueId, params.data.venueId))
    .orderBy(desc(commentsTable.createdAt));
  res.json(ListVenueCommentsResponse.parse(comments));
});

router.post("/venues/:venueId/comments", async (req, res): Promise<void> => {
  const params = CreateVenueCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateVenueCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.venueId));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ venueId: params.data.venueId, ...body.data })
    .returning();
  res.status(201).json(CreateVenueCommentResponse.parse(comment));
});

router.post("/venues/:venueId/comments/:commentId/like", async (req, res): Promise<void> => {
  const venueId = Number(req.params.venueId);
  const commentId = Number(req.params.commentId);
  if (!Number.isInteger(venueId) || venueId < 1 || !Number.isInteger(commentId) || commentId < 1) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const voterId = extractVoterId(req.headers["x-voter-id"]);
  if (!voterId) {
    res.status(400).json({ error: "Missing or invalid X-Voter-ID header" });
    return;
  }

  const voterIp = req.ip ?? "unknown";

  if (isReactionRateLimited(voterIp)) {
    res.status(429).json({ error: "Too many reactions. Please slow down." });
    return;
  }

  const alreadyVoted = await hasAlreadyVoted(commentId, voterId, voterIp);
  if (alreadyVoted) {
    res.status(409).json({ error: "Already voted on this comment" });
    return;
  }

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.id, commentId), eq(commentsTable.venueId, venueId)))
    .limit(1);
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  try {
    await db.insert(commentVotesTable).values({ commentId, voterId, voterIp, voteType: "like" });
  } catch {
    res.status(409).json({ error: "Already voted on this comment" });
    return;
  }

  const [updated] = await db
    .update(commentsTable)
    .set({ likes: sql`${commentsTable.likes} + 1` })
    .where(eq(commentsTable.id, commentId))
    .returning();

  res.json(updated);
});

router.post("/venues/:venueId/comments/:commentId/dislike", async (req, res): Promise<void> => {
  const venueId = Number(req.params.venueId);
  const commentId = Number(req.params.commentId);
  if (!Number.isInteger(venueId) || venueId < 1 || !Number.isInteger(commentId) || commentId < 1) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const voterId = extractVoterId(req.headers["x-voter-id"]);
  if (!voterId) {
    res.status(400).json({ error: "Missing or invalid X-Voter-ID header" });
    return;
  }

  const voterIp = req.ip ?? "unknown";

  if (isReactionRateLimited(voterIp)) {
    res.status(429).json({ error: "Too many reactions. Please slow down." });
    return;
  }

  const alreadyVoted = await hasAlreadyVoted(commentId, voterId, voterIp);
  if (alreadyVoted) {
    res.status(409).json({ error: "Already voted on this comment" });
    return;
  }

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.id, commentId), eq(commentsTable.venueId, venueId)))
    .limit(1);
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  try {
    await db.insert(commentVotesTable).values({ commentId, voterId, voterIp, voteType: "dislike" });
  } catch {
    res.status(409).json({ error: "Already voted on this comment" });
    return;
  }

  const [updated] = await db
    .update(commentsTable)
    .set({ dislikes: sql`${commentsTable.dislikes} + 1` })
    .where(eq(commentsTable.id, commentId))
    .returning();

  res.json(updated);
});

export default router;
