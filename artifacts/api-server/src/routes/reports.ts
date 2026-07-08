import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, liveReportsTable, venuesTable } from "@workspace/db";
import {
  ListVenueReportsParams,
  ListVenueReportsResponse,
  CreateVenueReportParams,
  CreateVenueReportBody,
  CreateVenueReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/venues/:venueId/reports", async (req, res): Promise<void> => {
  const params = ListVenueReportsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const reports = await db
    .select()
    .from(liveReportsTable)
    .where(eq(liveReportsTable.venueId, params.data.venueId))
    .orderBy(desc(liveReportsTable.createdAt));
  res.json(ListVenueReportsResponse.parse(reports));
});

router.post("/venues/:venueId/reports", async (req, res): Promise<void> => {
  const params = CreateVenueReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateVenueReportBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.venueId));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const [report] = await db
    .insert(liveReportsTable)
    .values({ venueId: params.data.venueId, ...body.data })
    .returning();

  const crowdScore =
    body.data.crowdLevel === "packed" ? 90 : body.data.crowdLevel === "lively" ? 60 : 25;
  await db
    .update(venuesTable)
    .set({
      crowdLevel: body.data.crowdLevel,
      crowdScore,
      waitTimeMinutes: body.data.waitTimeMinutes,
    })
    .where(eq(venuesTable.id, params.data.venueId));

  res.status(201).json(CreateVenueReportResponse.parse(report));
});

export default router;
