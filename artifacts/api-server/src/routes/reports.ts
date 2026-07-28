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
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

const MAX_WAIT_MINUTES = 240;
const REPORT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 3;

const reportRateMap = new Map<string, number[]>();

function isRateLimited(ip: string, venueId: number): boolean {
  const key = `${ip}:${venueId}`;
  const now = Date.now();
  const timestamps = (reportRateMap.get(key) ?? []).filter(
    (t) => now - t < REPORT_WINDOW_MS,
  );
  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    return true;
  }
  timestamps.push(now);
  reportRateMap.set(key, timestamps);
  return false;
}

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

  const ip = req.ip ?? "unknown";
  if (isRateLimited(ip, params.data.venueId)) {
    res.status(429).json({ error: "Too many reports submitted. Please wait before submitting again." });
    return;
  }

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, params.data.venueId));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const clampedWait = Math.min(body.data.waitTimeMinutes, MAX_WAIT_MINUTES);
  const sanitizedBody = { ...body.data, waitTimeMinutes: clampedWait };

  // Attribute the report to the signed-in user when a Clerk session exists.
  const auth = getAuth(req);
  const reporterId = ((auth?.sessionClaims?.["userId"] as string | undefined) || auth?.userId) ?? null;

  const [report] = await db
    .insert(liveReportsTable)
    .values({ venueId: params.data.venueId, ...sanitizedBody, reporterId })
    .returning();

  res.status(201).json(CreateVenueReportResponse.parse(report));
});

export default router;
