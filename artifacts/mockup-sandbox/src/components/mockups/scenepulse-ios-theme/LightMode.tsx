import { useState } from "react";
import {
  Activity,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Map,
  MapPin,
  Search,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Users,
  Clock,
  Star,
  Home,
  Bell,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const AMBER = "#E8983A";
const PAGE_BG = "#F2F2F7";

// ─── Mock data ────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Venues", value: "725", color: "#1C1C1E" },
  { label: "Markets", value: "14", color: "#1C1C1E" },
  { label: "Live", value: "579", color: AMBER, dot: true },
  { label: "Packed", value: "146", color: "#EF4444" },
];

const HOT_SCENES = [
  {
    name: "Delilah's",
    type: "Bar",
    city: "Chicago",
    score: 88,
    trend: "up",
    wait: "45m",
    headcount: 98,
    tag: "HOTTEST SCENE",
    tagColor: "#EF4444",
    bestFor: "Late-night Food",
  },
  {
    name: "Fulton Market Coffee Bar",
    type: "Café",
    city: "Chicago",
    score: 72,
    trend: "steady",
    wait: "12m",
    headcount: 42,
    tag: "BEST WALK-IN",
    tagColor: "#22C55E",
    bestFor: "Remote Work",
  },
];

const VENUES = [
  { id: 1, name: "Smyth", type: "Restaurant", city: "Chicago", score: 88, level: "packed", trend: "up", wait: "0m", headcount: 48, rating: 4.2, cover: null },
  { id: 2, name: "Silver Room", type: "Retail", city: "Chicago", score: 88, level: "packed", trend: "steady", wait: "10m", headcount: 178, rating: 4.4, cover: null },
  { id: 3, name: "Kindling", type: "Bar", city: "New York", score: 71, level: "busy", trend: "up", wait: "20m", headcount: 65, rating: 4.6, cover: "$15" },
  { id: 4, name: "Kin Euphorics", type: "Bar", city: "New York", score: 58, level: "moderate", trend: "down", wait: "5m", headcount: 34, rating: 4.1, cover: null },
  { id: 5, name: "Birrieria Zaragoza", type: "Restaurant", city: "Chicago", score: 44, level: "quiet", trend: "steady", wait: "0m", headcount: 12, rating: 4.8, cover: null },
];

