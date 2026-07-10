import { useEffect } from "react";
import { Link } from "wouter";
import { KeyRound, Clock, ArrowUpRight, MapPin } from "lucide-react";
import {
  useListVenues,
  getListVenuesQueryKey,
  ListVenuesIntent,
  Venue,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageIntro } from "@/components/page-intro";
import { useSpeakeasy } from "@/components/speakeasy-context";

const SPEAKEASY_FILTERS = { intent: ListVenuesIntent.speakeasy };

function SpeakeasyCard({ venue }: { venue: Venue }) {
  return (
    <div
      className="rounded-xl border border-secondary/20 bg-card/80 backdrop-blur p-5 flex flex-col gap-3 hover:border-secondary/60 transition-colors"
      data-testid={`speakeasy-page-card-${venue.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {venue.city}
          </div>
          <Link
            href={`/venue/${venue.id}`}
            className="font-bold text-lg leading-tight hover:text-secondary transition-colors block truncate"
          >
            {venue.name}
          </Link>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 font-mono text-[10px] uppercase ${
            venue.crowdLevel === "packed"
              ? "border-destructive/50 text-destructive"
              : venue.crowdLevel === "lively"
                ? "border-secondary/50 text-secondary"
                : "border-green-500/50 text-green-500"
          }`}
        >
          {venue.crowdLevel}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {venue.waitTimeMinutes}m wait
        </span>
        <span>pulse {venue.crowdScore}</span>
      </div>

      {venue.sourceLabel && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-secondary/70">
          {venue.sourceLabel}
        </div>
      )}

      <div className="mt-auto pt-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full font-mono text-xs border-secondary/30 hover:border-secondary"
        >
          <Link href={`/venue/${venue.id}`} data-testid={`speakeasy-page-intel-${venue.id}`}>
            Full intel
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function Speakeasies() {
  const { unlock } = useSpeakeasy();
  // Finding the page directly counts as knowing the password.
  useEffect(() => {
    unlock();
  }, [unlock]);

  const { data: venues, isLoading } = useListVenues(SPEAKEASY_FILTERS, {
    query: { queryKey: getListVenuesQueryKey(SPEAKEASY_FILTERS) },
  });

  const byMarket = new Map<string, Venue[]>();
  for (const v of venues ?? []) {
    const list = byMarket.get(v.market) ?? [];
    list.push(v);
    byMarket.set(v.market, list);
  }
  const markets = [...byMarket.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="Speakeasies"
        blurb="Every hidden room we track, market by market."
      />

      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-secondary font-mono text-xs uppercase tracking-[0.3em] mb-3">
                <KeyRound className="w-4 h-4" />
                If you know, you know
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                THE SPEAKEASY <span className="text-secondary">FILES</span>
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl">
                Hidden doors, password bars, and back-room counters — with live crowd
                signals so the secret stays worth it.
              </p>
            </div>
            {venues && (
              <div className="text-sm font-mono text-muted-foreground shrink-0" data-testid="speakeasy-page-count">
                {venues.length} hidden rooms · {markets.length} markets
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl bg-card" />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {markets.map((market) => (
                <div key={market}>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-4 flex items-baseline gap-3">
                    {market}
                    <span className="text-xs font-mono font-normal text-muted-foreground">
                      {byMarket.get(market)!.length} hidden {byMarket.get(market)!.length === 1 ? "room" : "rooms"}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {byMarket.get(market)!.map((venue) => (
                      <SpeakeasyCard key={venue.id} venue={venue} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
