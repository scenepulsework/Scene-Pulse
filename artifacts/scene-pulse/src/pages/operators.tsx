import { Link } from "wouter";
import { OperatorsSection } from "@/components/home-sections";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function Operators() {
  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="For Operators"
        blurb="The market gaps we're closing for bars, restaurants, retail, and venues."
      />
      <div className="container mx-auto px-4 -mt-4 mb-10">
        <div className="bg-card border border-primary/30 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold font-mono uppercase tracking-wider flex items-center mb-1">
              <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
              Own one of these venues?
            </h2>
            <p className="text-sm text-muted-foreground">
              Claim your listing to manage your details — category, best-for tags, cover cost, and more.
            </p>
          </div>
          <Link href="/operator-dashboard">
            <Button className="font-mono uppercase tracking-wider text-xs shrink-0">
              Claim your venue
            </Button>
          </Link>
        </div>
      </div>
      <OperatorsSection />
    </div>
  );
}
