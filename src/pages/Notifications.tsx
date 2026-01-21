import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Users, Calendar, Globe } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_type: "all",
    target_value: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guest-nationalities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("nationality")
        .not("nationality", "is", null);
      if (error) throw error;
      const nationalities = [...new Set(data.map((g) => g.nationality).filter(Boolean))];
      return nationalities;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("notifications").insert({
        title: data.title,
        message: data.message,
        target_type: data.target_type,
        target_value: data.target_type !== "all" ? data.target_value : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Notification sent successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      target_type: "all",
      target_value: "",
    });
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate(formData);
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case "all":
        return Users;
      case "event":
        return Calendar;
      case "nationality":
        return Globe;
      default:
        return Users;
    }
  };

  const getTargetLabel = (type: string, value: string | null) => {
    if (type === "all") return "All Guests";
    if (type === "event") {
      const event = events?.find((e) => e.id === value);
      return event?.name || value;
    }
    return value || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Send announcements and updates to your guests
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-primary-foreground hover:opacity-90">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Send New Notification
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="New Event Announcement"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Your message here..."
                  required
                  rows={4}
                  className="bg-input border-border resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={formData.target_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, target_type: value, target_value: "" })
                  }
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Guests</SelectItem>
                    <SelectItem value="event">By Event</SelectItem>
                    <SelectItem value="nationality">By Nationality</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_type === "event" && (
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  <Select
                    value={formData.target_value}
                    onValueChange={(value) =>
                      setFormData({ ...formData, target_value: value })
                    }
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events?.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.target_type === "nationality" && (
                <div className="space-y-2">
                  <Label>Select Nationality</Label>
                  <Select
                    value={formData.target_value}
                    onValueChange={(value) =>
                      setFormData({ ...formData, target_value: value })
                    }
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {(guests as string[])?.map((nationality) => (
                        <SelectItem key={nationality} value={nationality}>
                          {nationality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-gold text-primary-foreground">
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : notifications?.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No notifications sent yet
              </h3>
              <p className="text-muted-foreground">
                Send your first notification to engage with guests
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications?.map((notification) => {
                const Icon = getTargetIcon(notification.target_type);
                return (
                  <div
                    key={notification.id}
                    className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                        <Icon className="w-4 h-4" />
                        <span>
                          {getTargetLabel(
                            notification.target_type,
                            notification.target_value
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Sent {format(new Date(notification.sent_at), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
