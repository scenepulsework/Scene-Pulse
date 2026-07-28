import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Bell, BellRing, CheckCheck, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const crowdColors: Record<string, string> = {
    open: "text-green-400",
    lively: "text-yellow-400",
    packed: "text-red-400",
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        data-testid="button-notifications"
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-primary animate-pulse" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground font-mono">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border/60 bg-card shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <span className="text-sm font-bold font-mono uppercase tracking-wider">Alerts</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => markAllRead()}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground font-mono">
                No alerts yet. Save venues to get notified when they pop off.
              </p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    data-testid={`notification-${n.id}`}
                    className={`px-4 py-3 border-b border-border/30 last:border-0 transition-colors ${
                      n.isRead ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{n.message}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                          <span className={crowdColors[n.crowdLevel] ?? ""}>
                            {n.crowdLevel}
                          </span>
                          <span>·</span>
                          <span>{n.waitTimeMinutes} min wait</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/venue/${n.venueId}`}
                          onClick={() => { markRead(n.id); setOpen(false); }}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Go to venue"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            aria-label="Mark as read"
                            data-testid={`button-mark-read-${n.id}`}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-2 border-t border-border/40 text-center">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              Manage alert preferences →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
