import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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
    status: text("status").notNull().default("pending"),
    verificationCode: text("verification_code").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One claim per operator per venue; multiple operators may have competing pending claims.
    uniqueIndex("venue_claims_venue_operator_unique").on(table.venueId, table.operatorUserId),
    // But only one VERIFIED claim per venue.
    uniqueIndex("venue_claims_verified_venue_unique")
      .on(table.venueId)
      .where(sql`${table.status} = 'verified'`),
  ],
);

export const insertVenueClaimSchema = createInsertSchema(venueClaimsTable).omit({ id: true, createdAt: true });
export type InsertVenueClaim = z.infer<typeof insertVenueClaimSchema>;
export type VenueClaim = typeof venueClaimsTable.$inferSelect;
