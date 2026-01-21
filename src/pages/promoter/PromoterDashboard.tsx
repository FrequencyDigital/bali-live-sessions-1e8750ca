import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePromoter } from "@/hooks/usePromoter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Users, TrendingUp, Wallet, Calendar, DollarSign } from "lucide-react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PromoterDashboard() {
  const { promoter } = usePromoter();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["promoter-stats", promoter?.id],
    queryFn: async () => {
      if (!promoter?.id) return null;

      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Get all-time and last 30 days QR scans
      const [allScans, recentScans] = await Promise.all([
        supabase
          .from("qr_scans")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id),
        supabase
          .from("qr_scans")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id)
          .gte("scanned_at", thirtyDaysAgo),
      ]);

      // Get all-time and last 30 days registrations
      const [allRegistrations, recentRegistrations] = await Promise.all([
        supabase
          .from("guests")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id),
        supabase
          .from("guests")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id)
          .gte("registration_date", thirtyDaysAgo),
      ]);

      // Get registrations by event
      const { data: eventRegistrations } = await supabase
        .from("guests")
        .select("event_id, events(name, date)")
        .eq("promoter_id", promoter.id)
        .not("event_id", "is", null);

      // Group registrations by event
      const eventCounts: Record<string, { name: string; date: string; count: number }> = {};
      eventRegistrations?.forEach((reg: any) => {
        if (reg.event_id && reg.events) {
          if (!eventCounts[reg.event_id]) {
            eventCounts[reg.event_id] = {
              name: reg.events.name,
              date: reg.events.date,
              count: 0,
            };
          }
          eventCounts[reg.event_id].count++;
        }
      });

      return {
        scansAllTime: allScans.count || 0,
        scansLast30Days: recentScans.count || 0,
        registrationsAllTime: allRegistrations.count || 0,
        registrationsLast30Days: recentRegistrations.count || 0,
        eventBreakdown: Object.values(eventCounts).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    },
    enabled: !!promoter?.id,
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ["promoter-commissions", promoter?.id],
    queryFn: async () => {
      if (!promoter?.id) return null;

      const { data } = await supabase
        .from("commission_ledger")
        .select("*, events(name, date)")
        .eq("promoter_id", promoter.id)
        .order("created_at", { ascending: false });

      const totals = {
        pending: 0,
        approved: 0,
        paid: 0,
      };

      data?.forEach((c) => {
        totals[c.status as keyof typeof totals] += Number(c.amount) || 0;
      });

      return { ledger: data || [], totals };
    },
    enabled: !!promoter?.id,
  });

  const isLoading = statsLoading || commissionsLoading;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {promoter?.name}
        </h1>
        <p className="text-muted-foreground">
          Here's your performance overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              QR Scans
            </CardTitle>
            <QrCode className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scansAllTime || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.scansLast30Days || 0} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registrations
            </CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.registrationsAllTime || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.registrationsLast30Days || 0} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                (commissions?.totals.pending || 0) +
                (commissions?.totals.approved || 0) +
                (commissions?.totals.paid || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {commissions?.totals.paid
                ? formatCurrency(commissions.totals.paid) + " paid out"
                : "No payouts yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commission Rate
            </CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoter?.commission_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Default rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Status */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Commission Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  Pending
                </Badge>
              </div>
              <div className="text-xl font-bold text-yellow-500">
                {formatCurrency(commissions?.totals.pending || 0)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Approved
                </Badge>
              </div>
              <div className="text-xl font-bold text-blue-500">
                {formatCurrency(commissions?.totals.approved || 0)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-green-500 text-green-500">
                  Paid
                </Badge>
              </div>
              <div className="text-xl font-bold text-green-500">
                {formatCurrency(commissions?.totals.paid || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations by Event */}
      {stats?.eventBreakdown && stats.eventBreakdown.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Registrations by Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.eventBreakdown.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary">{event.count} registrations</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
