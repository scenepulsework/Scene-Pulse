import { Venue } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Clock, Users, Volume2, DollarSign, TrendingUp, TrendingDown, Minus, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useAddToWatchlist, useRemoveFromWatchlist, getListVenuesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function VenueCard({ venue }: { venue: Venue }) {
  const queryClient = useQueryClient();
  
  const addWatchlist = useAddToWatchlist();
  const removeWatchlist = useRemoveFromWatchlist();

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (venue.isWatchlisted) {
      removeWatchlist.mutate({ venueId: venue.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() });
          toast.success("Removed from watchlist");
        }
      });
    } else {
      addWatchlist.mutate({ venueId: venue.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() });
          toast.success("Added to watchlist");
        }
      });
    }
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
      case 'rising': return <TrendingUp className="w-3 h-3 text-destructive" />;
      case 'falling': return <TrendingDown className="w-3 h-3 text-green-500" />;
      case 'steady': return <Minus className="w-3 h-3 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Link href={`/venue/${venue.id}`} className="block group">
      <div className="bg-card border border-border/50 rounded-lg p-5 hover:border-primary/50 transition-colors relative overflow-hidden h-full flex flex-col">
        {/* Subtle background glow based on crowd level */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full pointer-events-none transition-opacity group-hover:opacity-20 ${
          venue.crowdLevel === 'packed' ? 'bg-destructive' : 
          venue.crowdLevel === 'lively' ? 'bg-secondary' : 'bg-green-500'
        }`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-muted rounded">
                {venue.category}
              </span>
              <span className="text-xs text-muted-foreground">{venue.market}</span>
            </div>
            <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">{venue.name}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-primary"
            onClick={handleWatchlistToggle}
            disabled={addWatchlist.isPending || removeWatchlist.isPending}
          >
            {venue.isWatchlisted ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <BookmarkPlus className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4 relative z-10 flex-1">
          <div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Crowd Score</div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black leading-none ${getCrowdColor(venue.crowdLevel)}`}>
                {venue.crowdScore}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider pb-0.5 text-muted-foreground">
                {venue.crowdLevel}
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Wait Time</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black leading-none text-foreground">
                {venue.waitTimeMinutes}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider pb-0.5 text-muted-foreground">
                min
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-mono">{venue.headcount}</span>
            {getTrendIcon(venue.lineTrend)}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4" />
            <span className="capitalize">{venue.noiseLevel}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 relative z-10 mt-auto">
          <div className="flex flex-wrap gap-2">
            {venue.bestFor.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="font-mono text-[10px] uppercase bg-background/50">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Best: {venue.bestTimeWindow}
            </div>
            <div className="flex items-center font-mono">
              <DollarSign className="w-3 h-3" />
              {venue.coverCost}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}