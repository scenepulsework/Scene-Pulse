import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * reason values:
 *   "report"            — submitted a live crowd report (+10)
 *   "comment"           — left a venue comment (+5)
 *   "watchlist"         — added a venue to watchlist (+5)
 *   "referral_gave"     — someone they referred signed up (+100)
 *   "referral_received" — signed up via someone's referral code (+25)
 */
export const pointTransactionsTable = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactionsTable.$inferSelect;
