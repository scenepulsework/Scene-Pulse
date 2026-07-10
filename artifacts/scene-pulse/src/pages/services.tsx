import { ServicesSection } from "@/components/home-sections";
import { PageIntro } from "@/components/page-intro";
import { Radar, MessageSquareText, Compass } from "lucide-react";

const DETAILS = [
  {
    icon: <Radar className="w-5 h-5 text-primary" />,
    title: "How the crowd radar works",
    body: "Every venue carries a live crowd score from 0–100, a wait estimate, headcount, and a line trend. Community reports update the numbers the moment they land — no stale check-ins, no yesterday's data.",
  },
  {
    icon: <MessageSquareText className="w-5 h-5 text-secondary" />,
    title: "Vibe reports from real people",
    body: "Anyone at a venue can file a 10-second report: how packed it is, how long the line runs, what the room feels like. Reports flow straight into the venue's live conditions and The Wire comment feed.",
  },
  {
    icon: <Compass className="w-5 h-5 text-accent" />,
    title: "Timing strategy, not guesswork",
    body: "Best arrival windows, peak pressure windows, seating odds, and arrival tips are tracked per venue — so you show up when the scene is right, not when the line is longest.",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen">
      <PageIntro eyebrow="Services" blurb="What ScenePulse tracks and how it keeps you ahead of the line." />
      <ServicesSection />
      <section className="py-16 border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Under the hood</h2>
          <div className="space-y-8">
            {DETAILS.map((d) => (
              <div key={d.title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center">
                  {d.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
