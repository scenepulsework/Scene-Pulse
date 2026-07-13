import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListVenuesIntent, ListVenuesSort, VenueCategory, Venue } from "@workspace/api-client-react";
import { Search, MapPin, SlidersHorizontal, Flame, Music, Moon, Clock, Heart, GlassWater, Coffee, ShoppingBag, Map, Zap, X, KeyRound, Gamepad2 } from "lucide-react";

type VenueFiltersProps = {
  filters: {
    market?: string;
    category?: string;
    search?: string;
    sort?: ListVenuesSort;
    intent?: ListVenuesIntent;
  };
  setFilters: (filters: any) => void;
  markets: { market: string; city: string }[];
  allVenues?: Venue[];
  onPickVenue?: (venue: Venue) => void;
};

const INTENTS = [
  { value: ListVenuesIntent.dateNight, label: "Date night", description: "Lower noise, better seating, good energy", badge: "best vibe", icon: <Heart className="w-4 h-4" /> },
  { value: ListVenuesIntent.noWait, label: "No wait", description: "Shortest friction first", badge: "low friction", icon: <Clock className="w-4 h-4" /> },
  { value: ListVenuesIntent.retailDrops, label: "Retail drops", description: "Shops with product or promo signals", badge: "best vibe", icon: <ShoppingBag className="w-4 h-4" /> },
  { value: ListVenuesIntent.liveMusic, label: "Live music", description: "Showrooms, sets, and crowd pressure", badge: "best vibe", icon: <Music className="w-4 h-4" /> },
  { value: ListVenuesIntent.patioEnergy, label: "Patio energy", description: "Outdoor seating with a lively crowd", badge: "best vibe", icon: <Flame className="w-4 h-4" /> },
  { value: ListVenuesIntent.lateNightFood, label: "Late night", description: "Kitchens still firing after hours", badge: "low friction", icon: <Moon className="w-4 h-4" /> },
  { value: ListVenuesIntent.interactiveBars, label: "Game bars", description: "Pool tables, shuffleboard, darts & more", badge: "play all night", icon: <Gamepad2 className="w-4 h-4" /> },
  { value: ListVenuesIntent.speakeasy, label: "Speakeasy", description: "Hidden doors and password bars", badge: "if you know", icon: <KeyRound className="w-4 h-4" /> },
];

