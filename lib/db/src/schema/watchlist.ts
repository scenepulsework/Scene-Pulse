import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const watchlistTable = pgTable(
  "watchlist",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_user_venue_unique").on(t.userId, t.venueId)],
);

export const insertWatchlistSchema = createInsertSchema(watchlistTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWatchlistEntry = z.infer<typeof insertWatchlistSchema>;
export type WatchlistEntry = typeof watchlistTable.$inferSelect;
