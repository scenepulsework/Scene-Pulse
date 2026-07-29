import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPointsTable = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  totalPoints: integer("total_points").notNull().default(0),
  level: text("level").notNull().default("Scout"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPointsSchema = createInsertSchema(userPointsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;
export type UserPoints = typeof userPointsTable.$inferSelect;
