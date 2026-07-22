import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { ChevronDown, ChevronUp, ArrowRight, MapPin } from "lucide-react";
import {
  useListVenues,
  useListMarkets,
  getListVenuesQueryKey,
  Venue,
} from "@workspace/api-client-react";
import { PageIntro } from "@/components/page-intro";
import { VenueCard } from "@/components/venue-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findVenueType, type VenueSubtype } from "@/lib/venue-types";
import NotFound from "@/pages/not-found";

const PREVIEW_COUNT = 4;
const DIRECTORY_PAGE = 12;

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-lg px-4 py-3">
      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function SubtypeSection({
  subtype,
  venues,
  typeSlug,
}: {
  subtype: VenueSubtype;
  venues: Venue[];
  typeSlug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (venues.length === 0) return null;

  const shown = expanded ? venues : venues.slice(0, PREVIEW_COUNT);
  const hiddenCount = venues.length - PREVIEW_COUNT;

  return (
    <section
      className="py-8 border-t border-border/40"
      data-testid={`subtype-section-${typeSlug}-${subtype.slug}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 mb-1">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
          {subtype.label}
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {venues.length} venue{venues.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">{subtype.blurb}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shown.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
      {hiddenCount > 0 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            className="font-mono border-primary/40 hover:border-primary"
            onClick={() => setExpanded((e) => !e)}
            data-testid={`subtype-toggle-${typeSlug}-${subtype.slug}`}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" /> Show fewer
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" /> Show all {venues.length}
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}

export default function VenueTypeDetail() {
  const params = useParams<{ slug: string }>();
  const type = findVenueType(params.slug ?? "");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [directoryCount, setDirectoryCount] = useState(DIRECTORY_PAGE);

  const filters = type ? { category: type.category } : {};
  const { data: venues, isLoading } = useListVenues(filters, {
    query: {
      queryKey: getListVenuesQueryKey(filters),
      enabled: Boolean(type),
    },
  });
  const { data: markets = [] } = useListMarkets();

  const filtered = useMemo(() => {
    if (!venues) return [];
    return marketFilter === "all" ? venues : venues.filter((v) => v.market === marketFilter);
  }, [venues, marketFilter]);

  const directory = useMemo(
    () => [...filtered].sort((a, b) => a.name.localeCompare(b.name)),
    [filtered],
  );

  if (!type) return <NotFound />;

  const Icon = type.icon;
  const openNow = filtered.filter((v) => v.crowdLevel === "open").length;
  const avgWait = filtered.length
    ? Math.round(filtered.reduce((sum, v) => sum + v.waitTimeMinutes, 0) / filtered.length)
    : 0;
  const marketCount = new Set(filtered.map((v) => v.market)).size;

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow={type.plural}
        parent={{ label: "Venue Types", href: "/types" }}
        blurb={type.description}
      />

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-black uppercase tracking-tighter"
                data-testid={`venue-type-title-${type.slug}`}
              >
                {type.plural}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">{type.tagline}</p>
            </div>
          </div>
          <Select
            value={marketFilter}
            onValueChange={(v) => {
              setMarketFilter(v);
              setDirectoryCount(DIRECTORY_PAGE);
            }}
          >
            <SelectTrigger
              className="w-full md:w-56 font-mono"
              data-testid="venue-type-market-filter"
            >
              <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All markets</SelectItem>
              {markets.map((m) => (
                <SelectItem key={m.market} value={m.market}>
                  {m.market}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg bg-card" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatBlock label="On the pulse" value={String(filtered.length)} />
              <StatBlock label="Markets" value={String(marketCount)} />
              <StatBlock label="Open right now" value={String(openNow)} />
              <StatBlock label="Avg wait" value={`${avgWait} min`} />
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-mono">
                No {type.plural.toLowerCase()} in this market yet.
              </div>
            ) : (
              <>
                {type.subtypes.map((subtype) => (
                  <SubtypeSection
                    key={subtype.slug}
                    subtype={subtype}
                    venues={filtered.filter(subtype.match)}
                    typeSlug={type.slug}
                  />
                ))}

                <section className="py-8 border-t border-border/40">
                  <div className="flex flex-wrap items-end justify-between gap-2 mb-5">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                      Full directory
                    </h2>
                    <span className="text-xs font-mono text-muted-foreground">
                      A–Z · {directory.length} venue{directory.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {directory.slice(0, directoryCount).map((venue) => (
                      <VenueCard key={venue.id} venue={venue} />
                    ))}
                  </div>
                  {directory.length > directoryCount && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        size="lg"
                        className="font-mono border-primary/40 hover:border-primary"
                        onClick={() => setDirectoryCount((c) => c + DIRECTORY_PAGE)}
                        data-testid="venue-type-directory-load-more"
                      >
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load more ({directory.length - directoryCount} left)
                      </Button>
                    </div>
                  )}
                </section>
              </>
            )}

            <div className="mt-4 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:underline"
                data-testid="venue-type-back-to-map"
              >
                See {type.plural.toLowerCase()} on the live map <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
