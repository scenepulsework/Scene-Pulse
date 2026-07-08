import { useListVenueReports, useCreateVenueReport, getGetVenueQueryKey, getListVenueReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock } from "lucide-react";
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

export function VenueReports({ venueId }: { venueId: number }) {
  const queryClient = useQueryClient();
  const { data: reports, isLoading } = useListVenueReports(venueId);
  const createReport = useCreateVenueReport();
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reporterName: "",
      crowdLevel: "lively",
      waitTimeMinutes: 0,
      vibeNote: "",
    },
  });

  const onSubmit = (values: z.infer<typeof reportSchema>) => {
    createReport.mutate(
      { venueId, data: values },
      {
        onSuccess: () => {
          form.reset();
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

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'open': return 'text-green-500 border-green-500/20 bg-green-500/10';
      case 'lively': return 'text-secondary border-secondary/20 bg-secondary/10';
      case 'packed': return 'text-destructive border-destructive/20 bg-destructive/10';
      default: return '';
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
        <h3 className="font-bold font-mono uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 mr-2 text-accent" />
          Live Reports
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7 font-mono uppercase tracking-wider"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? "Cancel" : "Add Report"}
        </Button>
      </div>

      {isFormOpen && (
        <div className="p-4 border-b border-border/50 bg-background/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
        ) : reports?.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground font-mono py-8">
            No live reports yet today. Be the first.
          </div>
        ) : (
          reports?.map(report => (
            <div key={report.id} className="relative pl-4 border-l-2 border-border/50 pb-2">
              <div className="absolute w-2 h-2 rounded-full bg-border left-[-5px] top-1.5" />
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-primary">{report.reporterName}</span>
                <span className="text-xs text-muted-foreground font-mono flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                <Badge variant="outline" className={`font-mono text-[10px] uppercase border ${getCrowdColor(report.crowdLevel)}`}>
                  {report.crowdLevel}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/50 bg-background/50">
                  {report.waitTimeMinutes}m wait
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                "{report.vibeNote}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}