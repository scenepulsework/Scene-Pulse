import { useParams, Link } from "wouter";
import { PageIntro } from "@/components/page-intro";
import { useListVenues, useListMarkets, getListVenuesQueryKey, getListMarketsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Clock, ArrowRight, Activity, ChevronRight, BarChart2, Star } from "lucide-react";
import NotFound from "@/pages/not-found";

const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bars",
  restaurant: "Restaurants",
  cafe: "Cafes",
  retail: "Retail",
  experience: "Experiences",
};

const CROWD_COLOR: Record<string, string> = {
  open: "border-green-500/50 text-green-500",
  lively: "border-secondary/50 text-secondary",
  packed: "border-destructive/50 text-destructive",
};

const MARKET_BIOS: Record<string, string> = {
  "Chicago": "Chicago's scene runs from River North's polished rooftops to Logan Square's no-frills dive bars. High crowd velocity on weekends, especially Thursday through Saturday after 9pm.",
  "New York City": "New York never actually sleeps — the crowd just shifts boroughs. Peak pressure in Manhattan concentrates in Midtown and the West Village on Friday and Saturday nights.",
  "Los Angeles": "LA's nightlife is sprawling and car-dependent. Hollywood, Silver Lake, and DTLA each run on different schedules — early dinner crowds give way to late late-night bar scenes.",
  "Miami": "Miami peaks later than anywhere else in North America. Crowds build from 11pm and bars stay packed until 4am on weekends. Wynwood and Brickell lead by venue density.",
  "Austin": "Austin's Rainey Street and Sixth Street are two distinct ecosystems. Rainey skews craft-beer bungalows; Sixth is the high-volume live music corridor.",
  "Nashville": "Nashville's Broadway corridor is packed seven nights a week. The Gulch and East Nashville offer alternatives for locals looking to avoid tourist-level crowds.",
  "Seattle": "Seattle's bar scene concentrates in Capitol Hill and Belltown. The city runs quieter than the coasts and crowd pressure rarely hits the peaks you'd see in NYC or Miami.",
  "San Francisco": "SOMA, the Mission, and North Beach each have distinct crowd windows. Tech-crowd happy hours peak early; Mission bar crawls start late.",
  "Boston": "Boston's nightlife skews young thanks to the student population. Fenway, Allston, and Back Bay carry the highest venue density and weekend crowd pressure.",
  "Washington DC": "14th Street NW is the axis of DC's nightlife. The scene is heavily weeknight-friendly — politicos and professionals fill bars from Thursday on.",
  "Toronto": "Toronto's King West and Queen West neighborhoods carry the highest crowd density. The city's nightlife is multilayered and runs surprisingly late for a Canadian market.",
  "Vancouver": "Gastown and Granville Street anchor Vancouver's nightlife. The city is more low-key than Toronto but carries solid weekend crowd pressure in the core.",
  "Mexico City": "Mexico City's Condesa and Roma Norte neighborhoods punch above their weight globally. Bars here run on CDMX time — shows and nights don't start until well after 10pm.",
};

export default function MarketDetail() {
  const params = useParams<{ market: string }>();
  const marketParam = decodeURIComponent(params.market ?? "");

  const { data: markets, isLoading: marketsLoading } = useListMarkets({
    query: { queryKey: getListMarketsQueryKey() },
  });

  const marketMeta = markets?.find(
    (m) => m.market.toLowerCase() === marketParam.toLowerCase() || m.city.toLowerCase() === marketParam.toLowerCase()
  );

  const { data: allVenues, isLoading: venuesLoading } = useListVenues(
    { market: marketMeta?.market },
    {
      query: {
        queryKey: getListVenuesQueryKey({ market: marketMeta?.market }),
        enabled: !!marketMeta,
      },
    }
  );

  const isLoading = marketsLoading || venuesLoading;

  if (!isLoading && markets && !marketMeta) return <NotFound />;

  const topVenues = [...(allVenues ?? [])].sort((a, b) => b.crowdScore - a.crowdScore).slice(0, 6);
  const speakeasies = (allVenues ?? []).filter((v) => v.bestFor?.includes("Speakeasy"));
  const categoryCounts = (allVenues ?? []).reduce<Record<string, number>>((acc, v) => {
    acc[v.category] = (acc[v.category] ?? 0) + 1;
    return acc;
  }, {});
  const packedNow = (allVenues ?? []).filter((v) => v.crowdLevel === "packed").length;
  const openNow = (allVenues ?? []).filter((v) => v.crowdLevel === "open").length;
  const bio = marketMeta ? (MARKET_BIOS[marketMeta.city] ?? MARKET_BIOS[marketMeta.market] ?? null) : null;

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow={marketMeta?.city ?? marketParam}
        parent={{ label: "Markets", href: "/markets" }}
        blurb={marketMeta ? `${marketMeta.venueCount} venues tracked live · ${marketMeta.region}, ${marketMeta.country}` : undefined}
      />

      {isLoading ? (
        <div className="container mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {bio && (
            <section className="py-10 border-b border-border/40">
              <div className="container mx-auto px-4 max-w-3xl">
                <p className="text-lg text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            </section>
          )}

          <section className="py-10 border-b border-border/40 bg-muted/10">
            <div className="container mx-auto px-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-6">Live snapshot</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBlock label="Total Venues" value={marketMeta?.venueCount ?? allVenues?.length ?? 0} icon={<MapPin className="w-4 h-4" />} />
                <StatBlock label="Packed Now" value={packedNow} icon={<Users className="w-4 h-4 text-destructive" />} accent="text-destructive" />
                <StatBlock label="Open / Easy" value={openNow} icon={<Activity className="w-4 h-4 text-green-500" />} accent="text-green-500" />
                <StatBlock label="Speakeasies" value={speakeasies.length} icon={<Star className="w-4 h-4 text-primary" />} accent="text-primary" />
              </div>
            </div>
          </section>

          {Object.keys(categoryCounts).length > 0 && (
            <section className="py-10 border-b border-border/40">
              <div className="container mx-auto px-4">
                <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Venue breakdown
                </h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <div key={cat} className="bg-card border border-border/50 rounded-xl px-4 py-2 flex items-center gap-3">
                      <span className="font-bold">{count}</span>
                      <span className="text-sm text-muted-foreground font-mono">{CATEGORY_LABELS[cat] ?? cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {topVenues.length > 0 && (
            <section className="py-12 border-b border-border/40">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Hottest venues right now</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topVenues.map((v) => (
                    <Link key={v.id} href={`/venue/${v.id}`} className="group block bg-card border border-border/50 rounded-xl p-5 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{CATEGORY_LABELS[v.category] ?? v.category}</div>
                          <div className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{v.name}</div>
                        </div>
                        <Badge variant="outline" className={`shrink-0 font-mono text-[10px] uppercase ${CROWD_COLOR[v.crowdLevel] ?? ""}`}>
                          {v.crowdLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {v.crowdScore}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {v.waitTimeMinutes}m wait</span>
                      </div>
                      <div className="mt-3 flex items-center text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Full intel <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="py-12">
            <div className="container mx-auto px-4 flex flex-col sm:flex-row gap-4">
              <Button asChild className="rounded-full gap-2">
                <Link href={`/?market=${encodeURIComponent(marketMeta?.market ?? marketParam)}#map`}>
                  Explore {marketMeta?.city ?? marketParam} on the map <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full gap-2">
                <Link href="/markets">
                  All markets <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon, accent = "" }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col gap-2">
      <div className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground ${accent}`}>
        {icon} {label}
      </div>
      <div className={`text-3xl font-black leading-none ${accent}`}>{value}</div>
    </div>
  );
}
