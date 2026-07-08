import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  market: text("market").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address").notNull(),
  rating: real("rating").notNull(),
  crowdScore: integer("crowd_score").notNull(),
  crowdLevel: text("crowd_level").notNull(),
  waitTimeMinutes: integer("wait_time_minutes").notNull(),
  headcount: integer("headcount").notNull(),
  lineTrend: text("line_trend").notNull(),
  seatingOdds: text("seating_odds").notNull(),
  noiseLevel: text("noise_level").notNull(),
  coverCost: text("cover_cost").notNull(),
  bestTimeWindow: text("best_time_window").notNull(),
  bestFor: text("best_for").array().notNull().default([]),
  operatorGapNote: text("operator_gap_note").notNull(),
  peakPressureWindow: text("peak_pressure_window").notNull(),
  reservationSignal: text("reservation_signal").notNull(),
  staffingSignal: text("staffing_signal").notNull(),
  dataSignalsTracked: text("data_signals_tracked").array().notNull().default([]),
  arrivalTips: text("arrival_tips").array().notNull().default([]),
  sourceLabel: text("source_label"),
  sourceUrl: text("source_url"),
  isWatchlisted: boolean("is_watchlisted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVenueSchema = createInsertSchema(venuesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
