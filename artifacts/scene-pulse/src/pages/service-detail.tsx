import { useParams, Link } from "wouter";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Radar, MessageSquareText, Compass, ChevronRight, ArrowRight, Users, Clock, TrendingUp, Star, MessageCircle, Shield, BarChart2, MapPin } from "lucide-react";
import NotFound from "@/pages/not-found";

const SERVICES: Record<string, {
  slug: string;
  icon: React.ReactNode;
  label: string;
  tagline: string;
  blurb: string;
  color: string;
  howItWorks: { step: number; title: string; body: string }[];
  whyItMatters: { icon: React.ReactNode; title: string; body: string }[];
  example: { scenario: string; outcome: string };
}> = {
  "live-crowd-radar": {
    slug: "live-crowd-radar",
    icon: <Radar className="w-8 h-8" />,
    label: "Live Crowd Radar",
    tagline: "Know what's actually happening before you commit to the walk.",
    blurb: "A 0–100 crowd score, real headcount estimate, live wait time, and line trend — updated the moment community reports land, not when someone remembers to edit a listing.",
    color: "text-primary",
    howItWorks: [
      {
        step: 1,
        title: "Community reports feed the score",
        body: "When someone at a venue taps \"Add Report,\" their crowd level, wait time, and vibe note are processed immediately. The venue's crowd score shifts based on the aggregated weight of recent reports — fresher reports count more.",
      },
      {
        step: 2,
        title: "Score maps to a 0–100 scale",
        body: "Open (low foot traffic, no wait) scores 0–40. Lively (moderate crowd, some pressure) sits in the 40–70 range. Packed (standing room, 15+ min wait, high energy) lands 70–100. The number tells you what you're walking into.",
      },
      {
        step: 3,
        title: "Headcount and wait time update live",
        body: "Each submitted report includes an estimated wait and a crowd level selection. Those values blend with the venue's baseline to produce a live wait estimate and headcount range — shown in real time on every venue card and detail page.",
      },
      {
        step: 4,
        title: "Line trend shows direction, not just state",
        body: "Rising, steady, or falling — the trend shows whether conditions are getting better or worse. A 70 that's falling is a very different call than a 70 that's rising.",
      },
    ],
    whyItMatters: [
      { icon: <Clock className="w-5 h-5 text-primary" />, title: "No more guessing", body: "Stale review sites can't tell you if the line is wrapped around the block right now. The radar can." },
      { icon: <TrendingUp className="w-5 h-5 text-secondary" />, title: "Trend over snapshot", body: "A score alone isn't the whole story. The direction it's moving in the last 30 minutes changes the call." },
      { icon: <Users className="w-5 h-5 text-accent" />, title: "Crowd intelligence from the room", body: "People actually there are more accurate than automated foot-traffic sensors or aggregated check-in data from hours ago." },
    ],
    example: {
      scenario: "You're debating between two bars on a Friday at 10pm. One has a crowd score of 82 and rising — clearly the hot spot but you'll wait. The other is at 55 and falling — perfect window to walk right in.",
      outcome: "You pick the second one, skip the line, and get a table within five minutes. That's the radar in action.",
    },
  },
  "vibe-reports": {
    slug: "vibe-reports",
    icon: <MessageSquareText className="w-8 h-8" />,
    label: "Real-Time Vibe Reports",
    tagline: "Conditions from people actually in the room, not the algorithm.",
    blurb: "Guests submit a 10-second pulse check — crowd level, wait time estimate, and a short vibe note. Those reports flow directly into the venue's live conditions and the community feed so the next person walking up knows what to expect.",
    color: "text-secondary",
    howItWorks: [
      {
        step: 1,
        title: "Three fields, ten seconds",
        body: "A report captures: (1) crowd level — open, lively, or packed; (2) wait time in minutes; (3) a free-text vibe note up to 140 characters. No account needed, no friction, no review form.",
      },
      {
        step: 2,
        title: "Reports hit the feed instantly",
        body: "The moment a report is submitted, it appears in the venue's Live Reports feed — surfaced on both the map panel and the venue detail page. The feed polls every 10 seconds so new reports show up without a page refresh.",
      },
      {
        step: 3,
        title: "Reports drive the crowd score",
        body: "Each submitted crowd level and wait time adjusts the venue's live stats. The most recent reports carry more weight, so conditions shift quickly when the room changes — not hours later.",
      },
      {
        step: 4,
        title: "Past-experience comments add depth",
        body: "Beyond live reports, the feed includes past-experience comments from previous visits — giving you a longer-term read on what the space is typically like, alongside what's happening right now.",
      },
    ],
    whyItMatters: [
      { icon: <MessageCircle className="w-5 h-5 text-secondary" />, title: "From people, not bots", body: "Community reports can't be gamed the same way star ratings can. A note that says \"line wrapping the block, moving fast\" is more useful than 4.2 stars." },
      { icon: <Shield className="w-5 h-5 text-primary" />, title: "Lightweight by design", body: "No login. No mandatory review. Just a quick pulse. Lower friction means more submissions and a denser, more current signal." },
      { icon: <Star className="w-5 h-5 text-accent" />, title: "Live + historical together", body: "The merged feed shows you tonight's reports and last week's experience side by side — so you see the full picture in one scroll." },
    ],
    example: {
      scenario: "It's 9:30pm on a Saturday. Three people have filed reports in the last 40 minutes: \"Slammed, 30 min wait,\" \"Line moved fast, inside is lively,\" \"Back bar totally open if you can get in.\"",
      outcome: "You know the front is busy but the back bar has space. You walk in, head to the back, and skip the line entirely.",
    },
  },
  "best-time-guidance": {
    slug: "best-time-guidance",
    icon: <Compass className="w-8 h-8" />,
    label: "Best-Time Guidance",
    tagline: "Show up when the scene is right, not when the line is longest.",
    blurb: "Every venue carries a best arrival window, peak pressure window, seating odds, noise level, cover cost, and arrival tips — so timing a night out feels like having a local contact on the inside.",
    color: "text-accent",
    howItWorks: [
      {
        step: 1,
        title: "Best arrival window is venue-specific",
        body: "Each venue carries a \"best arrival window\" — the time range when crowd pressure is manageable and the scene is still worth it. For most bars it's the 30–45 minutes before peak. For restaurants, it's when reservations thin out.",
      },
      {
        step: 2,
        title: "Peak pressure window is the warning",
        body: "Alongside the best window is the peak pressure window — the timeframe when this venue typically slams. Showing up during that window means the longest wait, the tightest room, and the most noise. Knowing it lets you avoid it or plan for it.",
      },
      {
        step: 3,
        title: "Seating odds give you a probability, not a promise",
        body: "High, medium, or low — seating odds summarize how likely you are to find a spot without a reservation based on current crowd data and historical patterns for this venue type and time.",
      },
      {
        step: 4,
        title: "Arrival tips are tactical",
        body: "Specific moves: show up 20 minutes before the rush, ask for the patio, text ahead, go on a Tuesday. These are sourced from the community feed and venue reporting history — not generic advice.",
      },
    ],
    whyItMatters: [
      { icon: <Clock className="w-5 h-5 text-accent" />, title: "Timing changes everything", body: "The difference between a 45-minute wait and walking straight in is often 20 minutes of timing. The guidance closes that gap." },
      { icon: <BarChart2 className="w-5 h-5 text-primary" />, title: "Data from patterns, not guesses", body: "Peak windows and arrival tips are built from real report history — not a generic algorithm that applies the same logic to every bar." },
      { icon: <MapPin className="w-5 h-5 text-secondary" />, title: "Works across all 13 markets", body: "Chicago's dinner rush is different from Miami's late-night wave. Guidance is per venue, not per city average." },
    ],
    example: {
      scenario: "A rooftop bar in Nashville shows a best arrival window of 7–8:30pm and a peak pressure window of 9pm–midnight with a cover starting at $10 after 9.",
      outcome: "You show up at 7:45pm, skip the cover, get a table on the roof, and leave before the crowd arrives at your next spot. The app paid for itself in one night.",
    },
  },
};

