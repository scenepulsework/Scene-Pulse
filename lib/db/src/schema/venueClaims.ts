import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const venueClaimsTable = pgTable(
  "venue_claims",
  {
    id: serial("id").primaryKey(),
    venueId: integer("venue_id")
      .notNull()
      .references(() => venuesTable.id, { onDelete: "cascade" }),
    operatorUserId: text("operator_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("venue_claims_venue_id_unique").on(table.venueId)],
);

export const insertVenueClaimSchema = createInsertSchema(venueClaimsTable).omit({ id: true, createdAt: true });
export type InsertVenueClaim = z.infer<typeof insertVenueClaimSchema>;
export type VenueClaim = typeof venueClaimsTable.$inferSelect;