const TABS = [
  { icon: Home, label: "Home", active: true },
  { icon: Map, label: "Map", active: false },
  { icon: Bookmark, label: "Saved", active: false },
  { icon: Bell, label: "Alerts", active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function crowdColor(level: string) {
  if (level === "packed") return "#EF4444";
  if (level === "busy") return AMBER;
  if (level === "moderate") return "#F59E0B";
  return "#22C55E";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LightMode() {
  const [saved, setSaved] = useState<number[]>([1]);
  const [search, setSearch] = useState("");

  const filtered = VENUES.filter(
    (v) =>
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: 390,
        height: 844,
        background: PAGE_BG,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <span className="text-[15px] font-semibold text-black">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect x="0" y="4" width="3" height="8" rx="1" fill="#1C1C1E" />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#1C1C1E" />
            <rect x="9" y="1" width="3" height="11" rx="1" fill="#1C1C1E" />
            <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#1C1C1E" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.4C10.2 2.4 12.2 3.3 13.6 4.8L15 3.3C13.2 1.3 10.7 0 8 0C5.3 0 2.8 1.3 1 3.3L2.4 4.8C3.8 3.3 5.8 2.4 8 2.4Z" fill="#1C1C1E" />
            <path d="M8 5.2C9.5 5.2 10.8 5.8 11.8 6.8L13.2 5.3C11.8 3.9 9.9 3 8 3C6.1 3 4.2 3.9 2.8 5.3L4.2 6.8C5.2 5.8 6.5 5.2 8 5.2Z" fill="#1C1C1E" />
            <circle cx="8" cy="10" r="2" fill="#1C1C1E" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-3 rounded-[3px] border border-black/30 flex items-center px-0.5">
              <div className="h-2 rounded-[2px] bg-black" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto" style={{ height: 780, paddingBottom: 80 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: AMBER }} strokeWidth={2.5} />
            <span
              className="text-xl font-black tracking-wide text-black"
              style={{ letterSpacing: "0.08em" }}
            >
              SCENEPULSE
            </span>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: AMBER }}
          >
            A
          </button>
        </div>

        {/* Stats strip */}
        <div className="mx-4 mb-3">
          <div
            className="bg-white rounded-2xl px-4 py-3 flex items-center justify-around"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  {s.dot && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: AMBER }}
                    />
                  )}
                  <span className="text-lg font-bold" style={{ color: s.color }}>
                    {s.value}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mx-4 mb-4">
          <div
            className="bg-white rounded-xl flex items-center gap-2 px-3 py-2.5"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
          >
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400"
              placeholder="Search venues, vibes, neighborhoods…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Hot Scenes section */}
        <div className="px-4 mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: AMBER }} strokeWidth={2.5} />
          <span className="text-[17px] font-bold text-black">Hot Scenes</span>
        </div>
        <div className="px-4 mb-5 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {HOT_SCENES.map((v) => (
            <div
              key={v.name}
              className="bg-white rounded-2xl p-4 shrink-0"
              style={{
                width: 175,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: v.tagColor }}
                />
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: v.tagColor }}
                >
                  {v.tag}
                </span>
              </div>
              <div className="font-bold text-[15px] text-black leading-tight mb-0.5">
                {v.name}
              </div>
              <div className="text-[11px] text-gray-400 mb-2">
                {v.city} · {v.type.toLowerCase()}
              </div>
              <div className="flex items-center justify-between">
                <div
                  className="text-2xl font-black"
                  style={{ color: crowdColor(v.score >= 80 ? "packed" : v.score >= 60 ? "busy" : "moderate") }}
                >
                  {v.score}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    {v.wait}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Users className="w-3 h-3" />
                    {v.headcount}
                  </div>
                </div>
              </div>
              <div
                className="mt-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit"
                style={{ background: `${AMBER}18`, color: AMBER }}
              >
                {v.bestFor}
              </div>
            </div>
          ))}
        </div>

        {/* All Venues section */}
        <div className="px-4 mb-3 flex items-center gap-3">
          <span className="text-[17px] font-bold text-black">All Venues</span>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[12px] font-medium text-gray-400">
            {filtered.length} results
          </span>
        </div>

        <div className="mx-4 bg-white rounded-2xl overflow-hidden mb-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          {filtered.map((v, i) => (
            <div key={v.id}>
              {i > 0 && <div className="mx-4 h-px bg-gray-100" />}
              <div className="flex items-center px-4 py-3.5 gap-3">
                {/* Crowd indicator */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${crowdColor(v.level)}15` }}
                >
                  <span
                    className="text-base font-black"
                    style={{ color: crowdColor(v.level) }}
                  >
                    {v.score}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[14px] text-black truncate">
                      {v.name}
                    </span>
                    <TrendIcon trend={v.trend} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-400">
                      {v.type} · {v.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      {v.wait === "0m" ? "No wait" : v.wait}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Users className="w-3 h-3" />
                      {v.headcount}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Star className="w-3 h-3" />
                      {v.rating}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onPointerDown={() =>
                      setSaved((s) =>
                        s.includes(v.id) ? s.filter((x) => x !== v.id) : [...s, v.id],
                      )
                    }
                  >
                    {saved.includes(v.id) ? (
                      <BookmarkCheck
                        className="w-4 h-4"
                        style={{ color: AMBER }}
                        strokeWidth={2}
                      />
                    ) : (
                      <Bookmark className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
                    )}
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white flex items-center justify-around pt-2 pb-1"
        style={{
          borderTop: "0.5px solid rgba(0,0,0,0.12)",
          height: 82,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className="flex flex-col items-center gap-0.5"
          >
            <tab.icon
              className="w-[26px] h-[26px]"
              style={{ color: tab.active ? AMBER : "#8E8E93" }}
              strokeWidth={tab.active ? 2.5 : 1.5}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: tab.active ? AMBER : "#8E8E93" }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
