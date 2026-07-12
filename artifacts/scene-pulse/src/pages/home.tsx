import { useCallback, useEffect, useState } from "react";
import { useListVenues, useListMarkets, getListVenuesQueryKey, ListVenuesIntent, ListVenuesSort, Venue } from "@workspace/api-client-react";
import { HeroSection } from "@/components/home-sections";
import { VenueFilters, QuickPicksPanel, ActiveFilterChips } from "@/components/venue-filters";
import { VenueCard } from "@/components/venue-card";
import { LiveMap } from "@/components/live-map";
import { SpeakeasySection } from "@/components/speakeasy-section";
import { InteractiveBarsSection } from "@/components/interactive-bars-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, ChevronDown, ArrowUp } from "lucide-react";

const PAGE_SIZE = 12;

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Back to top"
      data-testid="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-[1100] rounded-full bg-background/90 backdrop-blur border-primary/40 hover:border-primary shadow-lg shadow-black/40"
    >
      <ArrowUp className="w-4 h-4" />
    </Button>
  );
}

export default function Home() {
  const [filters, setFilters] = useState<{
    market?: string;
    category?: string;
    search?: string;
    sort?: ListVenuesSort;
    intent?: ListVenuesIntent;
  }>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters.market, filters.category, filters.search, filters.intent, filters.sort]);

  const { data: markets = [] } = useListMarkets();
  const { data: venues, isLoading, isPlaceholderData } = useListVenues(filters, {
    query: {
      queryKey: getListVenuesQueryKey(filters),
      placeholderData: (prev) => prev,
    },
  });
  const { data: allVenues } = useListVenues(
    {},
    {
      query: {
        queryKey: getListVenuesQueryKey({}),
        placeholderData: (prev) => prev,
      },
    },
  );

  const showVenueOnMap = useCallback(
    (id: number) => {
      // If the current filters hide this venue, widen them so its pin exists.
      if (!venues?.some((v) => v.id === id)) {
        setFilters((prev) => ({ sort: prev.sort }));
      }
      setSelectedVenueId(id);
      document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [venues],
  );

  const handlePickVenue = useCallback(
    (venue: Venue) => {
      // Jump straight to the venue: clear narrowing filters so its pin is on the map.
      setFilters((prev) => ({ sort: prev.sort }));
      showVenueOnMap(venue.id);
    },
    [showVenueOnMap],
  );

  const visibleVenues = venues?.slice(0, visibleCount) ?? [];
  const remaining = (venues?.length ?? 0) - visibleVenues.length;

  return (
    <div className="min-h-screen">
      <HeroSection />

      <section id="map" className="py-8 bg-muted/20 border-y border-border/40 scroll-mt-16">
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
              selectedId={selectedVenueId}
              onSelect={setSelectedVenueId}
              dataReady={!isLoading && !isPlaceholderData}
            />
          </div>

          <div className="mb-4">
            <VenueFilters
              filters={filters}
              setFilters={setFilters}
              markets={markets}
              allVenues={allVenues}
              onPickVenue={handlePickVenue}
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
                  <VenueCard key={venue.id} venue={venue} onShowOnMap={showVenueOnMap} />
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

      <InteractiveBarsSection onShowOnMap={showVenueOnMap} />
      <SpeakeasySection onShowOnMap={showVenueOnMap} />
      <BackToTop />
    </div>
  );
}
