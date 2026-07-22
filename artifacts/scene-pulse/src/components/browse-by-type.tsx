import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useListVenues, getListVenuesQueryKey } from "@workspace/api-client-react";
import { VENUE_TYPES } from "@/lib/venue-types";

export function BrowseByType() {
  const { data: venues } = useListVenues(
    {},
    { query: { queryKey: getListVenuesQueryKey({}), placeholderData: (prev) => prev } },
  );

  return (
    <section className="py-8 container mx-auto px-4" data-testid="browse-by-type">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-5">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Browse by type</h2>
        <Link
          href="/types"
          className="text-sm font-mono text-primary hover:underline inline-flex items-center gap-1"
          data-testid="link-all-types"
        >
          All types <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {VENUE_TYPES.map((type) => {
          const count = venues?.filter((v) => v.category === type.category).length ?? 0;
          const Icon = type.icon;
          return (
            <Link
              key={type.slug}
              href={`/types/${type.slug}`}
              data-testid={`browse-type-${type.slug}`}
              className="group bg-card border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-6 h-6 text-primary" />
                {count > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground">{count}</span>
                )}
              </div>
              <div className="font-bold leading-tight group-hover:text-primary transition-colors">
                {type.plural}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
