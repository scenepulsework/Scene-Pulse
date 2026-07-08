import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, commentsTable, venuesTable } from "@workspace/db";
import {
  ListVenueCommentsParams,
  ListVenueCommentsResponse,
  CreateVenueCommentParams,
  CreateVenueCommentBody,
  CreateVenueCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

export default router;
