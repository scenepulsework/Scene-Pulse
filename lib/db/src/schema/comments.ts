import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
