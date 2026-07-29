import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const devicePushTokensTable = pgTable(
  "device_push_tokens",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Unique on token alone — one device can belong to exactly one user at a time.
  // Registration upserts the userId so a shared/reused device is always claimed by
  // the most-recent sign-in, preventing cross-account push leakage.
  (t) => [uniqueIndex("device_push_tokens_token_unique").on(t.token)],
);

export const insertDevicePushTokenSchema = createInsertSchema(devicePushTokensTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDevicePushToken = z.infer<typeof insertDevicePushTokenSchema>;
export type DevicePushToken = typeof devicePushTokensTable.$inferSelect;
