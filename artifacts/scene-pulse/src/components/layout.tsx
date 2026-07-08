import { useState } from "react";
import { Link } from "wouter";
import { Activity, Menu } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#map", label: "Map" },
  { href: "#markets", label: "Markets" },
  { href: "#operators", label: "For Operators" },
  { href: "#contact", label: "Contact" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: health } = useHealthCheck();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold text-xl tracking-tighter hover:text-primary transition-colors">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">SCENEPULSE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#map" className="hover:text-foreground transition-colors">Map</a>
            <a href="#markets" className="hover:text-foreground transition-colors">Markets</a>
            <a href="#operators" className="hover:text-foreground transition-colors">Operators</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-primary pulse-indicator' : 'bg-destructive'}`} />
              <span className="text-xs uppercase tracking-wider font-mono">Live</span>
            </div>
          </nav>

          <div className="flex md:hidden items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-primary pulse-indicator' : 'bg-destructive'}`} />
              <span className="text-xs uppercase tracking-wider font-mono">Live</span>
            </div>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background border-border/40">
                <nav className="flex flex-col gap-1 mt-10">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setMobileNavOpen(false)}
                      className="px-2 py-3 text-base font-medium text-muted-foreground hover:text-foreground border-b border-border/40 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border/40 bg-card py-12 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-mono font-bold text-lg mb-4">
              <Activity className="w-5 h-5 text-primary" />
              SCENEPULSE
            </Link>
            <p className="text-sm text-muted-foreground">
              Live conditions for local nightlife, dining, and retail. Know before you go.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4 font-mono uppercase tracking-wider text-sm">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#map" className="hover:text-primary transition-colors">Live Map</a></li>
              <li><a href="#markets" className="hover:text-primary transition-colors">Markets</a></li>
              <li><a href="#operators" className="hover:text-primary transition-colors">For Operators</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 font-mono uppercase tracking-wider text-sm">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border/40 text-center text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} ScenePulse. All rights reserved.
        </div>
      </footer>
    </div>
  );
}