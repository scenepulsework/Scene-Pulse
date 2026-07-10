import { Link } from "wouter";
import { KeyRound, MapPin, Clock, ArrowUpRight } from "lucide-react";
import {
  useListVenues,
  getListVenuesQueryKey,
  ListVenuesIntent,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SPEAKEASY_FILTERS = { intent: ListVenuesIntent.speakeasy };

export function SpeakeasySection({
  onShowOnMap,
}: {
  onShowOnMap: (id: number) => void;
}) {
  const { data: venues = [] } = useListVenues(SPEAKEASY_FILTERS, {
    query: { queryKey: getListVenuesQueryKey(SPEAKEASY_FILTERS) },
  });

  if (venues.length === 0) return null;

  return (
    <section id="speakeasies" className="py-16 md:py-24 relative overflow-hidden scroll-mt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-secondary font-mono text-xs uppercase tracking-[0.3em] mb-3">
              <KeyRound className="w-4 h-4" />
              If you know, you know
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              THE SPEAKEASY <span className="text-secondary">FILES</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Hidden doors, password bars, and back-room counters across {new Set(venues.map((v) => v.market)).size} markets — with live crowd
              signals so the secret stays worth it.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-sm font-mono text-muted-foreground">
              {venues.length} hidden rooms tracked
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="font-mono text-xs border-secondary/30 hover:border-secondary"
            >
              <Link href="/speakeasies" data-testid="link-all-speakeasies">
                See all
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
          data-testid="speakeasy-scroller"
        >
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="snap-start shrink-0 w-[260px] sm:w-[300px] rounded-xl border border-secondary/20 bg-card/80 backdrop-blur p-5 flex flex-col gap-3 hover:border-secondary/60 transition-colors group"
              data-testid={`speakeasy-card-${venue.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
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

              <div className="flex items-center gap-2 mt-auto pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 font-mono text-xs border-secondary/30 hover:border-secondary"
                  data-testid={`speakeasy-map-${venue.id}`}
                  onClick={() => onShowOnMap(venue.id)}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  On the map
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs text-muted-foreground hover:text-secondary"
                >
                  <Link href={`/venue/${venue.id}`}>
                    Intel
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
