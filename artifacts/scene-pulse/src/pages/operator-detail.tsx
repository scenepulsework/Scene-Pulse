import { useParams, Link } from "wouter";
import { PageIntro } from "@/components/page-intro";
import { useListMarketGaps, getListMarketGapsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronRight, CheckCircle2, Mail, TrendingUp, Users, Clock, Star, RadioTower, BarChart2 } from "lucide-react";
import NotFound from "@/pages/not-found";

const GAP_CONTENT: Record<string, {
  fix: string;
  howWeFixIt: { icon: React.ReactNode; title: string; body: string }[];
  impact: string[];
  cta: string;
}> = {
  "stale-discovery-data": {
    fix: "ScenePulse keeps a live signal for every venue — crowd score, wait time, and vibe — updated by community reports in real time. When a guest searches for somewhere to go, they see conditions from the last hour, not last month.",
    howWeFixIt: [
      { icon: <RadioTower className="w-5 h-5 text-primary" />, title: "Live crowd signal, not stale listing", body: "Your venue's live crowd score, wait estimate, and current vibe display to users in real time. No more \"4 photos from 2019\" as the first impression." },
      { icon: <Users className="w-5 h-5 text-secondary" />, title: "Community keeps it fresh", body: "Every guest who files a report updates your venue's live data automatically. The crowd sources the accuracy — you don't have to touch anything." },
      { icon: <TrendingUp className="w-5 h-5 text-accent" />, title: "Intent drives discovery", body: "Users searching for \"date night,\" \"no wait,\" or \"live music\" find your venue when you match those signals — not because you paid for placement." },
    ],
    impact: [
      "Guests arrive with accurate expectations — fewer walk-offs from surprise crowds",
      "Your venue appears in intent-driven searches (date night, no wait, patio energy)",
      "Live conditions make your listing stand out on the map compared to dead listings",
    ],
    cta: "Get your venue on the live map",
  },
  "waitlist-leakage": {
    fix: "ScenePulse surfaces live wait times alongside line trend data — so guests decide to join or leave based on real information, not a vague sense that the line \"looks long.\" A 20-minute wait that's falling is very different from one that's rising.",
    howWeFixIt: [
      { icon: <Clock className="w-5 h-5 text-primary" />, title: "Accurate wait times, not estimates", body: "Community reports feed your live wait time. When someone in line updates the wait, the next person approaching sees the real number — and makes a more informed decision to stay." },
      { icon: <TrendingUp className="w-5 h-5 text-secondary" />, title: "Line trend changes the frame", body: "\"20 minutes\" alone loses guests. \"20 minutes and falling\" retains them. ScenePulse shows the direction the wait is moving so guests trust the line is worth it." },
      { icon: <BarChart2 className="w-5 h-5 text-accent" />, title: "Operators see when walk-off risk peaks", body: "High wait + rising trend = walk-off risk. That signal helps you know when to add staff, open a secondary entrance, or push a promotion to pull guests in." },
    ],
    impact: [
      "Guests who see a falling wait are significantly more likely to stay in line",
      "Walk-off intent drops when wait is contextualized with trend direction",
      "Operators get a real-time signal for when to intervene with staffing or incentives",
    ],
    cta: "Reduce walk-offs with live wait data",
  },
  "unseen-capacity": {
    fix: "ScenePulse shows live headcount, seating odds, and crowd level — not just whether the front looks busy. Guests who might walk away after seeing a packed entrance can check the app and see that the back bar or patio has plenty of room.",
    howWeFixIt: [
      { icon: <Users className="w-5 h-5 text-primary" />, title: "Seating odds surface hidden space", body: "High, medium, or low seating odds give walk-up guests a probabilistic read on whether there's room — even if the front of house looks slammed." },
      { icon: <Star className="w-5 h-5 text-secondary" />, title: "Community reports describe the full room", body: "Vibe notes like \"back bar completely open\" or \"patio has tables\" give guests the specific intelligence to find the open pocket in a busy venue." },
      { icon: <CheckCircle2 className="w-5 h-5 text-accent" />, title: "Arrival tips guide guests to the right door", body: "Operators can surface tips like \"ask for the rear lounge\" or \"patio entrance on the side street\" so guests who'd otherwise leave find the open section." },
    ],
    impact: [
      "Walk-up guests who check the app before entering have better landing rates",
      "Patio and secondary spaces fill faster when visible in live data",
      "Fewer wasted covers from guests who would have stayed if they'd known",
    ],
    cta: "Show guests your full capacity",
  },
  "staffing-blind-spots": {
    fix: "ScenePulse's live crowd trend shows when a venue is building toward peak pressure — before the line forms. That rising signal is an early warning for operators to surge staffing, open additional service points, or prepare for a high-volume stretch.",
    howWeFixIt: [
      { icon: <TrendingUp className="w-5 h-5 text-primary" />, title: "Rising crowd trend = early warning", body: "A crowd score trending from 50 to 70 over 30 minutes tells you peak is incoming. That's a staffing call window — not a scramble after the line forms." },
      { icon: <Clock className="w-5 h-5 text-secondary" />, title: "Peak pressure windows calibrate expectations", body: "Every venue carries a historically-observed peak pressure window. Operators who know their peak can staff into it proactively instead of reacting to it." },
      { icon: <BarChart2 className="w-5 h-5 text-accent" />, title: "Live headcount supports real-time shifts", body: "As headcount climbs, the operator view shows capacity pressure building — a signal to shift staff from prep to floor before service quality drops." },
    ],
    impact: [
      "Operators who staff into the surge window see shorter wait times and higher table turns",
      "Early warning signals reduce the scramble period and associated service failures",
      "Peak pressure windows help finance and HR model labor more accurately over time",
    ],
    cta: "Get crowd intelligence for your team",
  },
  "promo-timing-gaps": {
    fix: "Running a happy hour when your venue is already at capacity doesn't move the needle. ScenePulse's live crowd data helps operators time promotions to off-peak windows — driving traffic when there's room to absorb it and turning slow hours into earned revenue.",
    howWeFixIt: [
      { icon: <Clock className="w-5 h-5 text-primary" />, title: "Live data shows when to push", body: "If crowd score drops below 40 on a Tuesday at 7pm, that's the window to push a promo. ScenePulse signals the opportunity — you set the offer." },
      { icon: <TrendingUp className="w-5 h-5 text-secondary" />, title: "Off-peak visibility drives discovery", body: "Users filtering for \"no wait\" or \"open right now\" find your venue during its low-traffic windows — naturally filling the troughs without paid promotion." },
      { icon: <Star className="w-5 h-5 text-accent" />, title: "Intent filters match promo audiences", body: "Date night seekers, late-night food hunters, and game bar regulars are all searching with specific intent. A well-timed promo aligned to those intents converts better." },
    ],
    impact: [
      "Promotions timed to live low-traffic windows see higher incremental covers",
      "\"No wait\" intent filters send ready-to-convert guests during slow hours",
      "Operators who align promos to crowd lows see better ROI than blanket scheduling",
    ],
    cta: "Align your promos to live crowd signals",
  },
  "vibe-mismatch": {
    fix: "ScenePulse's vibe reports and intent filters ensure that the guests who walk through your door are the ones your venue is actually built for. A speakeasy gets speakeasy seekers. A late-night kitchen gets the crowd that stays hungry until 2am. Less mismatch, more regulars.",
    howWeFixIt: [
      { icon: <Users className="w-5 h-5 text-primary" />, title: "Intent filters send matched guests", body: "When your venue is tagged for \"date night,\" \"live music,\" or \"patio energy,\" the guests who select those intents are already pre-filtered for your vibe before they walk in." },
      { icon: <Star className="w-5 h-5 text-secondary" />, title: "Vibe reports set accurate expectations", body: "Community reports paint a real picture of your atmosphere — noise level, crowd age, energy type. Guests who don't match self-select out before arriving." },
      { icon: <CheckCircle2 className="w-5 h-5 text-accent" />, title: "Better fit means better regulars", body: "Guests who arrive because the vibe matches what they wanted are more likely to return, leave a comment, and file a live report — compounding the signal quality for everyone." },
    ],
    impact: [
      "Intent-matched guests have lower walk-off rates and higher average spend",
      "Accurate vibe expectations reduce disappointed walk-ins and negative sentiment",
      "Venues that match their community signal attract guests who actually come back",
    ],
    cta: "Match your vibe to the right crowd",
  },
};

