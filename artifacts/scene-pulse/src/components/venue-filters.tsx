import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ListVenuesIntent, ListVenuesSort, VenueCategory } from "@workspace/api-client-react";
import { Search, MapPin, SlidersHorizontal, Flame, Music, Moon, Clock, Heart, GlassWater, Coffee, ShoppingBag, Map } from "lucide-react";

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
};

export function VenueFilters({ filters, setFilters, markets }: VenueFiltersProps) {
  
  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value === 'all' ? undefined : value }));
  };

  const intents = [
    { value: ListVenuesIntent.dateNight, label: "Date Night", icon: <Heart className="w-3 h-3" /> },
    { value: ListVenuesIntent.noWait, label: "No Wait", icon: <Clock className="w-3 h-3" /> },
    { value: ListVenuesIntent.retailDrops, label: "Retail Drops", icon: <ShoppingBag className="w-3 h-3" /> },
    { value: ListVenuesIntent.liveMusic, label: "Live Music", icon: <Music className="w-3 h-3" /> },
    { value: ListVenuesIntent.patioEnergy, label: "Patio Energy", icon: <Flame className="w-3 h-3" /> },
    { value: ListVenuesIntent.lateNightFood, label: "Late Night", icon: <Moon className="w-3 h-3" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Picks - Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        <Button 
          variant={!filters.intent ? "default" : "outline"}
          size="sm"
          className="snap-start rounded-full whitespace-nowrap"
          onClick={() => updateFilter("intent", undefined)}
        >
          All Vibes
        </Button>
        {intents.map(intent => (
          <Button
            key={intent.value}
            variant={filters.intent === intent.value ? "default" : "outline"}
            size="sm"
            className={`snap-start rounded-full whitespace-nowrap gap-2 ${filters.intent === intent.value ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 border-secondary' : ''}`}
            onClick={() => updateFilter("intent", filters.intent === intent.value ? undefined : intent.value)}
          >
            {intent.icon}
            {intent.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search venues..." 
            className="pl-9 bg-card border-border/50 font-mono text-sm"
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
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