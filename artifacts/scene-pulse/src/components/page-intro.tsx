import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export function PageIntro({
  eyebrow,
  blurb,
}: {
  eyebrow: string;
  blurb?: string;
}) {
  return (
    <div className="border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors" data-testid="breadcrumb-home">
            ScenePulse
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{eyebrow}</span>
        </div>
        {blurb && (
          <p className="mt-2 text-sm text-muted-foreground font-mono max-w-2xl">{blurb}</p>
        )}
      </div>
    </div>
  );
}
