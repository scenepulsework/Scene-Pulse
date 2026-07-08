import { useState } from "react";
import { useListVenues, useListMarkets, getListVenuesQueryKey, ListVenuesIntent, ListVenuesSort } from "@workspace/api-client-react";
import { HeroSection, MarketsSection, OperatorsSection, ServicesSection, ContactSection } from "@/components/home-sections";
import { VenueFilters, QuickPicksPanel } from "@/components/venue-filters";
import { VenueCard } from "@/components/venue-card";
import { LiveMap } from "@/components/live-map";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export default function Home() {
  const [filters, setFilters] = useState<{
    market?: string;
    category?: string;
    search?: string;
    sort?: ListVenuesSort;
    intent?: ListVenuesIntent;
  }>({});

  const { data: markets = [] } = useListMarkets();
  const { data: venues, isLoading } = useListVenues(filters, {
    query: {
      queryKey: getListVenuesQueryKey(filters),
      placeholderData: (prev) => prev,
    },
  });

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

          <div className="mb-6">
            <VenueFilters
              filters={filters}
              setFilters={setFilters}
              markets={markets}
            />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {venues?.map(venue => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
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
