import { useListVenueComments, useCreateVenueComment, getListVenueCommentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const commentSchema = z.object({
  authorName: z.string().min(1, "Required"),
  message: z.string().min(1, "Message required").max(200, "Too long"),
});

export function VenueComments({ venueId }: { venueId: number }) {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useListVenueComments(venueId, {
    query: {
      queryKey: getListVenueCommentsQueryKey(venueId),
      refetchInterval: 10_000,
    },
  });
  const createComment = useCreateVenueComment();
  
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      authorName: "",
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof commentSchema>) => {
    createComment.mutate(
      { venueId, data: values },
      {
        onSuccess: () => {
          form.reset({ ...values, message: "" }); // keep name, clear message
          queryClient.invalidateQueries({ queryKey: getListVenueCommentsQueryKey(venueId) });
        },
        onError: () => {
          toast.error("Failed to post comment");
        }
      }
    );
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/50 bg-muted/20">
        <h3 className="font-bold font-mono uppercase tracking-wider flex items-center">
          <MessageSquare className="w-4 h-4 mr-2 text-primary" />
          The Wire
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground font-mono py-8">
            No chatter yet.
          </div>
        ) : (
          comments?.map(comment => (
            <div key={comment.id} className="text-sm border-b border-border/30 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-foreground">{comment.authorName}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-muted-foreground">{comment.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border/50 bg-background/50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <FormField
                control={form.control}
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
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Message..." {...field} className="h-8 text-xs font-mono bg-card" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={createComment.isPending}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}