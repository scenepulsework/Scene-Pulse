import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referralCodesTable = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  code: text("code").notNull().unique(),
  usesCount: integer("uses_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodesTable.$inferSelect;
