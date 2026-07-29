import { useState } from "react";
import { Link } from "wouter";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  MapPin,
  Map,
  Briefcase,
  ArrowUpRight,
  X,
  Linkedin,
  Zap,
  BarChart3,
  Globe,
  Shield,
} from "lucide-react";
import { useGetHeroStats } from "@workspace/api-client-react";

// ─── Team data ───────────────────────────────────────────────────────────────

type TeamMember = {
  id: string;
  name: string;
  title: string;
  shortBio: string;
  fullBio: string[];
  initials: string;
  accentColor: string;
  linkedIn?: string;
  location: string;
  focus: string[];
  previously?: string;
};

const TEAM: TeamMember[] = [
  {
    id: "bradley-gilkerson",
    name: "Bradley Gilkerson",
    title: "Founder & CEO",
    location: "Kalamazoo, MI",
    shortBio:
      "Started ScenePulse after one too many wasted Ubers to dead bars. Built the first prototype in a weekend.",
    fullBio: [
      "Bradley started ScenePulse with a straightforward frustration: you can check a surf report before you drive to the beach, but you can't check whether your favorite bar is dead or packed before you leave the house. That gap — between real-time conditions and the decision to go out — felt like an obvious product waiting to exist.",
      "He built the first version of ScenePulse as a side project while running other ventures in Kalamazoo's startup scene. Within a few months it was tracking crowd signals across a handful of local venues. Within a year it had expanded to 14 markets across North America.",
      "Bradley leads company strategy, market expansion, and operator partnerships. He believes the hospitality industry has been flying blind on demand signals for too long, and that community-sourced data — when structured correctly — is more trustworthy than any algorithm.",
    ],
    initials: "BG",
    accentColor: "text-primary",
    linkedIn: "https://www.linkedin.com/in/bradley-gilkerson/",
    focus: ["Company strategy", "Operator partnerships", "Market expansion"],
  },
  {
    id: "marcus-webb",
    name: "Marcus Webb",
    title: "Co-Founder & CTO",
    location: "Chicago, IL",
    shortBio:
      "Built the crowd-scoring engine and the live-signals pipeline. Previously led data infrastructure at a top venue-discovery platform.",
    fullBio: [
      "Marcus spent five years building the systems that power real-time local discovery at scale — ingesting millions of checkins, reviews, and signals and turning them into something a person can actually act on. He joined ScenePulse when Bradley showed him the first prototype and said \"this is the 30-second version of everything you've been trying to build.\"",
      "He architected the crowd-score model from the ground up: a weighted blend of community reports, historical baseline, time-of-week priors, and operator-submitted data. The model updates every few minutes and has proven consistently more accurate than static review scores for predicting real-time conditions.",
      "Marcus leads all engineering and data science. He's obsessive about latency — every extra second between a reporter submitting a crowd update and it appearing on the map is a second someone makes a worse decision.",
    ],
    initials: "MW",
    accentColor: "text-secondary",
    linkedIn: undefined,
    focus: ["Crowd-score model", "Live-signals pipeline", "Engineering culture"],
    previously: "Venue discovery platform (5 yrs data infra)",
  },
  {
    id: "priya-nallamothu",
    name: "Priya Nallamothu",
    title: "Head of Product",
    location: "New York, NY",
    shortBio:
      "Translates raw signal into decisions you can make in 10 seconds. Previously at a location-intelligence company shaping how millions of people find what's open.",
    fullBio: [
      "Priya joined after spending four years at a location-intelligence startup where she owned the core \"what's happening nearby\" product surface — the one that had to compress a firehose of data into something a person glancing at their phone could act on in seconds. ScenePulse felt like the distilled version of that problem.",
      "She introduced the Vibe Score system, redesigned the venue detail page around the question \"should I go right now?\", and built the operator dashboard that lets venue managers see their own demand signal for the first time. She cares deeply about not overwhelming users with data — every number on screen has to earn its place.",
      "Priya leads product strategy, design direction, and the reporter community experience. She is based in New York and spends an uncomfortable amount of time field-testing the product in person.",
    ],
    initials: "PN",
    accentColor: "text-pink-400",
    linkedIn: undefined,
    focus: ["Product strategy", "Operator dashboard", "Reporter UX"],
    previously: "Location-intelligence startup (4 yrs product)",
  },
  {
    id: "jordan-kowalski",
    name: "Jordan Kowalski",
    title: "Head of Growth",
    location: "Austin, TX",
    shortBio:
      "Launched ScenePulse in 12 cities in 18 months. Specializes in building the reporter networks that make the data worth trusting.",
    fullBio: [
      "Jordan has a simple theory of ScenePulse growth: a new market is only as good as its first 50 reporters. Get the right people logging conditions consistently in the first two weeks and the signal snowballs. Get the wrong people, or too few, and the product feels empty no matter how good the UI is.",
      "She built the market-launch playbook from scratch — starting with Kalamazoo and Chicago, then running it through 12 additional cities. Each launch involves identifying venue clusters, recruiting anchor reporters from nightlife, food, and retail communities, and partnering with 3–5 operators willing to share door-count data in exchange for demand visibility.",
      "Jordan oversees growth strategy, market launches, and the operator acquisition pipeline. She is based in Austin and is currently scouting the next five markets on the expansion roadmap.",
    ],
    initials: "JK",
    accentColor: "text-amber-400",
    linkedIn: undefined,
    focus: ["Market launches", "Reporter recruitment", "Operator pipeline"],
    previously: "Consumer startup growth (marketplace & local)",
  },
];

