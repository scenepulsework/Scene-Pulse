import { useState } from "react";
import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOperatorVenues,
  getListOperatorVenuesQueryKey,
  useClaimVenue,
  useUpdateVenue,
  getGetVenueQueryKey,
  getListVenuesQueryKey,
  type Venue,
  type VenueUpdate,
} from "@workspace/api-client-react";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, LogOut, MapPin, Pencil, ShieldCheck, X } from "lucide-react";

const CATEGORIES = ["bar", "restaurant", "retail", "cafe", "experience"] as const;
const NOISE_LEVELS = ["quiet", "moderate", "loud"] as const;

function ClaimForm() {
  const [venueId, setVenueId] = useState("");
  const queryClient = useQueryClient();
  const claimMutation = useClaimVenue({
    mutation: {
      onSuccess: () => {
        toast.success("Venue claimed — it now appears in your dashboard");
        setVenueId("");
        queryClient.invalidateQueries({ queryKey: getListOperatorVenuesQueryKey() });
      },
      onError: (error: any) => {
        const status = error?.status;
        if (status === 409) toast.error("This venue is already claimed by another operator");
        else if (status === 404) toast.error("No venue found with that ID");
        else toast.error("Could not claim venue — try again");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(venueId);
    if (!Number.isInteger(id) || id <= 0) {
      toast.error("Enter a valid venue ID");
      return;
    }
    claimMutation.mutate({ id });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-lg p-6">
      <h2 className="font-bold font-mono uppercase tracking-wider mb-2 flex items-center">
        <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
        Claim your venue
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Enter your venue's ID (shown in the venue page URL, e.g. /venue/<span className="font-mono">12</span>) to claim it and manage its listing.
      </p>
      <div className="flex gap-3">
        <Input
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          placeholder="Venue ID"
          inputMode="numeric"
          className="max-w-[160px]"
        />
        <Button type="submit" disabled={claimMutation.isPending} className="font-mono uppercase tracking-wider text-xs">
          {claimMutation.isPending ? "Claiming..." : "Claim venue"}
        </Button>
      </div>
    </form>
  );
}

function EditVenueForm({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [form, setForm] = useState<Required<VenueUpdate>>({
    name: venue.name,
    address: venue.address,
    category: venue.category,
    bestFor: venue.bestFor,
    coverCost: venue.coverCost,
    noiseLevel: venue.noiseLevel,
  });
  const [tagsText, setTagsText] = useState(venue.bestFor.join(", "));
  const queryClient = useQueryClient();

  const updateMutation = useUpdateVenue({
    mutation: {
      onSuccess: () => {
        toast.success("Listing updated");
        queryClient.invalidateQueries({ queryKey: getListOperatorVenuesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(venue.id) });
        queryClient.invalidateQueries({ queryKey: getListVenuesQueryKey() });
        onClose();
      },
      onError: () => toast.error("Could not save changes — try again"),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.coverCost.trim()) {
      toast.error("Name, address, and cover cost are required");
      return;
    }
    updateMutation.mutate({
      id: venue.id,
      data: {
        ...form,
        name: form.name.trim(),
        address: form.address.trim(),
        coverCost: form.coverCost.trim(),
        bestFor: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border/50 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as (typeof CATEGORIES)[number] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Noise level</Label>
          <Select value={form.noiseLevel} onValueChange={(v) => setForm({ ...form, noiseLevel: v as (typeof NOISE_LEVELS)[number] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {NOISE_LEVELS.map((n) => <SelectItem key={n} value={n} className="capitalize">{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cover cost</Label>
          <Input value={form.coverCost} onChange={(e) => setForm({ ...form, coverCost: e.target.value })} placeholder="e.g. No cover, $10 after 10pm" />
        </div>
        <div className="space-y-1.5">
          <Label>Best for (comma-separated)</Label>
          <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="date night, live music, patio" />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={updateMutation.isPending} className="font-mono uppercase tracking-wider text-xs">
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} className="font-mono uppercase tracking-wider text-xs">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ClaimedVenueCard({ venue }: { venue: Venue }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-card border border-border/50 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-mono uppercase tracking-wider">{venue.category}</Badge>
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/40">Claimed</Badge>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">{venue.name}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" />{venue.address}, {venue.city}</span>
            <span>Cover: {venue.coverCost}</span>
            <span className="capitalize">Noise: {venue.noiseLevel}</span>
          </div>
          {venue.bestFor.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {venue.bestFor.map((tag) => (
                <Badge key={tag} variant="outline" className="font-mono text-[10px] uppercase">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/venue/${venue.id}`}>
            <Button variant="outline" size="sm" className="font-mono uppercase tracking-wider text-xs">View</Button>
          </Link>
          <Button
            variant={editing ? "ghost" : "default"}
            size="sm"
            onClick={() => setEditing((v) => !v)}
            className="font-mono uppercase tracking-wider text-xs"
          >
            {editing ? <><X className="w-3.5 h-3.5 mr-1" />Close</> : <><Pencil className="w-3.5 h-3.5 mr-1" />Edit details</>}
          </Button>
        </div>
      </div>
      {editing && <EditVenueForm venue={venue} onClose={() => setEditing(false)} />}
    </div>
  );
}

function DashboardContent() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: venues, isLoading } = useListOperatorVenues({
    query: { queryKey: getListOperatorVenuesQueryKey() },
  });

  return (
    <div className="container mx-auto px-4 pb-16 space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="text-foreground font-medium">{user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? "operator"}</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
          className="font-mono uppercase tracking-wider text-xs text-muted-foreground"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign out
        </Button>
      </div>

      <ClaimForm />

      <div>
        <h2 className="font-bold font-mono uppercase tracking-wider mb-4 flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-secondary" />
          Your venues
        </h2>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !venues || venues.length === 0 ? (
          <div className="bg-muted/30 border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            You haven't claimed any venues yet. Claim one above to start managing its listing.
          </div>
        ) : (
          <div className="space-y-4">
            {venues.map((v) => <ClaimedVenueCard key={v.id} venue={v} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="Operator Dashboard"
        blurb="Claim your venue and keep your listing accurate — name, address, category, tags, cover, and noise."
      />
      <Show when="signed-in">
        <DashboardContent />
      </Show>
      <Show when="signed-out">
        <div className="container mx-auto px-4 pb-16 max-w-xl">
          <div className="bg-card border border-border/50 rounded-lg p-8 text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Sign in with your operator account to claim and manage your venue's listing.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/sign-in">
                <Button className="font-mono uppercase tracking-wider text-xs">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" className="font-mono uppercase tracking-wider text-xs">Create account</Button>
              </Link>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
