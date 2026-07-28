import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, liveReportsTable, venuesTable, watchlistTable, notificationsTable } from "@workspace/db";
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

  // Fetch the most recent prior report BEFORE inserting the new one — this is the true "previous state".
  const [prevReport] = await db
    .select({ crowdLevel: liveReportsTable.crowdLevel, waitTimeMinutes: liveReportsTable.waitTimeMinutes })
    .from(liveReportsTable)
    .where(eq(liveReportsTable.venueId, params.data.venueId))
    .orderBy(desc(liveReportsTable.createdAt))
    .limit(1);

  const [report] = await db
    .insert(liveReportsTable)
    .values({ venueId: params.data.venueId, ...sanitizedBody, reporterId })
    .returning();

  res.status(201).json(CreateVenueReportResponse.parse(report));

  // Fire notifications asynchronously — do not block the response.
  // Only fires when there is a prior report to compare against, preventing false positives.
  if (prevReport) {
    void fireWatchlistNotifications({
      venueId: params.data.venueId,
      venueName: venue.name,
      prevCrowdLevel: prevReport.crowdLevel,
      prevWaitMinutes: prevReport.waitTimeMinutes,
      newCrowdLevel: sanitizedBody.crowdLevel,
      newWaitMinutes: sanitizedBody.waitTimeMinutes,
      reporterUserId: reporterId,
    });
  }
});

/** Crowd level severity: lower = better (more open). */
const CROWD_RANK: Record<string, number> = { open: 0, lively: 1, packed: 2 };

/**
 * Compares a newly submitted report against the most recent prior report
 * (fetched before insertion) to detect genuine crowd-level changes or
 * wait-time drops. Fires in-app notifications to all opted-in watchlist
 * subscribers, excluding the reporter themselves.
 */
async function fireWatchlistNotifications({
  venueId,
  venueName,
  prevCrowdLevel,
  prevWaitMinutes,
  newCrowdLevel,
  newWaitMinutes,
  reporterUserId,
}: {
  venueId: number;
  venueName: string;
  prevCrowdLevel: string;
  prevWaitMinutes: number;
  newCrowdLevel: string;
  newWaitMinutes: number;
  reporterUserId: string | null;
}) {
  try {
    const crowdChanged = prevCrowdLevel !== newCrowdLevel;
    const waitDroppedUnder10 = prevWaitMinutes >= 10 && newWaitMinutes < 10;

    if (!crowdChanged && !waitDroppedUnder10) return;

    // Build a human-readable message.
    let message: string;
    if (crowdChanged) {
      const prevRank = CROWD_RANK[prevCrowdLevel] ?? 1;
      const newRank = CROWD_RANK[newCrowdLevel] ?? 1;
      if (newRank < prevRank) {
        message = `${venueName} just opened up — crowd is now ${newCrowdLevel}.`;
      } else {
        message = `${venueName} is getting ${newCrowdLevel} now.`;
      }
    } else {
      message = `${venueName} wait dropped to ${newWaitMinutes} min — now's your chance!`;
    }

    // Find all watchlist subscribers for this venue with alerts enabled,
    // excluding the person who submitted the report.
    const subscribers = await db
      .select({ userId: watchlistTable.userId })
      .from(watchlistTable)
      .where(
        and(
          eq(watchlistTable.venueId, venueId),
          eq(watchlistTable.alertsEnabled, true),
        ),
      );

    const notifyUsers = subscribers
      .map((s) => s.userId)
      .filter((uid) => uid !== reporterUserId);

    if (notifyUsers.length === 0) return;

    await db.insert(notificationsTable).values(
      notifyUsers.map((userId) => ({
        userId,
        venueId,
        venueName,
        message,
        crowdLevel: newCrowdLevel,
        waitTimeMinutes: newWaitMinutes,
      })),
    );
  } catch {
    // Never crash the server due to notification failures.
  }
}

export default router;
