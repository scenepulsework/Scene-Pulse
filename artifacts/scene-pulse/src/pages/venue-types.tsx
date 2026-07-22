import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useListVenues, useListMarkets, getListVenuesQueryKey } from "@workspace/api-client-react";
import { PageIntro } from "@/components/page-intro";
import { VENUE_TYPES } from "@/lib/venue-types";

export default function VenueTypes() {
  const { data: venues } = useListVenues(
    {},
    { query: { queryKey: getListVenuesQueryKey({}) } },
  );
  const { data: markets = [] } = useListMarkets();

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="Venue Types"
        blurb="Every kind of scene we track — pick a type to see live conditions, sub-scenes, and the full directory."
      />
      <section className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
          Browse by type
        </h1>
        <p className="text-muted-foreground font-mono text-sm mb-8 max-w-2xl">
          {venues ? `${venues.length} venues` : "Venues"} across {markets.length || 13} markets, sorted the way you actually decide: what kind of night is it?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VENUE_TYPES.map((type) => {
            const count = venues?.filter((v) => v.category === type.category).length ?? 0;
            const Icon = type.icon;
            return (
              <Link
                key={type.slug}
                href={`/types/${type.slug}`}
                data-testid={`venue-type-card-${type.slug}`}
                className="group bg-card border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {count > 0 ? `${count} live` : ""}
                  </span>
                </div>
                <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-1">
                  {type.plural}
                </h2>
                <p className="text-sm text-muted-foreground flex-1">{type.tagline}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-mono text-primary">
                  See the scene <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
