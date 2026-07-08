import { useState } from "react";
import { useListVenues, useListMarkets, ListVenuesIntent, ListVenuesSort, Venue } from "@workspace/api-client-react";
import { HeroSection, HotZonesSection, MarketsSection, OperatorsSection, ServicesSection, ContactSection } from "@/components/home-sections";
import { VenueFilters } from "@/components/venue-filters";
import { VenueCard } from "@/components/venue-card";
import { SceneMap } from "@/components/scene-map";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, List, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function MobileMapEmbed({ venues }: { venues: Venue[] }) {
  if (!venues.length) return null;
  const avgLat = venues.reduce((sum, v) => sum + v.latitude, 0) / venues.length;
  const avgLng = venues.reduce((sum, v) => sum + v.longitude, 0) / venues.length;
  const src = `https://www.google.com/maps?q=${avgLat},${avgLng}&z=12&output=embed`;

  return (
    <div className="md:hidden mb-6 rounded-lg overflow-hidden border border-border/50 h-[280px]" data-testid="mobile-map-embed">
      <iframe
        title="Live area map"
        src={src}
        className="w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
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

  const { data: markets = [] } = useListMarkets();
  const { data: venues, isLoading } = useListVenues(filters);

  return (
    <div className="min-h-screen">
      <HeroSection />

      <ServicesSection />

      <section id="map" className="py-8 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">Live Pulse</h2>
          </div>
          
          <HotZonesSection />

          <MobileMapEmbed venues={venues || []} />

          <Tabs defaultValue="feed" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <VenueFilters 
                filters={filters} 
                setFilters={setFilters} 
                markets={markets} 
              />
              <TabsList className="bg-card border border-border/50">
                <TabsTrigger value="feed" className="font-mono text-xs uppercase"><List className="w-4 h-4 mr-2" /> Feed</TabsTrigger>
                <TabsTrigger value="map" className="hidden md:inline-flex font-mono text-xs uppercase"><Map className="w-4 h-4 mr-2" /> Pulse Layer</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="feed" className="mt-0">
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
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <SceneMap venues={venues || []} />
            </TabsContent>
          </Tabs>
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