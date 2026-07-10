import {
  useListVenueReports,
  useCreateVenueReport,
  useListVenueComments,
  useCreateVenueComment,
  getGetVenueQueryKey,
  getListVenueReportsQueryKey,
  getListVenueCommentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const reportSchema = z.object({
  reporterName: z.string().min(1, "Name is required"),
  crowdLevel: z.enum(['open', 'lively', 'packed']),
  waitTimeMinutes: z.coerce.number().min(0, "Must be >= 0"),
  vibeNote: z.string().min(1, "Note is required").max(140, "Too long"),
});

const commentSchema = z.object({
  authorName: z.string().min(1, "Required"),
  message: z.string().min(1, "Message required").max(200, "Too long"),
});

type FeedItem =
  | { type: "report"; id: string; createdAt: string; reporterName: string; crowdLevel: string; waitTimeMinutes: number; vibeNote: string }
  | { type: "comment"; id: string; createdAt: string; authorName: string; message: string };

export function VenueReports({ venueId }: { venueId: number }) {
  const queryClient = useQueryClient();
  const { data: reports, isLoading: reportsLoading } = useListVenueReports(venueId, {
    query: { queryKey: getListVenueReportsQueryKey(venueId) },
  });
  const { data: comments, isLoading: commentsLoading } = useListVenueComments(venueId, {
    query: {
      queryKey: getListVenueCommentsQueryKey(venueId),
      refetchInterval: 10_000,
    },
  });
  const createReport = useCreateVenueReport();
  const createComment = useCreateVenueComment();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reporterName: "",
      crowdLevel: "lively",
      waitTimeMinutes: 0,
      vibeNote: "",
    },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      authorName: "",
      message: "",
    },
  });

  const onSubmitReport = (values: z.infer<typeof reportSchema>) => {
    createReport.mutate(
      { venueId, data: values },
      {
        onSuccess: () => {
          reportForm.reset();
          setIsFormOpen(false);
          toast.success("Live report submitted!");
          queryClient.invalidateQueries({ queryKey: getListVenueReportsQueryKey(venueId) });
          queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(venueId) });
        },
        onError: () => {
          toast.error("Failed to submit report");
        }
      }
    );
  };

  const onSubmitComment = (values: z.infer<typeof commentSchema>) => {
    createComment.mutate(
      { venueId, data: values },
      {
        onSuccess: () => {
          commentForm.reset({ ...values, message: "" }); // keep name, clear message
          queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) });
        },
        onError: () => {
          toast.error("Failed to post comment");
        }
      }
    );
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'open': return 'text-green-500 border-green-500/20 bg-green-500/10';
      case 'lively': return 'text-secondary border-secondary/20 bg-secondary/10';
      case 'packed': return 'text-destructive border-destructive/20 bg-destructive/10';
      default: return '';
    }
  };

  const isLoading = reportsLoading || commentsLoading;

  const feed: FeedItem[] = useMemo(() => {
    const reportItems: FeedItem[] = (reports ?? []).map((r) => ({
      type: "report",
      id: `report-${r.id}`,
      createdAt: r.createdAt,
      reporterName: r.reporterName,
      crowdLevel: r.crowdLevel,
      waitTimeMinutes: r.waitTimeMinutes,
      vibeNote: r.vibeNote,
    }));
    const commentItems: FeedItem[] = (comments ?? []).map((c) => ({
      type: "comment",
      id: `comment-${c.id}`,
      createdAt: c.createdAt,
      authorName: c.authorName,
      message: c.message,
    }));
    return [...reportItems, ...commentItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [reports, comments]);

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden flex flex-col" data-testid="venue-reports">
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
        <h3 className="font-bold font-mono uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 mr-2 text-accent" />
          Live Reports
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 font-mono uppercase tracking-wider"
          data-testid="button-toggle-report-form"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? "Cancel" : "Add Report"}
        </Button>
      </div>

      {isFormOpen && (
        <div className="p-4 border-b border-border/50 bg-background/50">
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(onSubmitReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="reporterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Your Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="NightOwl99" {...field} className="h-8 font-mono text-sm bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reportForm.control}
                name="crowdLevel"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Crowd Level</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-2"
                      >
                        <FormItem className="flex items-center space-x-0 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="open" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="font-normal font-mono text-xs uppercase cursor-pointer rounded-md border border-border/50 px-2 py-1 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:text-green-500 hover:bg-muted/50">
                            Open
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-0 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="lively" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="font-normal font-mono text-xs uppercase cursor-pointer rounded-md border border-border/50 px-2 py-1 peer-data-[state=checked]:border-secondary peer-data-[state=checked]:text-secondary hover:bg-muted/50">
                            Lively
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-0 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="packed" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="font-normal font-mono text-xs uppercase cursor-pointer rounded-md border border-border/50 px-2 py-1 peer-data-[state=checked]:border-destructive peer-data-[state=checked]:text-destructive hover:bg-muted/50">
                            Packed
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reportForm.control}
                name="waitTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Wait Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-8 font-mono text-sm bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reportForm.control}
                name="vibeNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Vibe Check</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Line moving fast. Good energy." {...field} className="resize-none h-16 font-mono text-sm bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full font-mono uppercase tracking-wider text-xs" disabled={createReport.isPending}>
                {createReport.isPending ? "Submitting..." : "Send Pulse"}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground font-mono py-8">
            No activity yet. Be the first to check in.
          </div>
        ) : (
          feed.map((item) =>
            item.type === "report" ? (
              <div key={item.id} className="relative pl-4 border-l-2 border-border/50 pb-2" data-testid={`feed-report-${item.id}`}>
                <div className="absolute w-2 h-2 rounded-full bg-border left-[-5px] top-1.5" />
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-primary">{item.reporterName}</span>
                  <span className="text-xs text-muted-foreground font-mono flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className={`font-mono text-[10px] uppercase border ${getCrowdColor(item.crowdLevel)}`}>
                    {item.crowdLevel}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/50 bg-background/50">
                    {item.waitTimeMinutes}m wait
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  "{item.vibeNote}"
                </p>
              </div>
            ) : (
              <div key={item.id} className="relative pl-4 border-l-2 border-border/30 pb-2" data-testid={`feed-comment-${item.id}`}>
                <div className="absolute w-2 h-2 rounded-full bg-primary/60 left-[-5px] top-1.5" />
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="font-bold text-sm text-foreground">{item.authorName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.message}</p>
              </div>
            ),
          )
        )}
      </div>

      <div className="p-3 border-t border-border/50 bg-background/50">
        <Form {...commentForm}>
          <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <FormField
                control={commentForm.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormControl>
                      <Input placeholder="Name" {...field} className="h-8 text-xs font-mono bg-card" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={commentForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Drop a comment..." {...field} className="h-8 text-xs font-mono bg-card" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={createComment.isPending} data-testid="button-send-comment">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
