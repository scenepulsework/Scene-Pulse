import type { Venue as VenueRow } from "@workspace/db";

export function toMapsUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

export function presentVenue(row: VenueRow) {
  // contactEmail is an internal business field — never expose it in public API responses.
  const { contactEmail: _contactEmail, ...rest } = row;
  return {
    ...rest,
    mapsUrl: toMapsUrl(row.name, row.address),
  };
}
