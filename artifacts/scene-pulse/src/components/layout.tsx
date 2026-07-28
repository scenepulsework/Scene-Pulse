import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Menu, User, LogOut } from "lucide-react";
import { Show, useUser, useClerk } from "@clerk/react";
import { useHealthCheck } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VENUE_TYPES } from "@/lib/venue-types";
import NotificationBell from "@/components/notification-bell";

const NAV_LINKS = [
  { href: "/", label: "Map" },
  { href: "/types", label: "Types" },
  { href: "/services", label: "Services" },
  { href: "/markets", label: "Markets" },
  { href: "/operators", label: "Operators" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthControls({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0];

  return (
    <>
      <Show when="signed-out">
        <Link
          href="/sign-in"
          data-testid="link-nav-sign-in"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Sign in
        </Link>
      </Show>
      <Show when="signed-in">
        <Link
          href="/profile"
          data-testid="link-nav-profile"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:text-primary hover:border-primary/40 transition-colors"
        >
          <User className="w-3.5 h-3.5 text-primary" />
          {displayName ?? "Profile"}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-sign-out"
          aria-label="Sign out"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </Show>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: health } = useHealthCheck();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [location] = useLocation();
  const navLinks = NAV_LINKS;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold text-xl tracking-tighter hover:text-primary transition-colors">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">SCENEPULSE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`transition-colors ${
                  location === link.href ? "text-primary" : "hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-primary pulse-indicator' : 'bg-destructive'}`} />
              <span className="text-xs uppercase tracking-wider font-mono">Live</span>
            </div>
            <div className="flex items-center gap-2">
              <Show when="signed-in">
                <NotificationBell />
              </Show>
              <AuthControls />
            </div>
          </nav>

          <div className="flex md:hidden items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-primary pulse-indicator' : 'bg-destructive'}`} />
              <span className="text-xs uppercase tracking-wider font-mono">Live</span>
            </div>
            <Show when="signed-in">
              <NotificationBell />
            </Show>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background border-border/40">
                <nav className="flex flex-col gap-1 mt-10">
                  <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                    <AuthControls onNavigate={() => setMobileNavOpen(false)} />
                  </div>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setMobileNavOpen(false)}
                      className={`px-2 py-3 text-base font-medium border-b border-border/40 transition-colors ${
                        location === link.href
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="mt-6">
                    <div className="px-2 pb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Browse by type
                    </div>
                    {VENUE_TYPES.map((type) => {
                      const href = `/types/${type.slug}`;
                      const Icon = type.icon;
                      return (
                        <Link
                          key={type.slug}
                          href={href}
                          data-testid={`link-mobile-type-${type.slug}`}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-center gap-3 px-2 py-3 text-base font-medium border-b border-border/40 transition-colors ${
                            location === href
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-primary/70" />
                          {type.plural}
                        </Link>
                      );
                    })}
                  </div>
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
              Crowd scores, wait times, and vibe checks for local venues — so you know before you go. 13 North American markets.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4 font-mono uppercase tracking-wider text-sm">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Live Map</Link></li>
              <li><Link href="/types" className="hover:text-primary transition-colors" data-testid="link-footer-types">Venue Types</Link></li>
              <li><Link href="/speakeasies" className="hover:text-primary transition-colors" data-testid="link-footer-speakeasies">Speakeasies</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="/markets" className="hover:text-primary transition-colors">Markets</Link></li>
              <li><Link href="/operators" className="hover:text-primary transition-colors">Operators</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 font-mono uppercase tracking-wider text-sm">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors" data-testid="link-footer-careers">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 font-mono uppercase tracking-wider text-sm">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:hello@scenepulse.app" className="hover:text-primary transition-colors font-mono">hello@scenepulse.app</a>
              </li>
              <li>
                <a href="mailto:press@scenepulse.app" className="hover:text-primary transition-colors font-mono">press@scenepulse.app</a>
              </li>
              <li className="pt-2">
                <Link href="/operators" className="hover:text-primary transition-colors">
                  Run a venue? Get on the map →
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border/40 text-center text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} ScenePulse. All rights reserved. Read the room before you leave.
        </div>
      </footer>
    </div>
  );
}