export default function ServiceDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const service = SERVICES[slug];

  if (!service) return <NotFound />;

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow={service.label}
        parent={{ label: "Services", href: "/services" }}
        blurb={service.tagline}
      />

      <section className="py-12 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className={`flex items-center gap-3 mb-4 ${service.color}`}>
            {service.icon}
            <span className="font-mono text-xs uppercase tracking-wider opacity-70">{service.label}</span>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">{service.blurb}</p>
        </div>
      </section>

      <section className="py-16 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-10">How it works</h2>
          <div className="space-y-10">
            {service.howItWorks.map((step) => (
              <div key={step.step} className="flex gap-5">
                <div className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-sm font-mono ${service.color} border-current`}>
                  {step.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Why it matters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {service.whyItMatters.map((item) => (
              <div key={item.title} className="bg-card border border-border/50 rounded-xl p-5">
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Real scenario</h2>
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Scenario</span>
              <p className="mt-1 text-muted-foreground leading-relaxed">{service.example.scenario}</p>
            </div>
            <div className={`pt-4 border-t border-border/40`}>
              <span className={`text-xs font-mono uppercase tracking-wider ${service.color}`}>Outcome</span>
              <p className="mt-1 leading-relaxed">{service.example.outcome}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button asChild className="rounded-full gap-2">
            <Link href="/#map">
              See it live on the map <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full gap-2">
            <Link href="/services">
              All services <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
