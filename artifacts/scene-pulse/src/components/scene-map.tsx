import { useState } from "react";
import { Venue } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowUpRight, Users, Clock3 } from "lucide-react";

export function SceneMap({ venues }: { venues: Venue[] }) {
  // In a real app, this would use Mapbox GL JS or Google Maps.
  // For the prototype, we build an abstract radar/grid visualization
  // with clickable pins synced to a detail panel.
  const [selectedId, setSelectedId] = useState<Venue["id"] | null>(null);

  if (!venues?.length) return null;

  const selected = venues.find((v) => v.id === selectedId) ?? null;

  // Normalize lat/lng for abstract display
  const lats = venues.map(v => v.latitude);
  const lngs = venues.map(v => v.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const getX = (lng: number) => `${((lng - minLng) / (maxLng - minLng || 1)) * 90 + 5}%`;
  const getY = (lat: number) => `${100 - (((lat - minLat) / (maxLat - minLat || 1)) * 90 + 5)}%`;

  return (
    <div className="flex flex-col md:flex-row gap-4">
    <div className="relative w-full flex-1 h-[400px] md:h-[600px] bg-card rounded-lg border border-border/50 overflow-hidden group">
      {/* Abstract Radar Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at center, var(--color-border) 1px, transparent 1px), radial-gradient(circle at center, var(--color-border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px',
        opacity: 0.2
      }} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      
      {/* Radar Sweep */}
      <div className="absolute left-1/2 top-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_rgba(var(--color-primary),_0.1)_360deg)] animate-[spin_4s_linear_infinite] pointer-events-none" style={{ mixBlendMode: 'screen' }} />

      {/* Pins */}
      {venues.map((venue) => {
        const isPacked = venue.crowdLevel === 'packed';
        const isLively = venue.crowdLevel === 'lively';
        
        return (
          <button
            key={venue.id}
            type="button"
            data-testid={`pin-venue-${venue.id}`}
            onClick={() => setSelectedId(venue.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer"
            style={{ left: getX(venue.longitude), top: getY(venue.latitude) }}
          >
            {/* Pulsing Aura */}
            <div className={`absolute inset-[-10px] rounded-full animate-ping opacity-20 ${
              isPacked ? 'bg-destructive' : isLively ? 'bg-secondary' : 'bg-green-500'
            }`} style={{ animationDuration: isPacked ? '1.5s' : isLively ? '2s' : '3s' }} />
            
            {/* Core Pin */}
            <div className={`relative w-4 h-4 rounded-full border-2 shadow-lg ${
              selectedId === venue.id ? 'border-foreground scale-125' : 'border-background'
            } transition-transform ${
              isPacked ? 'bg-destructive shadow-destructive/50' : 
              isLively ? 'bg-secondary shadow-secondary/50' : 
              'bg-green-500 shadow-green-500/50'
            }`} />

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-popover border border-border/50 text-popover-foreground text-xs font-mono p-2 rounded opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-50 flex flex-col gap-1 shadow-xl">
              <span className="font-bold font-sans text-sm">{venue.name}</span>
              <div className="flex gap-3">
                <span className={isPacked ? 'text-destructive' : isLively ? 'text-secondary' : 'text-green-500'}>
                  Score: {venue.crowdScore}
                </span>
                <span>Wait: {venue.waitTimeMinutes}m</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>

    {/* Detail Panel synced to selected pin */}
    <div className="w-full md:w-80 shrink-0 bg-card border border-border/50 rounded-lg p-5 flex flex-col">
      {selected ? (
        <>
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">{selected.category} • {selected.city}</div>
              <h3 className="font-black text-xl leading-tight">{selected.name}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-mono mb-1"><Users className="w-3 h-3" /> Score</div>
              <div className="text-2xl font-black">{selected.crowdScore}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-mono mb-1"><Clock3 className="w-3 h-3" /> Wait</div>
              <div className="text-2xl font-black">{selected.waitTimeMinutes}m</div>
            </div>
          </div>
          <Link
            href={`/venue/${selected.id}`}
            data-testid={`link-map-detail-${selected.id}`}
            className="mt-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-wide rounded-md py-2.5 hover:opacity-90 transition-opacity"
          >
            View Full Details <ArrowUpRight className="w-4 h-4" />
          </Link>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground text-sm gap-2 py-10">
          <Users className="w-6 h-6 opacity-50" />
          Tap a pin to see live conditions for that spot.
        </div>
      )}
    </div>
    </div>
  );
}