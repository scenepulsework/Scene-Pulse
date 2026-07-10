import { Link } from "wouter";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { useGetHeroStats } from "@workspace/api-client-react";
import { Activity, Users, MapPin, Map, Briefcase } from "lucide-react";

export default function About() {
  const { data: stats } = useGetHeroStats();

  return (
    <div className="min-h-screen">
      <PageIntro eyebrow="About" blurb="Why ScenePulse exists." />

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Activity className="w-10 h-10 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
            About ScenePulse
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed font-mono">
            We build radar for the night. No more dead crowds, no more unexpected lines, no more guessing.
            Real-time data for the hospitality industry and the people who keep it alive.
          </p>
        </div>
      </section>

      {stats && (
        <section className="py-12 border-t border-border/40 bg-muted/20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                <MapPin className="w-4 h-4 text-primary mx-auto mb-2" />
                <div className="text-2xl font-black">{stats.totalVenues}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Venues tracked</div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                <Map className="w-4 h-4 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-black">{stats.marketsCovered}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Markets</div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                <Users className="w-4 h-4 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-black">{stats.packedNow}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Packed now</div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                <Activity className="w-4 h-4 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-black">{stats.openNow}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Open now</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">What we believe</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Surf forecasting changed surfing: you stopped driving to a flat beach. ScenePulse does the
              same for a night out. Crowd scores, wait times, and vibe checks — reported by the people in
              the room, surfaced before you leave the house.
            </p>
            <p>
              For operators, the same signals become a live view of demand pressure: when the line builds,
              when the room empties, and where the market has gaps worth filling.
            </p>
          </div>
          <div className="mt-10 bg-muted/20 border border-border/40 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                We're hiring across engineering, design, and growth.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="font-mono text-xs border-primary/30 hover:border-primary shrink-0">
              <Link href="/careers" data-testid="link-about-careers">See open roles</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