// ─── Values ──────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: Zap,
    title: "Speed over polish",
    body: "A crowd score that updates in 3 minutes beats a beautiful dashboard that updates in 30. We ship fast, we measure, we fix.",
  },
  {
    icon: Shield,
    title: "Data you can trust",
    body: "We weight signals, expire stale reports, and show confidence levels. Honest data — even when the honest answer is \"we don't know yet\" — beats false precision.",
  },
  {
    icon: Globe,
    title: "Built for real cities",
    body: "ScenePulse is calibrated to how actual people go out — neighborhoods, late nights, weather, events. Not sanitized for an algorithm.",
  },
  {
    icon: BarChart3,
    title: "Operators are partners",
    body: "The best data comes from venues that trust us enough to share it. We treat operator access to their own demand signal as a feature, not an afterthought.",
  },
];

// ─── Milestones ───────────────────────────────────────────────────────────────

const MILESTONES = [
  { year: "2022", label: "First prototype", detail: "Built in a weekend. Tracked 12 venues in Kalamazoo." },
  { year: "2023", label: "Chicago launch", detail: "First market outside Michigan. 80+ venues, 500+ reporters in 60 days." },
  { year: "2024", label: "Series seed", detail: "Raised a seed round. Expanded to 8 markets. Operator dashboard launched." },
  { year: "2025", label: "14 markets", detail: "North America-wide. Mobile app. 725+ venues tracked live." },
];

// ─── Team card ───────────────────────────────────────────────────────────────

function TeamCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 hover:bg-card/80 transition-all duration-200 w-full"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center text-sm font-black shrink-0 border border-border/40 group-hover:border-primary/30 transition-colors ${member.accentColor}`}
        >
          {member.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-base leading-tight">{member.name}</span>
            {member.linkedIn && (
              <Linkedin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            )}
          </div>
          <div className={`text-xs font-mono uppercase tracking-wider mb-3 ${member.accentColor}`}>
            {member.title}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {member.shortBio}
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-mono text-muted-foreground/60 group-hover:text-primary transition-colors">
            <MapPin className="w-3 h-3" />
            {member.location}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {member.focus.slice(0, 2).map((f) => (
            <span
              key={f}
              className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
            >
              {f}
            </span>
          ))}
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
      </div>
    </button>
  );
}

// ─── Team modal ──────────────────────────────────────────────────────────────

function TeamModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border/60 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/40">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-xl bg-muted/60 flex items-center justify-center text-base font-black shrink-0 border border-border/40 ${member.accentColor}`}
            >
              {member.initials}
            </div>
            <div>
              <h2 className="font-black text-xl leading-tight">{member.name}</h2>
              <div className={`text-xs font-mono uppercase tracking-wider mt-0.5 ${member.accentColor}`}>
                {member.title}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground font-mono">
                <MapPin className="w-3 h-3" />
                {member.location}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {member.fullBio.map((para, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {para}
            </p>
          ))}

          {/* Focus areas */}
          <div className="pt-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mb-2">
              Focus areas
            </div>
            <div className="flex flex-wrap gap-2">
              {member.focus.map((f) => (
                <span
                  key={f}
                  className="text-xs font-mono px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {member.previously && (
            <div className="pt-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
                Previously
              </div>
              <p className="text-xs text-muted-foreground font-mono">{member.previously}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {member.linkedIn && (
          <div className="px-6 pb-6">
            <a
              href={member.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-mono text-primary hover:underline"
            >
              <Linkedin className="w-4 h-4" />
              View on LinkedIn
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function About() {
  const { data: stats } = useGetHeroStats();
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);

  return (
    <div className="min-h-screen">
      <PageIntro eyebrow="About" blurb="The company, the team, and the problem we're solving." />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] mb-4">
            <Activity className="w-4 h-4" />
            ScenePulse — Est. 2022
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">
            Radar for<br />
            <span className="text-primary">the night out.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            ScenePulse is real-time crowd intelligence for bars, restaurants, cafés, and
            experiences across North America. We combine community reports, operator signals,
            and historical patterns so you know what a room feels like — before you leave
            the house.
          </p>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      {stats && (
        <section className="py-10 border-b border-border/40 bg-muted/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border/50 rounded-2xl p-5 text-center">
                <MapPin className="w-4 h-4 text-primary mx-auto mb-2" />
                <div className="text-3xl font-black">{stats.totalVenues}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Venues tracked</div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-5 text-center">
                <Map className="w-4 h-4 text-secondary mx-auto mb-2" />
                <div className="text-3xl font-black">{stats.marketsCovered}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Markets</div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-5 text-center">
                <Users className="w-4 h-4 text-destructive mx-auto mb-2" />
                <div className="text-3xl font-black">{stats.packedNow}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Packed right now</div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-5 text-center">
                <Activity className="w-4 h-4 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-black">{stats.openNow}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">Open now</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Origin story ─────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
                The problem
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">
                You can check a surf report.<br />
                <span className="text-primary">Why not a bar report?</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  Surf forecasting changed surfing. Before it, you drove to the beach and
                  hoped. After it, you checked the report and made a decision. The ocean
                  didn't change — the information did.
                </p>
                <p>
                  Going out works the same way. You pick a place, get an Uber, and find a
                  two-hour wait or a room that's already half-empty. You had no way to know.
                  ScenePulse exists to change that.
                </p>
                <p>
                  We started in Kalamazoo with a weekend prototype and 12 venues. Today we
                  track over 700 venues across 14 North American markets, updated continuously
                  by the people actually in the room.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mb-4">
                Milestones
              </div>
              {MILESTONES.map((m, i) => (
                <div
                  key={m.year}
                  className="flex gap-4 group"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${i === MILESTONES.length - 1 ? "border-primary text-primary bg-primary/10" : "border-border/50 text-muted-foreground"}`}>
                      {m.year.slice(2)}
                    </div>
                    {i < MILESTONES.length - 1 && (
                      <div className="w-px flex-1 bg-border/30 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60 mb-0.5">{m.year}</div>
                    <div className="font-bold text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40 bg-muted/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
            How we work
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-10">
            What we believe
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-card border border-border/50 rounded-2xl p-6"
              >
                <v.icon className="w-5 h-5 text-primary mb-4" />
                <h3 className="font-bold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
            The people
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">
            Meet the team
          </h2>
          <p className="text-sm text-muted-foreground mb-10 max-w-xl">
            A small team that goes out too much and cares too much about whether the data is right.
            Click any card to read more.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {TEAM.map((member) => (
              <TeamCard
                key={member.id}
                member={member}
                onClick={() => setActiveMember(member)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Hiring CTA ───────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gradient-to-br from-primary/10 via-card to-secondary/5 border border-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] mb-2">
                <Briefcase className="w-4 h-4" />
                We're hiring
              </div>
              <h3 className="font-black text-xl uppercase tracking-tight mb-2">Join the team</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                We're looking for engineers, a product designer, and city launchers who want to build the Surfline of going out.
              </p>
            </div>
            <Button
              asChild
              className="shrink-0 font-mono text-xs"
            >
              <Link href="/careers">
                See open roles
                <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Team modal ───────────────────────────────────────────────── */}
      {activeMember && (
        <TeamModal member={activeMember} onClose={() => setActiveMember(null)} />
      )}
    </div>
  );
}
