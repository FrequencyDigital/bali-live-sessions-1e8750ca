import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePromoter } from "@/hooks/usePromoter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, QrCode, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function PromoterEvents() {
  const { promoter } = usePromoter();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["promoter-upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "upcoming")
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: myEventQrs } = useQuery({
    queryKey: ["my-event-qrs", promoter?.id],
    queryFn: async () => {
      if (!promoter?.id) return [];
      const { data, error } = await supabase
        .from("promoter_event_qr")
        .select("*")
        .eq("promoter_id", promoter.id);

      if (error) throw error;
      return data;
    },
    enabled: !!promoter?.id,
  });

  const promoteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!promoter?.id) throw new Error("No promoter found");

      // Check if already promoting
      const existing = myEventQrs?.find((q) => q.event_id === eventId);
      if (existing) {
        return existing;
      }

      // Generate unique QR code identifier
      const qrCode = `${promoter.qr_code_identifier}-${eventId.slice(0, 8)}`;

      const { data, error } = await supabase
        .from("promoter_event_qr")
        .insert({
          promoter_id: promoter.id,
          event_id: eventId,
          qr_code_identifier: qrCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-event-qrs"] });
      toast({
        title: "You're now promoting this event!",
        description: "View your QR code and share link.",
      });
      navigate(`/promoter/events/${data.event_id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPromoting = (eventId: string) =>
    myEventQrs?.some((q) => q.event_id === eventId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Event Opportunities</h1>
        <p className="text-muted-foreground">
          Promote upcoming events and earn commissions
        </p>
      </div>

      {events && events.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No upcoming events available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events?.map((event) => (
            <Card
              key={event.id}
              className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.date), "EEE, MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time.slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                  {isPromoting(event.id) && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Promoting
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  {isPromoting(event.id) ? (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/promoter/events/${event.id}`)}
                      className="gap-2"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => promoteEventMutation.mutate(event.id)}
                      disabled={promoteEventMutation.isPending}
                      className="gap-2 gradient-purple"
                    >
                      <QrCode className="w-4 h-4" />
                      Promote this Event
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
