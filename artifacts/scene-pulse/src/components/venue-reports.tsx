import {
  useListVenueReports,
  useCreateVenueReport,
  useListVenueComments,
  useCreateVenueComment,
  likeComment,
  dislikeComment,
  getGetVenueQueryKey,
  getListVenueReportsQueryKey,
  getListVenueCommentsQueryKey,
  Comment,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getVoterId } from "@/lib/voter-id";
import { useUser } from "@clerk/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, MessageSquare, Send, ThumbsUp, ThumbsDown, CornerDownRight, ChevronDown, ChevronUp } from "lucide-react";
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

type ReportItem = {
  type: "report";
  id: string;
  numId: number;
  createdAt: string;
  reporterName: string;
  crowdLevel: string;
  waitTimeMinutes: number;
  vibeNote: string;
};

type CommentItem = {
  type: "comment";
  id: string;
  numId: number;
  createdAt: string;
  authorName: string;
  message: string;
  likes: number;
  dislikes: number;
  parentCommentId: number | null;
  replies: Comment[];
};

type FeedItem = ReportItem | CommentItem;

export function VenueReports({ venueId }: { venueId: number }) {
  const queryClient = useQueryClient();
  const { user, isSignedIn } = useUser();
  const displayName =
    user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "";
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
  const likeCommentMutation = useMutation({
    mutationFn: ({ venueId: vid, commentId }: { venueId: number; commentId: number }) =>
      likeComment(vid, commentId, { headers: { "X-Voter-ID": getVoterId() } }),
  });
  const dislikeCommentMutation = useMutation({
    mutationFn: ({ venueId: vid, commentId }: { venueId: number; commentId: number }) =>
      dislikeComment(vid, commentId, { headers: { "X-Voter-ID": getVoterId() } }),
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reporterName: "", crowdLevel: "lively", waitTimeMinutes: 0, vibeNote: "" },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { authorName: "", message: "" },
  });

  const replyForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { authorName: "", message: "" },
  });

  // Signed-in users post under their account display name — no manual name entry.
  useEffect(() => {
    if (isSignedIn && displayName) {
      reportForm.setValue("reporterName", displayName);
      commentForm.setValue("authorName", displayName);
      replyForm.setValue("authorName", displayName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, displayName]);

  const onSubmitReport = (values: z.infer<typeof reportSchema>) => {
    const data = isSignedIn && displayName ? { ...values, reporterName: displayName } : values;
    createReport.mutate(
      { venueId, data },
      {
        onSuccess: () => {
          // Preserve the signed-in display name across resets — the field is hidden
          // for signed-in users, so clearing it would break repeat submissions.
          reportForm.reset({
            reporterName: isSignedIn && displayName ? displayName : "",
            crowdLevel: "lively",
            waitTimeMinutes: 0,
            vibeNote: "",
          });
          setIsFormOpen(false);
          toast.success("Live report submitted!");
          queryClient.invalidateQueries({ queryKey: getListVenueReportsQueryKey(venueId) });
          queryClient.invalidateQueries({ queryKey: getGetVenueQueryKey(venueId) });
        },
        onError: () => toast.error("Failed to submit report"),
      }
    );
  };

  const onSubmitComment = (values: z.infer<typeof commentSchema>) => {
    const data = isSignedIn && displayName ? { ...values, authorName: displayName } : values;
    createComment.mutate(
      { venueId, data },
      {
        onSuccess: () => {
          commentForm.reset({ ...data, message: "" });
          queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) });
        },
        onError: () => toast.error("Failed to post comment"),
      }
    );
  };

  const onSubmitReply = (parentId: number, values: z.infer<typeof commentSchema>) => {
    const data = isSignedIn && displayName ? { ...values, authorName: displayName } : values;
    createComment.mutate(
      { venueId, data: { ...data, parentCommentId: parentId } },
      {
        onSuccess: () => {
          replyForm.reset({
            authorName: isSignedIn && displayName ? displayName : "",
            message: "",
          });
          setReplyingToId(null);
          setExpandedReplies((prev) => new Set([...prev, parentId]));
          queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) });
        },
        onError: () => toast.error("Failed to post reply"),
      }
    );
  };

  const handleLike = (commentId: number) => {
    if (likedIds.has(commentId) || dislikedIds.has(commentId)) return;
    setLikedIds((prev) => new Set([...prev, commentId]));
    likeCommentMutation.mutate(
      { venueId, commentId },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) }),
        onError: () => setLikedIds((prev) => { const n = new Set(prev); n.delete(commentId); return n; }),
      }
    );
  };

  const handleDislike = (commentId: number) => {
    if (likedIds.has(commentId) || dislikedIds.has(commentId)) return;
    setDislikedIds((prev) => new Set([...prev, commentId]));
    dislikeCommentMutation.mutate(
      { venueId, commentId },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) }),
        onError: () => setDislikedIds((prev) => { const n = new Set(prev); n.delete(commentId); return n; }),
      }
    );
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const n = new Set(prev);
      if (n.has(commentId)) n.delete(commentId); else n.add(commentId);
      return n;
    });
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

  const repliesByParent = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const c of comments ?? []) {
      if (c.parentCommentId != null) {
        const list = map.get(c.parentCommentId) ?? [];
        list.push(c);
        map.set(c.parentCommentId, list);
      }
    }
    return map;
  }, [comments]);

  const feed: FeedItem[] = useMemo(() => {
    const reportItems: FeedItem[] = (reports ?? []).map((r) => ({
      type: "report",
      id: `report-${r.id}`,
      numId: r.id,
      createdAt: r.createdAt,
      reporterName: r.reporterName,
      crowdLevel: r.crowdLevel,
      waitTimeMinutes: r.waitTimeMinutes,
      vibeNote: r.vibeNote,
    }));
    const topLevelComments: FeedItem[] = (comments ?? [])
      .filter((c) => c.parentCommentId == null)
      .map((c) => ({
        type: "comment",
        id: `comment-${c.id}`,
        numId: c.id,
        createdAt: c.createdAt,
        authorName: c.authorName,
        message: c.message,
        likes: c.likes,
        dislikes: c.dislikes,
        parentCommentId: c.parentCommentId ?? null,
        replies: repliesByParent.get(c.id) ?? [],
      }));
    return [...reportItems, ...topLevelComments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reports, comments, repliesByParent]);

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
              {!isSignedIn && (
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
              )}
              {isSignedIn && (
                <p className="text-xs font-mono text-muted-foreground">
                  Reporting as <span className="text-primary font-bold">{displayName}</span>
                </p>
              )}
              <FormField
                control={reportForm.control}
                name="crowdLevel"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Crowd Level</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-2">
                        {(['open', 'lively', 'packed'] as const).map((v) => (
                          <FormItem key={v} className="flex items-center space-x-0 space-y-0">
                            <FormControl><RadioGroupItem value={v} className="peer sr-only" /></FormControl>
                            <FormLabel className={`font-normal font-mono text-xs uppercase cursor-pointer rounded-md border border-border/50 px-2 py-1 hover:bg-muted/50 peer-data-[state=checked]:border-${v === 'open' ? 'green-500' : v === 'lively' ? 'secondary' : 'destructive'} peer-data-[state=checked]:text-${v === 'open' ? 'green-500' : v === 'lively' ? 'secondary' : 'destructive'}`}>
                              {v}
                            </FormLabel>
                          </FormItem>
                        ))}
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
                    <FormControl><Input type="number" {...field} className="h-8 font-mono text-sm bg-card" /></FormControl>
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
                    <FormControl><Textarea placeholder="Line moving fast. Good energy." {...field} className="resize-none h-16 font-mono text-sm bg-card" /></FormControl>
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

      <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
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
                <p className="text-sm text-muted-foreground leading-snug">"{item.vibeNote}"</p>
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
                <p className="text-sm text-muted-foreground mb-2">{item.message}</p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLike(item.numId)}
                    disabled={likedIds.has(item.numId) || dislikedIds.has(item.numId)}
                    className={`flex items-center gap-1 text-[11px] font-mono transition-colors rounded px-1.5 py-0.5 ${
                      likedIds.has(item.numId)
                        ? "text-green-500 bg-green-500/10"
                        : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10 disabled:opacity-40"
                    }`}
                    data-testid={`like-comment-${item.numId}`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {item.likes + (likedIds.has(item.numId) ? 1 : 0)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDislike(item.numId)}
                    disabled={likedIds.has(item.numId) || dislikedIds.has(item.numId)}
                    className={`flex items-center gap-1 text-[11px] font-mono transition-colors rounded px-1.5 py-0.5 ${
                      dislikedIds.has(item.numId)
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    }`}
                    data-testid={`dislike-comment-${item.numId}`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    {item.dislikes + (dislikedIds.has(item.numId) ? 1 : 0)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingToId(replyingToId === item.numId ? null : item.numId)}
                    className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors rounded px-1.5 py-0.5"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    Reply
                  </button>
                  {item.replies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleReplies(item.numId)}
                      className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors ml-auto rounded px-1.5 py-0.5"
                    >
                      {expandedReplies.has(item.numId) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {item.replies.length} {item.replies.length === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>

                {replyingToId === item.numId && (
                  <div className="mt-2 pl-3 border-l border-primary/30">
                    <Form {...replyForm}>
                      <form
                        onSubmit={replyForm.handleSubmit((vals) => onSubmitReply(item.numId, vals))}
                        className="flex gap-2"
                      >
                        {!isSignedIn && (
                          <FormField
                            control={replyForm.control}
                            name="authorName"
                            render={({ field }) => (
                              <FormItem className="w-1/3">
                                <FormControl>
                                  <Input placeholder="Name" {...field} className="h-7 text-xs font-mono bg-card" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={replyForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder={`Reply to ${item.authorName}...`} {...field} className="h-7 text-xs font-mono bg-card" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" size="icon" className="h-7 w-7 shrink-0" disabled={createComment.isPending}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {expandedReplies.has(item.numId) && item.replies.length > 0 && (
                  <div className="mt-2 pl-3 border-l border-border/20 space-y-2">
                    {item.replies
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((reply) => (
                        <div key={reply.id} className="text-sm">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-xs text-foreground">{reply.authorName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{reply.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleLike(reply.id)}
                              disabled={likedIds.has(reply.id) || dislikedIds.has(reply.id)}
                              className={`flex items-center gap-1 text-[10px] font-mono transition-colors rounded px-1 py-0.5 ${
                                likedIds.has(reply.id) ? "text-green-500" : "text-muted-foreground hover:text-green-500 disabled:opacity-40"
                              }`}
                            >
                              <ThumbsUp className="w-2.5 h-2.5" />
                              {reply.likes + (likedIds.has(reply.id) ? 1 : 0)}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDislike(reply.id)}
                              disabled={likedIds.has(reply.id) || dislikedIds.has(reply.id)}
                              className={`flex items-center gap-1 text-[10px] font-mono transition-colors rounded px-1 py-0.5 ${
                                dislikedIds.has(reply.id) ? "text-destructive" : "text-muted-foreground hover:text-destructive disabled:opacity-40"
                              }`}
                            >
                              <ThumbsDown className="w-2.5 h-2.5" />
                              {reply.dislikes + (dislikedIds.has(reply.id) ? 1 : 0)}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>

      <div className="p-3 border-t border-border/50 bg-background/50">
        <Form {...commentForm}>
          <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="flex flex-col gap-2">
            <div className="flex gap-2">
              {!isSignedIn && (
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
              )}
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
