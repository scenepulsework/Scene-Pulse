import { useEffect, useMemo, useState, ReactNode } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Venue } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowUpRight, Users, Clock3, X, Flame } from "lucide-react";
import { VenueReports } from "@/components/venue-reports";

function crowdColor(level: Venue["crowdLevel"]) {
  switch (level) {
    case "packed":
      return "#ef4444";
    case "lively":
      return "#e879f9";
    default:
      return "#22c55e";
  }
}

function pinIcon(venue: Venue, selected: boolean) {
  const color = crowdColor(venue.crowdLevel);
  const size = selected ? 22 : 16;
  const ring = selected
    ? `box-shadow: 0 0 0 4px ${color}55, 0 0 18px ${color};`
    : `box-shadow: 0 0 10px ${color}aa;`;
  return L.divIcon({
    className: "scene-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <span class="scene-pin-wrap" style="width:${size}px;height:${size}px;">
        <span class="scene-pin-ping" style="background:${color};"></span>
        <span class="scene-pin-dot" style="width:${size}px;height:${size}px;background:${color};border:2px solid ${selected ? "#fff" : "#0b0f1a"};${ring}"></span>
      </span>
    `,
  });
}

function MapController({ venues, selected }: { venues: Venue[]; selected: Venue | null }) {
  const map = useMap();
  const boundsKey = useMemo(
    () => venues.map((v) => v.id).sort((a, b) => a - b).join(","),
    [venues],
  );

  useEffect(() => {
    if (!venues.length) return;
    const bounds = L.latLngBounds(venues.map((v) => [v.latitude, v.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, map]);

  useEffect(() => {
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [selected, map]);

  return null;
}

export function LiveMap({
  venues,
  emptyPanel,
  selectedId,
  onSelect,
  dataReady = true,
}: {
  venues: Venue[];
  emptyPanel?: ReactNode;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  dataReady?: boolean;
}) {
  const selected = venues.find((v) => v.id === selectedId) ?? null;

  // If filters change and the selected venue is no longer visible, deselect it.
  // Skipped while showing stale placeholder data so a fresh selection isn't
  // wiped before the refetch lands.
  useEffect(() => {
    if (dataReady && selectedId != null && !venues.some((v) => v.id === selectedId)) {
      onSelect(null);
    }
  }, [venues, selectedId, onSelect, dataReady]);

  const hottest = useMemo(
    () => [...venues].sort((a, b) => b.crowdScore - a.crowdScore).slice(0, 4),
    [venues],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4" data-testid="live-map">
      <div className="relative w-full shrink-0 lg:flex-1 h-[380px] lg:h-[580px] rounded-2xl overflow-hidden border border-border/50 bg-card z-0">
        {venues.length > 0 ? (
          <MapContainer
            center={[venues[0].latitude, venues[0].longitude]}
            zoom={12}
            scrollWheelZoom
            className="w-full h-full"
            style={{ background: "#0b0f1a" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapController venues={venues} selected={selected} />
            {venues.map((venue) => (
              <Marker
                key={venue.id}
                position={[venue.latitude, venue.longitude]}
                icon={pinIcon(venue, venue.id === selectedId)}
                eventHandlers={{
                  click: () => onSelect(venue.id),
                }}
                title={venue.name}
              />
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
            No venues matching your pulse check.
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] flex gap-3 bg-background/85 backdrop-blur border border-border/50 rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Open</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" /> Lively</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Packed</span>
        </div>
      </div>

      <div className="w-full lg:w-[400px] shrink-0 lg:h-[580px] flex flex-col gap-3 lg:overflow-y-auto lg:pr-1">
        {selected ? (
          <div className="flex flex-col gap-3" data-testid="map-venue-panel">
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    {selected.category} • {selected.city}
                  </div>
                  <h3 className="font-black text-xl leading-tight">{selected.name}</h3>
                </div>
                <button
                  type="button"
                  data-testid="button-close-map-panel"
                  onClick={() => onSelect(null)}
                  className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
                  aria-label="Close venue panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-mono mb-1">
                    <Users className="w-3 h-3" /> Score
                  </div>
                  <div className="text-2xl font-black">{selected.crowdScore}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-mono mb-1">
                    <Clock3 className="w-3 h-3" /> Wait
                  </div>
                  <div className="text-2xl font-black">{selected.waitTimeMinutes}m</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-mono mb-1">
                    <Flame className="w-3 h-3" /> Level
                  </div>
                  <div
                    className={`text-sm font-black uppercase mt-1.5 ${
                      selected.crowdLevel === "packed"
                        ? "text-destructive"
                        : selected.crowdLevel === "lively"
                          ? "text-secondary"
                          : "text-green-500"
                    }`}
                  >
                    {selected.crowdLevel}
                  </div>
                </div>
              </div>
              <Link
                href={`/venue/${selected.id}`}
                data-testid={`link-map-detail-${selected.id}`}
                className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-wide rounded-md py-2.5 hover:opacity-90 transition-opacity"
              >
                View Full Details <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <VenueReports venueId={selected.id} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {emptyPanel}
            {hottest.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-destructive" /> Hottest on the map
                </div>
                <div className="flex flex-col gap-1.5">
                  {hottest.map((venue) => (
                    <button
                      key={venue.id}
                      type="button"
                      data-testid={`map-hot-${venue.id}`}
                      onClick={() => onSelect(venue.id)}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-left hover:border-primary/60 hover:bg-primary/5 transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold text-sm truncate">{venue.name}</span>
                        <span className="block text-[10px] font-mono uppercase text-muted-foreground">
                          {venue.city} • {venue.waitTimeMinutes}m wait
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-sm font-black"
                        style={{ color: crowdColor(venue.crowdLevel) }}
                      >
                        {venue.crowdScore}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
