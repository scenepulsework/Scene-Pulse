import { useEffect, useState } from "react";
import { useListVenues, useListMarkets, getListVenuesQueryKey, ListVenuesIntent, ListVenuesSort } from "@workspace/api-client-react";
import { HeroSection, MarketsSection, OperatorsSection, ServicesSection, ContactSection } from "@/components/home-sections";
import { VenueFilters, QuickPicksPanel, ActiveFilterChips } from "@/components/venue-filters";
import { VenueCard } from "@/components/venue-card";
import { LiveMap } from "@/components/live-map";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, ChevronDown } from "lucide-react";

const PAGE_SIZE = 12;

export default function Home() {
  const [filters, setFilters] = useState<{
    market?: string;
    category?: string;
    search?: string;
    sort?: ListVenuesSort;
    intent?: ListVenuesIntent;
  }>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters.market, filters.category, filters.search, filters.intent, filters.sort]);

  const { data: markets = [] } = useListMarkets();
  const { data: venues, isLoading } = useListVenues(filters, {
    query: {
      queryKey: getListVenuesQueryKey(filters),
      placeholderData: (prev) => prev,
    },
  });

  const visibleVenues = venues?.slice(0, visibleCount) ?? [];
  const remaining = (venues?.length ?? 0) - visibleVenues.length;

  return (
    <div className="min-h-screen">
      <HeroSection />

      <ServicesSection />

      <section id="map" className="py-8 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Live Pulse</h2>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              Tap a pin to see conditions and drop a comment in real time.
            </p>
          </div>

          <div className="mb-8">
            <LiveMap
              venues={venues || []}
              emptyPanel={<QuickPicksPanel filters={filters} setFilters={setFilters} />}
            />
          </div>

          <div className="mb-4">
            <VenueFilters
              filters={filters}
              setFilters={setFilters}
              markets={markets}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <ActiveFilterChips filters={filters} setFilters={setFilters} markets={markets} />
            <p className="text-xs font-mono text-muted-foreground shrink-0" data-testid="venue-count">
              {isLoading && !venues
                ? "Scanning venues…"
                : `Showing ${visibleVenues.length} of ${venues?.length ?? 0} venues`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton key={i} className="h-64 rounded-lg bg-card" />
              ))}
            </div>
          ) : venues?.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground font-mono">
              No venues matching your pulse check.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleVenues.map(venue => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
              {remaining > 0 && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-mono border-primary/40 hover:border-primary"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    data-testid="load-more-venues"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load {Math.min(remaining, PAGE_SIZE)} more ({remaining} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <MarketsSection />
      <OperatorsSection />

      <section id="about" className="py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">About ScenePulse</h2>
          <p className="text-lg text-muted-foreground leading-relaxed font-mono">
            We build radar for the night. No more dead crowds, no more unexpected lines, no more guessing.
            Real-time data for the hospitality industry and the people who keep it alive.
          </p>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
