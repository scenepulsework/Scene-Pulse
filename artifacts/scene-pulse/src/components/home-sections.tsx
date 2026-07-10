import { useState } from "react";
import { useGetHeroStats, useListMarkets, useGetHotZones, useListMarketGaps, useListVenues } from "@workspace/api-client-react";
import { Activity, Users, MapPin, Map, Zap, CheckCircle2, ChevronRight, Radar, MessageSquareText, Compass, Mail, RadioTower, Navigation, RefreshCw, Flame, Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const { data: stats, refetch: refetchStats } = useGetHeroStats();
  const { data: hotZones, refetch: refetchHotZones } = useGetHotZones();
  const { data: allVenues, refetch: refetchVenues } = useListVenues({});
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchHotZones(), refetchVenues()]);
    setRefreshing(false);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote("Location isn't available in this browser.");
      return;
    }
    setLocationNote("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!allVenues?.length) {
          setLocationNote("No venue data loaded yet.");
          return;
        }
        const { latitude, longitude } = pos.coords;
        let nearest = allVenues[0];
        let bestDist = Infinity;
        for (const v of allVenues) {
          const d = Math.hypot(v.latitude - latitude, v.longitude - longitude);
          if (d < bestDist) {
            bestDist = d;
            nearest = v;
          }
        }
        setLocationNote(`Closest market: ${nearest.city}`);
      },
      () => setLocationNote("Couldn't get your location — check browser permissions."),
    );
  };

  return (
    <div className="py-10 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-warm/20 via-background to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-warm/30 bg-warm/10 text-warm text-xs font-mono uppercase tracking-wider">
              <RadioTower className="w-3.5 h-3.5 animate-pulse" />
              Live sync on
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-5 uppercase leading-none">
              <span className="block text-foreground">Read the room.</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Before you leave.</span>
            </h1>
            <p className="text-lg text-muted-foreground font-mono leading-relaxed mb-6">
              Live crowd scores, wait times, and vibe checks for the city's best spots.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                data-testid="button-explore-map"
                onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="rounded-full bg-warm text-warm-foreground hover:opacity-90 gap-2"
              >
                <Map className="w-4 h-4" /> Explore the live map
              </Button>
              <Button
                data-testid="button-use-location"
                variant="outline"
                onClick={handleUseLocation}
                className="rounded-full gap-2"
              >
                <Navigation className="w-4 h-4" /> Use my location
              </Button>
              <Button
                data-testid="button-refresh-conditions"
                variant="ghost"
                size="icon"
                aria-label="Refresh conditions"
                title="Refresh conditions"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {locationNote && (
              <div className="mt-3 text-sm text-muted-foreground font-mono flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {locationNote}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {hotZones?.hottestPin && (
                <HighlightCard title="Hottest scene" venue={hotZones.hottestPin} icon={<Flame className="w-4 h-4 text-destructive" />} />
              )}
              {hotZones?.mostOpen && (
                <HighlightCard title="Best easy walk-in" venue={hotZones.mostOpen} icon={<Star className="w-4 h-4 text-green-500" />} />
              )}
            </div>
            {stats && (
              <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 grid grid-cols-4 gap-2 text-center">
                <MiniStat label="Venues" value={stats.totalVenues} />
                <MiniStat label="Markets" value={stats.marketsCovered} />
                <MiniStat label="Packed" value={stats.packedNow} />
                <MiniStat label="Open" value={stats.openNow} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div>
      <div className="text-xl font-black leading-none">{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function HighlightCard({ title, venue, icon }: { title: string, venue: any, icon: React.ReactNode }) {
  return (
    <Link
      href={`/venue/${venue.id}`}
      className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-start gap-2 hover:border-warm/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider">
        {icon}
        {title}
      </div>
      <div className="text-base font-bold leading-tight truncate w-full">{venue.name}</div>
    </Link>
  );
}

export function HotZonesSection() {
  const { data: hotZones } = useGetHotZones();

  if (!hotZones) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <HotZoneCard title="Hottest Pin" venue={hotZones.hottestPin} color="border-destructive" icon={<Users className="w-4 h-4 text-destructive" />} />
      <HotZoneCard title="Fastest Move" venue={hotZones.fastestMove} color="border-primary" icon={<Activity className="w-4 h-4 text-primary" />} />
      <HotZoneCard title="Most Open" venue={hotZones.mostOpen} color="border-green-500" icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} />
    </div>
  );
}

function HotZoneCard({ title, venue, color, icon }: { title: string, venue: any, color: string, icon: React.ReactNode }) {
  if (!venue) return null;
  return (
    <Link href={`/venue/${venue.id}`} className={`block bg-card border-l-4 ${color} border-y border-r border-y-border/50 border-r-border/50 p-4 hover:bg-muted/50 transition-colors group rounded-r-2xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {icon}
          {title}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <div className="font-bold text-lg truncate">{venue.name}</div>
      <div className="text-sm text-muted-foreground">{venue.city} • {venue.category}</div>
    </Link>
  );
}

export function ServicesSection() {
  const services = [
    {
      icon: <Radar className="w-6 h-6 text-primary" />,
      title: "Live Crowd Radar",
      description: "Crowd score, headcount, wait time, and line trend refreshed by community reports, not stale check-ins.",
    },
    {
      icon: <MessageSquareText className="w-6 h-6 text-secondary" />,
      title: "Real-Time Vibe Reports",
      description: "Guests submit crowd, wait, and vibe checks in seconds so the next person walking up knows exactly what to expect.",
    },
    {
      icon: <Compass className="w-6 h-6 text-accent" />,
      title: "Best-Time Guidance",
      description: "Every venue carries a best arrival window, peak pressure window, and arrival tips so you time it right.",
    },
  ];

  return (
    <section id="services" className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.title} className="bg-card border border-border/50 rounded-lg p-6">
              <div className="mb-4">{s.icon}</div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" className="py-16 border-t border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Contact</h2>
        <p className="text-muted-foreground mb-6">
          Running a venue and want to get on the map, or spot a data signal that's off? Reach the ScenePulse team.
        </p>
        <a
          href="mailto:hello@scenepulse.app"
          data-testid="link-contact-email"
          className="inline-flex items-center gap-2 font-mono text-sm font-bold text-primary hover:underline"
        >
          hello@scenepulse.app
        </a>
      </div>
    </section>
  );
}

export function MarketsSection() {
  const { data: markets } = useListMarkets();

  if (!markets) return null;

  return (
    <section id="markets" className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
          <Map className="w-8 h-8 text-secondary" />
          Active Markets
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {markets.map(m => (
            <div key={m.market} className="bg-card border border-border/50 p-4 rounded-lg flex flex-col hover:border-secondary/50 transition-colors">
              <span className="font-bold truncate">{m.city}</span>
              <span className="text-xs text-muted-foreground font-mono mt-1">{m.venueCount} Venues</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OperatorsSection() {
  const { data: gaps } = useListMarketGaps();

  if (!gaps) return null;

  return (
    <section id="operators" className="py-16 bg-muted/30 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-primary">For Operators</h2>
          <p className="text-lg text-muted-foreground">Why we built ScenePulse. The hospitality industry is flying blind when it comes to live consumer intent.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gaps.map(gap => (
            <div key={gap.id} className="bg-card border border-border p-6 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <h3 className="font-bold text-lg mb-2 relative z-10">{gap.title}</h3>
              <p className="text-sm text-muted-foreground relative z-10 leading-relaxed">{gap.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}