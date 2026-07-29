import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, SignInButton } from "@clerk/react";
import {
  Star,
  Gift,
  Users,
  MessageSquare,
  Bookmark,
  Copy,
  Check,
  Activity,
  Trophy,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type RewardsData = {
  points: number;
  level: string;
  nextLevel: string | null;
  pointsToNextLevel: number | null;
  transactions: Array<{
    id: number;
    points: number;
    reason: string;
    referenceId: string | null;
    createdAt: string;
  }>;
};

type ReferralCodeData = {
  code: string;
  usesCount: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS: Record<string, number> = {
  Scout: 0,
  Regular: 100,
  Insider: 500,
  "Pulse Pioneer": 1500,
};

const LEVEL_COLOR: Record<string, string> = {
  Scout: "text-muted-foreground",
  Regular: "text-blue-400",
  Insider: "text-secondary",
  "Pulse Pioneer": "text-amber-400",
};

const LEVEL_RING: Record<string, string> = {
  Scout: "border-muted-foreground/30 bg-muted/30",
  Regular: "border-blue-500/40 bg-blue-500/10",
  Insider: "border-secondary/40 bg-secondary/10",
  "Pulse Pioneer": "border-amber-400/40 bg-amber-400/10",
};

const EARN_WAYS = [
  {
    Icon: Activity,
    label: "Submit a live report",
    pts: "+10 pts",
    desc: "Tell others what's happening at a venue right now",
  },
  {
    Icon: MessageSquare,
    label: "Leave a comment",
    pts: "+5 pts",
    desc: "Share your experience and keep the feed fresh",
  },
  {
    Icon: Bookmark,
    label: "Save a venue",
    pts: "+5 pts",
    desc: "Add a spot to your watchlist",
  },
  {
    Icon: Users,
    label: "Refer a friend",
    pts: "+100 pts",
    desc: "Earn 100 points when they sign up with your code",
  },
  {
    Icon: Gift,
    label: "Use a referral code",
    pts: "+25 pts",
    desc: "One-time welcome bonus when you join via a referral",
  },
] as const;

const REASON_LABEL: Record<string, string> = {
  report: "Submitted a live report",
  comment: "Left a comment",
  watchlist: "Saved a venue",
  referral_gave: "Friend joined with your code",
  referral_received: "Joined with a referral code",
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useRewards() {
  const { isSignedIn } = useAuth();
  return useQuery<RewardsData | null>({
    queryKey: ["me-rewards"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const res = await fetch("/api/me/rewards");
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to load rewards");
      }
      return res.json();
    },
  });
}

function useReferralCode() {
  const { isSignedIn } = useAuth();
  return useQuery<ReferralCodeData | null>({
    queryKey: ["me-referral-code"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const res = await fetch("/api/me/referral-code");
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to load referral code");
      }
      return res.json();
    },
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Rewards() {
  const { isSignedIn } = useAuth();
  const { data: rewards, isLoading } = useRewards();
  const { data: referral } = useReferralCode();
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const level = rewards?.level ?? "Scout";
  const points = rewards?.points ?? 0;
  const nextLevel = rewards?.nextLevel ?? null;
  const pointsToNext = rewards?.pointsToNextLevel ?? null;

  const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const nextThreshold = nextLevel ? (LEVEL_THRESHOLDS[nextLevel] ?? 1500) : null;
  const progressPct = nextThreshold
    ? Math.min(
        100,
        ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
      )
    : 100;

  const handleCopy = () => {
    if (!referral?.code) return;
    navigator.clipboard.writeText(referral.code).then(() => {
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await fetch("/api/me/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to redeem code");
      } else {
        toast.success(`+${data.pointsEarned} points added to your account!`);
        setRedeemCode("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setRedeeming(false);
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-2">
            Sign in to see your rewards
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Earn points by reporting on venues, leaving comments, and referring
            friends to ScenePulse.
          </p>
        </div>
        <SignInButton mode="modal">
          <Button size="lg">Sign in to get started</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="text-primary">Scene</span>Pulse Rewards
        </h1>
        <p className="text-muted-foreground">
          Earn points every time you help keep the pulse feed accurate.
        </p>
      </div>

      {/* ── Level card ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="h-40 bg-card border border-border rounded-lg animate-pulse" />
      ) : (
        <div
          className={`rounded-lg border p-6 ${LEVEL_RING[level] ?? LEVEL_RING.Scout}`}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Current level
              </div>
              <div
                className={`text-2xl font-black tracking-tight ${LEVEL_COLOR[level] ?? "text-foreground"}`}
              >
                {level}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Total points
              </div>
              <div className="text-4xl font-black text-foreground tabular-nums">
                {points.toLocaleString()}
              </div>
            </div>
          </div>

          {nextLevel && pointsToNext != null ? (
            <>
              <div className="relative h-2 bg-background/50 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{level}</span>
                <span className="text-center">
                  {pointsToNext.toLocaleString()} pts to{" "}
                  <span className={LEVEL_COLOR[nextLevel] ?? "text-foreground"}>
                    {nextLevel}
                  </span>
                </span>
                <span>{nextLevel}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono uppercase tracking-wider mt-1">
              <Star className="w-3 h-3" />
              Max level — you&apos;re a Pulse Pioneer
            </div>
          )}
        </div>
      )}

      {/* ── Referral section ────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <h2 className="font-bold text-lg">Refer friends</h2>
          <Badge variant="outline" className="font-mono text-[10px]">
            +100 pts per referral
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Share your code — you earn{" "}
          <span className="text-foreground font-medium">100 points</span> when
          someone signs up using it, and they get{" "}
          <span className="text-foreground font-medium">25 points</span>.
        </p>

        {referral ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background border border-border rounded px-4 py-2.5 font-mono text-lg tracking-[0.3em] font-bold text-center">
              {referral.code}
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="shrink-0 gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy code"}
            </Button>
          </div>
        ) : (
          <div className="h-12 bg-muted rounded animate-pulse" />
        )}

        {referral?.usesCount != null && referral.usesCount > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            Used by {referral.usesCount} friend
            {referral.usesCount !== 1 ? "s" : ""} so far
          </p>
        )}

        {/* Redeem a code */}
        <div className="pt-3 border-t border-border">
          <p className="text-sm font-medium mb-2">Have a referral code?</p>
          <div className="flex gap-2">
            <input
              value={redeemCode}
              onChange={(e) =>
                setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="ENTER CODE"
              maxLength={8}
              className="flex-1 min-w-0 bg-background border border-border rounded px-3 py-2 font-mono text-sm tracking-widest text-center uppercase placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              variant="outline"
              onClick={handleRedeem}
              disabled={redeeming || !redeemCode.trim()}
              className="shrink-0 gap-1"
            >
              {redeeming ? (
                "…"
              ) : (
                <>
                  Redeem <ArrowRight className="w-3 h-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── How to earn ─────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-lg mb-4">How to earn points</h2>
        <div className="space-y-2">
          {EARN_WAYS.map(({ Icon, label, pts, desc }) => (
            <div
              key={label}
              className="flex items-center gap-4 bg-card border border-border/50 rounded-lg px-4 py-3 hover:border-border transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <div className="font-mono text-sm font-bold text-primary shrink-0 tabular-nums">
                {pts}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transaction history ─────────────────────────────────── */}
      {rewards?.transactions && rewards.transactions.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4">Recent activity</h2>
          <div className="space-y-1.5">
            {rewards.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 bg-card border border-border/50 rounded-lg px-4 py-2.5"
              >
                <div
                  className={`font-mono font-bold text-sm shrink-0 w-12 text-right tabular-nums ${
                    t.points > 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {t.points > 0 ? "+" : ""}
                  {t.points}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {REASON_LABEL[t.reason] ?? t.reason}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
