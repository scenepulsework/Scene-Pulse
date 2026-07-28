import { Link, Redirect } from "wouter";
import { Show, useUser } from "@clerk/react";
import {
  useListWatchlist,
  getListWatchlistQueryKey,
  useGetMyActivity,
  getGetMyActivityQueryKey,
} from "@workspace/api-client-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Activity, BookmarkCheck, BookmarkX, Clock, MessageSquare, User } from "lucide-react";

function ProfileContent() {
  const { user } = useUser();
  const { removeFromWatchlist } = useWatchlist();
  const { data: watchlist, isLoading: watchlistLoading } = useListWatchlist({
    query: { queryKey: getListWatchlistQueryKey() },
  });
  const { data: activity, isLoading: activityLoading } = useGetMyActivity({
    query: { queryKey: getGetMyActivityQueryKey() },
  });

  const displayName =
    user?.fullName || user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "You";

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-mono uppercase tracking-tight" data-testid="text-profile-name">
            {displayName}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="flex items-center gap-2 text-lg font-bold font-mono uppercase tracking-wider mb-4">
          <BookmarkCheck className="w-5 h-5 text-primary" /> Saved venues
        </h2>
        {watchlistLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !watchlist || watchlist.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-watchlist-empty">
            No saved venues yet. Tap the bookmark on any venue card to save it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {watchlist.map((venue) => (
              <li
                key={venue.id}
                data-testid={`row-watchlist-${venue.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card px-4 py-3"
              >
                <Link href={`/venue/${venue.id}`} className="min-w-0 flex-1 group">
                  <div className="font-bold group-hover:text-primary transition-colors truncate">{venue.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {venue.city} · {venue.category}
                  </div>
                </Link>
                <Badge variant="outline" className="font-mono uppercase shrink-0">
                  {venue.crowdLevel}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${venue.name} from watchlist`}
                  data-testid={`button-remove-watchlist-${venue.id}`}
                  onClick={() => removeFromWatchlist(venue.id)}
                >
                  <BookmarkX className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="flex items-center gap-2 text-lg font-bold font-mono uppercase tracking-wider mb-4">
          <Activity className="w-5 h-5 text-primary" /> Your live reports
        </h2>
        {activityLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !activity || activity.reports.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-reports-empty">
            No live reports yet. Drop a vibe check from any venue page.
          </p>
        ) : (
          <ul className="space-y-3">
            {activity.reports.map((r) => (
              <li
                key={r.id}
                data-testid={`row-report-${r.id}`}
                className="rounded-lg border border-border/60 bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Link href={`/venue/${r.venueId}`} className="font-bold hover:text-primary transition-colors">
                    {r.venueName}
                  </Link>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                  <Badge variant="outline" className="uppercase">{r.crowdLevel}</Badge>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.waitTimeMinutes} min wait
                  </span>
                </div>
                <p className="mt-2 text-sm">{r.vibeNote}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold font-mono uppercase tracking-wider mb-4">
          <MessageSquare className="w-5 h-5 text-primary" /> Your comments
        </h2>
        {activityLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !activity || activity.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-comments-empty">
            No comments yet. Join the conversation on any venue page.
          </p>
        ) : (
          <ul className="space-y-3">
            {activity.comments.map((c) => (
              <li
                key={c.id}
                data-testid={`row-comment-${c.id}`}
                className="rounded-lg border border-border/60 bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Link href={`/venue/${c.venueId}`} className="font-bold hover:text-primary transition-colors">
                    {c.venueName}
                  </Link>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 text-sm">{c.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Profile() {
  return (
    <>
      <Show when="signed-in">
        <ProfileContent />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}