export function QuickPicksPanel({ filters, setFilters }: Pick<VenueFiltersProps, "filters" | "setFilters">) {
  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value === 'all' ? undefined : value }));
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-4 h-full">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-warm mb-1">
          <Zap className="w-3.5 h-3.5" /> Quick Picks
        </div>
        <h3 className="font-black text-lg leading-tight mb-1">Tell ScenePulse what kind of night you want</h3>
        <p className="text-sm text-muted-foreground">These shortcuts instantly filter venues so discovery feels like a concierge, not a static directory.</p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="quickpick-all-vibes"
          onClick={() => updateFilter("intent", undefined)}
          className={`text-left rounded-xl px-4 py-3 border transition-colors ${!filters.intent ? "border-primary bg-primary/10" : "border-border/50 bg-muted/20 hover:bg-muted/40"}`}
        >
          <div className="font-bold">All vibes</div>
          <div className="text-sm text-muted-foreground">Clear quick pick filter and see everything</div>
        </button>
        {INTENTS.map((intent) => {
          const active = filters.intent === intent.value;
          return (
            <button
              key={intent.value}
              type="button"
              data-testid={`quickpick-${intent.value}`}
              onClick={() => updateFilter("intent", active ? undefined : intent.value)}
              className={`text-left rounded-xl px-4 py-3 border transition-colors flex items-center justify-between gap-3 ${active ? "border-primary bg-primary/10" : "border-border/50 bg-muted/20 hover:bg-muted/40"}`}
            >
              <div className="min-w-0">
                <div className="font-bold flex items-center gap-2">{intent.icon} {intent.label}</div>
                <div className="text-sm text-muted-foreground">{intent.description}</div>
              </div>
              <Badge variant="secondary" className="shrink-0 rounded-full font-mono text-[10px] uppercase">{intent.badge}</Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bars",
  restaurant: "Restaurants",
  cafe: "Cafes",
  retail: "Retail",
  experience: "Experiences",
};

export function ActiveFilterChips({ filters, setFilters, markets }: VenueFiltersProps) {
  const clear = (key: string) => setFilters((prev: any) => ({ ...prev, [key]: undefined }));

  const chips: { key: string; label: string }[] = [];
  if (filters.search) chips.push({ key: "search", label: `"${filters.search}"` });
  if (filters.market) {
    const m = markets.find((m) => m.market === filters.market);
    chips.push({ key: "market", label: m?.city ?? filters.market });
  }
  if (filters.category) chips.push({ key: "category", label: CATEGORY_LABELS[filters.category] ?? filters.category });
  if (filters.intent) {
    const intent = INTENTS.find((i) => i.value === filters.intent);
    chips.push({ key: "intent", label: intent?.label ?? filters.intent });
  }

  if (chips.length === 0) {
    return <p className="text-xs font-mono text-muted-foreground">All venues, all markets — filter above to narrow the pulse.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="active-filter-chips">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          data-testid={`filter-chip-${chip.key}`}
          onClick={() => clear(chip.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-mono hover:bg-primary/20 transition-colors"
        >
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        type="button"
        data-testid="clear-all-filters"
        onClick={() => setFilters((prev: any) => ({ sort: prev.sort }))}
        className="text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

export function VenueFilters({ filters, setFilters, markets, allVenues, onPickVenue }: VenueFiltersProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value === 'all' ? undefined : value }));
  };

  const handleSearchChange = (value: string) => {
    updateFilter("search", value);
  };

  const term = (filters.search || "").trim().toLowerCase();
  const suggestions =
    onPickVenue && searchFocused && term.length >= 2 && allVenues
      ? allVenues
          .filter(
            (v) =>
              v.name.toLowerCase().includes(term) ||
              v.city.toLowerCase().includes(term),
          )
          .slice(0, 6)
      : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search venues, cities, neighborhoods..." 
            className="pl-9 bg-card border-border/50 font-mono text-sm"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            data-testid="venue-search-input"
          />
          {suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/40 overflow-hidden"
              data-testid="search-suggestions"
            >
              {suggestions.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  data-testid={`suggestion-${venue.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchFocused(false);
                    onPickVenue?.(venue);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors border-b border-border/30 last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block font-bold text-sm truncate">{venue.name}</span>
                    <span className="block text-[10px] font-mono uppercase text-muted-foreground">
                      {venue.category} • {venue.city}
                    </span>
                  </span>
                  <span className="shrink-0 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        venue.crowdLevel === "packed"
                          ? "bg-destructive"
                          : venue.crowdLevel === "lively"
                            ? "bg-secondary"
                            : "bg-green-500"
                      }`}
                    />
                    {venue.waitTimeMinutes}m
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Market */}
        <Select value={filters.market || "all"} onValueChange={(val) => updateFilter("market", val)}>
          <SelectTrigger className="bg-card border-border/50 font-mono text-sm">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Market" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Markets</SelectItem>
            {markets.map(m => (
              <SelectItem key={m.market} value={m.market}>{m.city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sort || "crowdScore"} onValueChange={(val) => updateFilter("sort", val)}>
          <SelectTrigger className="bg-card border-border/50 font-mono text-sm">
            <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crowdScore">Pulse Score (High to Low)</SelectItem>
            <SelectItem value="waitTime">Wait Time</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={!filters.category ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs font-mono"
          onClick={() => updateFilter("category", undefined)}
        >
          All
        </Button>
        <Button 
          variant={filters.category === VenueCategory.bar ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs font-mono"
          onClick={() => updateFilter("category", VenueCategory.bar)}
        >
          <GlassWater className="w-3 h-3 mr-1" /> Bars
        </Button>
        <Button 
          variant={filters.category === VenueCategory.restaurant ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs font-mono"
          onClick={() => updateFilter("category", VenueCategory.restaurant)}
        >
          Restaurants
        </Button>
        <Button 
          variant={filters.category === VenueCategory.cafe ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs font-mono"
          onClick={() => updateFilter("category", VenueCategory.cafe)}
        >
          <Coffee className="w-3 h-3 mr-1" /> Cafes
        </Button>
        <Button 
          variant={filters.category === VenueCategory.retail ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs font-mono"
          onClick={() => updateFilter("category", VenueCategory.retail)}
        >
          <ShoppingBag className="w-3 h-3 mr-1" /> Retail
        </Button>
        <Button 
          variant={filters.category === VenueCategory.experience ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs font-mono"
          onClick={() => updateFilter("category", VenueCategory.experience)}
        >
          <Map className="w-3 h-3 mr-1" /> Experiences
        </Button>
      </div>
    </div>
  );
}