import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const liveReportsTable = pgTable("live_reports", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  reporterName: text("reporter_name").notNull(),
  crowdLevel: text("crowd_level").notNull(),
  waitTimeMinutes: integer("wait_time_minutes").notNull(),
  vibeNote: text("vibe_note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLiveReportSchema = createInsertSchema(liveReportsTable).omit({ id: true, createdAt: true });
export type InsertLiveReport = z.infer<typeof insertLiveReportSchema>;
export type LiveReport = typeof liveReportsTable.$inferSelect;
