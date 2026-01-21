import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  UserCheck, 
  QrCode, 
  Plus,
  TrendingUp,
  Clock,
  MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: promoters } = useQuery({
    queryKey: ["promoters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: qrScans } = useQuery({
    queryKey: ["qr_scans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qr_scans").select("*");
      if (error) throw error;
      return data;
    },
  });

  const upcomingEvents = events?.filter((e) => e.status === "upcoming") || [];
  const totalGuests = guests?.length || 0;
  const activePromoters = promoters?.length || 0;
  const totalScans = qrScans?.length || 0;

  const stats = [
    {
      title: "Upcoming Events",
      value: upcomingEvents.length,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Guests",
      value: totalGuests,
      icon: Users,
      color: "text-violet",
      bgColor: "bg-violet/10",
    },
    {
      title: "Active Promoters",
      value: activePromoters,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "QR Scans",
      value: totalScans,
      icon: QrCode,
      color: "text-purple",
      bgColor: "bg-purple/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to Bali Live Sessions
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-border hover:bg-secondary">
            <Link to="/promoters">
              <UserCheck className="w-4 h-4 mr-2" />
              Add Promoter
            </Link>
          </Button>
          <Button asChild className="gradient-purple text-primary-foreground hover:opacity-90">
            <Link to="/events">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border hover:border-border/80 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Upcoming Events
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to="/events">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming events</p>
                <Button asChild variant="link" className="text-primary mt-2">
                  <Link to="/events">Create your first event</Link>
                </Button>
              </div>
            ) : (
              upcomingEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg gradient-purple-subtle flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {format(new Date(event.date), "MMM")}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {format(new Date(event.date), "dd")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {event.time?.slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">
                      {event.capacity}
                    </span>
                    <p className="text-xs text-muted-foreground">capacity</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Promoters */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              Top Promoters
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to="/promoters">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(promoters?.length || 0) === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No promoters yet</p>
                <Button asChild variant="link" className="text-primary mt-2">
                  <Link to="/promoters">Add your first promoter</Link>
                </Button>
              </div>
            ) : (
              promoters?.slice(0, 5).map((promoter, index) => (
                <div
                  key={promoter.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet flex items-center justify-center text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {promoter.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {promoter.commission_percentage}% commission
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