export default function OperatorDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const { data: gaps, isLoading } = useListMarketGaps({
    query: { queryKey: getListMarketGapsQueryKey() },
  });

  const gap = gaps?.find((g) => g.id === slug);
  const content = GAP_CONTENT[slug];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!gap || !content) return <NotFound />;

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow={gap.title}
        parent={{ label: "For Operators", href: "/operators" }}
        blurb="The market gap and how ScenePulse closes it."
      />

      <section className="py-12 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-4">
            <RadioTower className="w-3.5 h-3.5" /> The problem
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">{gap.description}</p>
        </div>
      </section>

      <section className="py-16 border-b border-border/40 bg-muted/10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" /> How ScenePulse fixes it
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">{content.fix}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.howWeFixIt.map((item) => (
              <div key={item.title} className="bg-card border border-border/50 rounded-xl p-5">
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-6">
            <TrendingUp className="w-3.5 h-3.5" /> Business impact
          </div>
          <ul className="space-y-4">
            {content.impact.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 bg-primary/5 border-y border-primary/20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">{content.cta}</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Get your venue on ScenePulse and put live crowd intelligence to work. Reach us at{" "}
            <a href="mailto:operators@scenepulse.app" className="text-primary hover:underline">
              operators@scenepulse.app
            </a>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="rounded-full gap-2">
              <a href="mailto:operators@scenepulse.app">
                Contact us <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full gap-2">
              <Link href="/operators">
                All operator features <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
