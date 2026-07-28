import { useParams } from "wouter";
import { useGetVenue, getGetVenueQueryKey } from "@workspace/api-client-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Star, ExternalLink, BookmarkPlus, BookmarkCheck, Users, Clock, TrendingUp, TrendingDown, Minus, Volume2, DollarSign, Target, Briefcase, Zap, Compass, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { VenueReports } from "@/components/venue-reports";
import { photoUrl } from "@/lib/photo-url";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function VenueDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: venue, isLoading } = useGetVenue(id, { query: { enabled: !!id, queryKey: getGetVenueQueryKey(id) } });
  const { isWatchlisted, toggle } = useWatchlist();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-24 w-full md:w-2/3 mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Venue not found</h2>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Pulse</Button>
        </Link>
      </div>
    );
  }

  const handleWatchlistToggle = () => {
    const added = toggle(venue.id);
    toast.success(added ? "Added to watchlist" : "Removed from watchlist");
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'open': return 'text-green-500';
      case 'lively': return 'text-secondary';
      case 'packed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-destructive" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'steady': return <Minus className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-muted-foreground hover:text-foreground font-mono uppercase tracking-wider text-xs">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          
          {/* Header */}
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="secondary" className="font-mono uppercase tracking-wider">{venue.category}</Badge>
              {venue.sourceLabel && venue.sourceUrl && (
                <a href={venue.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {venue.sourceLabel}
                </a>
              )}
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{venue.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{venue.address}, {venue.city}</span>
                  <span className="flex items-center text-yellow-500"><Star className="w-4 h-4 mr-1 fill-current" />{venue.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleWatchlistToggle}
                >
                  {isWatchlisted(venue.id) ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <BookmarkPlus className="w-5 h-5" />}
                </Button>
                {venue.mapsUrl && (
                  <Button asChild className="font-mono uppercase tracking-wider text-xs">
                    <a href={venue.mapsUrl} target="_blank" rel="noreferrer">
                      <Compass className="w-4 h-4 mr-2" />
                      Open Maps
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Photos */}
          {venue.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {venue.photos.map((path, i) => (
                <div
                  key={path}
                  className={`rounded-lg overflow-hidden border border-border/50 bg-muted ${i === 0 ? "col-span-2 md:col-span-2 row-span-2" : ""}`}
                >
                  <img
                    src={photoUrl(path)}
                    alt={`${venue.name} photo ${i + 1}`}
                    className="w-full h-full object-cover aspect-[4/3]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Core Condition Panel */}
          <div className="bg-card border border-border/50 rounded-lg p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 rounded-full pointer-events-none ${
              venue.crowdLevel === 'packed' ? 'bg-destructive' : 
              venue.crowdLevel === 'lively' ? 'bg-secondary' : 'bg-green-500'
            }`} />
            
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-6 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              Live Pulse
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Crowd Score</div>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black leading-none ${getCrowdColor(venue.crowdLevel)}`}>
                    {venue.crowdScore}
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wider pb-1 text-muted-foreground">
                    {venue.crowdLevel}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Wait Time</div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black leading-none text-foreground">
                    {venue.waitTimeMinutes}
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wider pb-1 text-muted-foreground">
                    min
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Headcount</div>
                <div className="flex items-end gap-2">
                  <Users className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-2xl font-black leading-none text-foreground font-mono">
                    {venue.headcount}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Line Trend</div>
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(venue.lineTrend)}
                  <span className="text-lg font-bold capitalize">
                    {venue.lineTrend}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border/50">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground font-mono uppercase">Seating Odds</div>
                  <div className="font-bold">{venue.seatingOdds}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground font-mono uppercase">Noise Level</div>
                  <div className="font-bold capitalize">{venue.noiseLevel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground font-mono uppercase">Cover Cost</div>
                  <div className="font-bold">{venue.coverCost}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <h3 className="font-bold font-mono uppercase tracking-wider mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                Timing Strategy
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground font-mono uppercase mb-1">Best Arrival Window</div>
                  <div className="font-bold text-lg text-primary">{venue.bestTimeWindow}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-mono uppercase mb-1">Peak Pressure Window</div>
                  <div className="font-bold text-destructive">{venue.peakPressureWindow}</div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground font-mono uppercase mb-1">Reservation Signal</div>
                  <div className="text-sm">{venue.reservationSignal}</div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-lg p-6">
              <h3 className="font-bold font-mono uppercase tracking-wider mb-4 flex items-center">
                <Compass className="w-4 h-4 mr-2 text-secondary" />
                Arrival Tips
              </h3>
              <ul className="space-y-3">
                {venue.arrivalTips.map((tip, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-4 border-t border-border/50">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center">
                  <Briefcase className="w-3 h-3 mr-1" /> Staffing Signal
                </h4>
                <p className="text-sm text-muted-foreground italic">"{venue.staffingSignal}"</p>
              </div>
            </div>
          </div>
          
          {/* Operator Note */}
          {venue.operatorGapNote && (
            <div className="bg-muted/30 border border-border rounded-lg p-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Operator Note
              </h4>
              <p className="text-sm">{venue.operatorGapNote}</p>
            </div>
          )}
          
        </div>

        {/* Sidebar / Live Feed */}
        <div className="w-full md:w-[350px] shrink-0 space-y-8">
          {venue.openingHours && (
            <div className="bg-card border border-border/50 rounded-lg p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Opening Hours
              </h4>
              <dl className="space-y-1.5">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-baseline justify-between text-sm">
                    <dt className="font-mono uppercase text-[11px] tracking-wider text-muted-foreground capitalize">{day}</dt>
                    <dd className={`font-medium ${/closed/i.test(venue.openingHours![day]) ? "text-muted-foreground" : ""}`}>
                      {venue.openingHours![day] || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <VenueReports venueId={venue.id} />

          <div className="bg-card border border-border/50 rounded-lg p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Signals Tracked</h4>
            <div className="flex flex-wrap gap-2">
              {venue.dataSignalsTracked.map(signal => (
                <Badge key={signal} variant="outline" className="font-mono text-[10px] uppercase bg-background/50">
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}