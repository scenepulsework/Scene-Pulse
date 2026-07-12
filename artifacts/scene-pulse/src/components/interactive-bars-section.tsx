import { Link } from "wouter";
import { Gamepad2, MapPin, Clock, ArrowUpRight, Dices } from "lucide-react";
import {
  useListVenues,
  getListVenuesQueryKey,
  ListVenuesIntent,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FILTERS = { intent: ListVenuesIntent.interactiveBars };

const GAME_TAGS = ["Pool Tables", "Shuffleboard", "Darts", "Foosball", "Ping Pong", "Bocce", "Bar Games", "Arcade"];

function getGameTags(bestFor: string[]): string[] {
  return bestFor.filter((t) => GAME_TAGS.some((g) => t.toLowerCase().includes(g.toLowerCase())));
}

export function InteractiveBarsSection({
  onShowOnMap,
}: {
  onShowOnMap: (id: number) => void;
}) {
  const { data: venues = [] } = useListVenues(FILTERS, {
    query: { queryKey: getListVenuesQueryKey(FILTERS) },
  });

  if (venues.length === 0) return null;

  return (
    <section id="interactive-bars" className="py-16 md:py-24 relative overflow-hidden scroll-mt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] mb-3">
              <Gamepad2 className="w-4 h-4" />
              Play while you drink
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              INTERACTIVE <span className="text-primary">BARS</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Pool tables, shuffleboard, darts, and bar games — venues where the night has a soundtrack
              and a scoreboard, live crowd signals included.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-sm font-mono text-muted-foreground">
              {venues.length} game bars tracked
            </div>
          </div>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
          data-testid="interactive-bars-scroller"
        >
          {venues.map((venue) => {
            const gameTags = getGameTags(venue.bestFor);
            return (
              <div
                key={venue.id}
                className="snap-start shrink-0 w-[270px] sm:w-[310px] rounded-xl border border-primary/20 bg-card/80 backdrop-blur p-5 flex flex-col gap-3 hover:border-primary/60 transition-colors group"
                data-testid={`interactive-bar-card-${venue.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {venue.city}
                    </div>
                    <Link
                      href={`/venue/${venue.id}`}
                      className="font-bold text-lg leading-tight hover:text-primary transition-colors block truncate"
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

                {gameTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {gameTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary/80 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                        <Dices className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {venue.sourceLabel && (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary/60">
                    {venue.sourceLabel}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-mono text-xs border-primary/30 hover:border-primary"
                    data-testid={`interactive-bar-map-${venue.id}`}
                    onClick={() => onShowOnMap(venue.id)}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    On the map
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-mono text-xs text-muted-foreground hover:text-primary"
                  >
                    <Link href={`/venue/${venue.id}`}>
                      Intel
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
