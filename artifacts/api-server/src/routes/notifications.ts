import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { ListNotificationsResponse, MarkNotificationReadResponse } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(ListNotificationsResponse.parse(rows));
});

router.put("/notifications/read-all", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, req.userId!), eq(notificationsTable.isRead, false)));
  res.status(204).end();
});

router.put("/notifications/:id/read", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid notification id" });
    return;
  }
  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(updated));
});

export default router;
