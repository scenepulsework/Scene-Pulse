import { Martini, UtensilsCrossed, Coffee, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import type { Venue } from "@workspace/api-client-react";

export type VenueSubtype = {
  slug: string;
  label: string;
  blurb: string;
  match: (venue: Venue) => boolean;
};

export type VenueTypeMeta = {
  slug: string;
  category: string;
  label: string;
  plural: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  subtypes: VenueSubtype[];
};

const hasTag = (venue: Venue, ...tags: string[]) =>
  venue.bestFor.some((t) => tags.includes(t.toLowerCase()));

const GAME_TAGS = [
  "pool table",
  "pool tables",
  "bar games",
  "bar game",
  "shuffleboard",
  "darts",
  "ping pong",
  "game bar",
  "foosball",
  "bowling",
  "arcade",
  "karaoke",
];

export const VENUE_TYPES: VenueTypeMeta[] = [
  {
    slug: "bars",
    category: "bar",
    label: "Bar",
    plural: "Bars",
    icon: Martini,
    tagline: "Cocktail dens, dives, breweries, and hidden doors.",
    description:
      "Every bar on the pulse — from listed-address dives to password-only speakeasies. Check the crowd score before you commit to the walk.",
    subtypes: [
      {
        slug: "speakeasies",
        label: "Speakeasies & Hidden Doors",
        blurb: "Unmarked entrances, reservation books, and rooms behind the record shop.",
        match: (v) => hasTag(v, "speakeasy"),
      },
      {
        slug: "live-music",
        label: "Live Music Bars",
        blurb: "Stages, house bands, and rooms where the set matters as much as the pour.",
        match: (v) => hasTag(v, "live music"),
      },
      {
        slug: "game-bars",
        label: "Game & Interactive Bars",
        blurb: "Pool tables, darts, shuffleboard, pinball — bars you play, not just drink at.",
        match: (v) => hasTag(v, ...GAME_TAGS),
      },
      {
        slug: "patio-rooftop",
        label: "Patio & Rooftop Energy",
        blurb: "Open-air decks and rooftops where the scene spills outside.",
        match: (v) => hasTag(v, "patio energy"),
      },
      {
        slug: "late-night",
        label: "Late-Night Standbys",
        blurb: "Still pouring (and still feeding you) after everyone else calls last round.",
        match: (v) => hasTag(v, "late-night food"),
      },
      {
        slug: "date-night",
        label: "Date-Night Cocktails",
        blurb: "Low light, good seats, cocktails worth talking over.",
        match: (v) => hasTag(v, "date night"),
      },
    ],
  },
  {
    slug: "restaurants",
    category: "restaurant",
    label: "Restaurant",
    plural: "Restaurants",
    icon: UtensilsCrossed,
    tagline: "From walk-in taquerias to book-ahead dining rooms.",
    description:
      "Live wait times and seating odds for every restaurant on the map — so you know whether to walk in, or walk past.",
    subtypes: [
      {
        slug: "date-night",
        label: "Date-Night Tables",
        blurb: "The rooms worth dressing up for.",
        match: (v) => hasTag(v, "date night"),
      },
      {
        slug: "patio-dining",
        label: "Patio Dining",
        blurb: "Outdoor tables with real energy — not just two chairs on a sidewalk.",
        match: (v) => hasTag(v, "patio energy"),
      },
      {
        slug: "walk-in",
        label: "Walk-In Friendly",
        blurb: "Consistently short lines. Show up, sit down.",
        match: (v) => hasTag(v, "no wait"),
      },
      {
        slug: "late-night",
        label: "Late-Night Eats",
        blurb: "Kitchens that keep going after midnight.",
        match: (v) => hasTag(v, "late-night food"),
      },
      {
        slug: "dinner-show",
        label: "Dinner & a Show",
        blurb: "Live sets alongside dinner service.",
        match: (v) => hasTag(v, "live music"),
      },
    ],
  },
  {
    slug: "cafes",
    category: "cafe",
    label: "Café",
    plural: "Cafés",
    icon: Coffee,
    tagline: "Coffee bars, bakeries, and the laptop-crowd question answered live.",
    description:
      "Is there a seat? Is the line out the door? Live conditions for every café on the pulse — before you commit to the walk with a laptop bag.",
    subtypes: [
      {
        slug: "walk-in",
        label: "Quick In-and-Out",
        blurb: "Fast lines, fast pours — caffeine without the ceremony.",
        match: (v) => hasTag(v, "no wait"),
      },
      {
        slug: "patio",
        label: "Patio Cafés",
        blurb: "Outdoor seats worth lingering in.",
        match: (v) => hasTag(v, "patio energy"),
      },
      {
        slug: "date-spot",
        label: "Coffee-Date Spots",
        blurb: "First-date safe: good light, good noise level, good exit options.",
        match: (v) => hasTag(v, "date night"),
      },
    ],
  },
  {
    slug: "retail",
    category: "retail",
    label: "Retail",
    plural: "Retail & Shops",
    icon: ShoppingBag,
    tagline: "Drop culture, record stores, and lines worth (or not worth) standing in.",
    description:
      "Release-day lines, restock crowds, and browse-anytime shops — live foot traffic for retail so you can time the drop.",
    subtypes: [
      {
        slug: "drop-culture",
        label: "Drop Culture",
        blurb: "Release-day lines and limited restocks — timing is everything.",
        match: (v) => hasTag(v, "retail drop"),
      },
      {
        slug: "browse-anytime",
        label: "Browse Anytime",
        blurb: "No lines, no pressure — wander in whenever.",
        match: (v) => hasTag(v, "no wait"),
      },
    ],
  },
  {
    slug: "experiences",
    category: "experience",
    label: "Experience",
    plural: "Experiences",
    icon: Sparkles,
    tagline: "Music halls, game bars, food halls, and everything you do rather than order.",
    description:
      "Venues built around doing something — live shows, arcades, food halls, social gaming. Check the pulse before you buy the ticket.",
    subtypes: [
      {
        slug: "live-shows",
        label: "Live Music & Shows",
        blurb: "Listening rooms, legendary stages, and nightly sets.",
        match: (v) => hasTag(v, "live music"),
      },
      {
        slug: "games-play",
        label: "Games & Play",
        blurb: "Arcades, pinball, bowling, and bar-game halls.",
        match: (v) => hasTag(v, ...GAME_TAGS),
      },
      {
        slug: "date-night",
        label: "Date-Night Experiences",
        blurb: "More memorable than dinner-and-drinks.",
        match: (v) => hasTag(v, "date night"),
      },
    ],
  },
];

export function findVenueType(slug: string): VenueTypeMeta | undefined {
  return VENUE_TYPES.find((t) => t.slug === slug);
}
