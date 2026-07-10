import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, ArrowUpRight } from "lucide-react";

const ROLES = [
  {
    title: "Senior Full-Stack Engineer",
    team: "Platform",
    location: "Remote (North America)",
    type: "Full-time",
    blurb: "Own the live-conditions pipeline end to end — from community reports landing to pins changing color on the map.",
  },
  {
    title: "Data Engineer — Live Signals",
    team: "Signals",
    location: "Chicago or Remote",
    type: "Full-time",
    blurb: "Turn messy crowd reports into trustworthy crowd scores, wait estimates, and trend lines across 13 markets.",
  },
  {
    title: "Product Designer",
    team: "Product",
    location: "Remote (North America)",
    type: "Full-time",
    blurb: "Design the fastest way to answer one question: is it worth leaving the house right now?",
  },
  {
    title: "Community Lead",
    team: "Growth",
    location: "New York City",
    type: "Full-time",
    blurb: "Build the reporter community that keeps The Wire honest — nightlife natives, line veterans, and vibe-checkers.",
  },
  {
    title: "Market Launcher",
    team: "Growth",
    location: "Austin",
    type: "Contract",
    blurb: "Map the venues, recruit the first reporters, and light up a new city on ScenePulse.",
  },
];

export default function Careers() {
  return (
    <div className="min-h-screen">
      <PageIntro eyebrow="Careers" blurb="Help build radar for the night." />

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-12">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] mb-3">
              <Briefcase className="w-4 h-4" />
              We're hiring
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Work at ScenePulse
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              We're a small team obsessed with one thing: knowing what a room feels like before you
              walk into it. If you've ever bailed on a dead bar or waited an hour for a table you
              could have timed better — you already get it.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-colors"
                data-testid={`career-role-${role.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold text-xl mb-1">{role.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground mb-3">
                      <span className="uppercase tracking-wider text-primary">{role.team}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {role.location}
                      </span>
                      <span>{role.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{role.blurb}</p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shrink-0 font-mono text-xs border-primary/30 hover:border-primary"
                  >
                    <a href={`mailto:careers@scenepulse.app?subject=${encodeURIComponent(`Application: ${role.title}`)}`}>
                      Apply
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/20 border border-border/40 rounded-xl p-6 text-center">
            <h3 className="font-bold mb-2">Don't see your role?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you can make live data feel alive, we want to hear from you anyway.
            </p>
            <a
              href="mailto:careers@scenepulse.app?subject=Open%20application"
              className="font-mono text-sm font-bold text-primary hover:underline"
              data-testid="link-careers-email"
            >
              careers@scenepulse.app
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
