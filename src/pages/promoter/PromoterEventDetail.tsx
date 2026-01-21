import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePromoter } from "@/hooks/usePromoter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Users,
  UserCheck,
  Copy,
  Download,
  Share2,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ShareInviteDialog } from "@/components/promoter/ShareInviteDialog";

export default function PromoterEventDetail() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { promoter } = usePromoter();
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: eventQr, isLoading: qrLoading } = useQuery({
    queryKey: ["promoter-event-qr", promoter?.id, eventId],
    queryFn: async () => {
      if (!promoter?.id || !eventId) return null;
      const { data, error } = await supabase
        .from("promoter_event_qr")
        .select("*")
        .eq("promoter_id", promoter.id)
        .eq("event_id", eventId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!promoter?.id && !!eventId,
  });

  const { data: stats } = useQuery({
    queryKey: ["promoter-event-stats", promoter?.id, eventId],
    queryFn: async () => {
      if (!promoter?.id || !eventId) return null;

      const [scans, registrations, attended] = await Promise.all([
        supabase
          .from("qr_scans")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id)
          .eq("event_id", eventId),
        supabase
          .from("guests")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id)
          .eq("event_id", eventId),
        supabase
          .from("guests")
          .select("id", { count: "exact", head: true })
          .eq("promoter_id", promoter.id)
          .eq("event_id", eventId)
          .eq("attended", true),
      ]);

      return {
        scans: scans.count || 0,
        registrations: registrations.count || 0,
        attended: attended.count || 0,
      };
    },
    enabled: !!promoter?.id && !!eventId,
  });

  const { data: commission } = useQuery({
    queryKey: ["promoter-event-commission", promoter?.id, eventId],
    queryFn: async () => {
      if (!promoter?.id || !eventId) return null;
      const { data } = await supabase
        .from("commission_ledger")
        .select("*")
        .eq("promoter_id", promoter.id)
        .eq("event_id", eventId)
        .maybeSingle();
      return data;
    },
    enabled: !!promoter?.id && !!eventId,
  });

  // Short branded URL format: /guestlist/{qr_code_identifier}
  const registrationUrl = eventQr
    ? `${window.location.origin}/guestlist/${eventQr.qr_code_identifier}`
    : "";

  // Generate QR code image
  useEffect(() => {
    if (registrationUrl) {
      QRCode.toDataURL(registrationUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#ffffff", light: "#00000000" },
      }).then(setQrDataUrl);
    }
  }, [registrationUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    toast({ title: "Link copied!", description: "Share it with potential guests." });
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${event?.name?.replace(/\s+/g, "-")}-${promoter?.name?.replace(/\s+/g, "-")}.png`;
    link.href = qrDataUrl;
    link.click();
    toast({ title: "QR code downloaded!" });
  };

  const copyPromoCaption = () => {
    const caption = `🎉 Join us at ${event?.name}!\n📅 ${event?.date ? format(new Date(event.date), "EEEE, MMMM d") : ""}\n📍 ${event?.venue}\n\n🎟️ Register here: ${registrationUrl}\n\nSee you there! 🎶`;
    navigator.clipboard.writeText(caption);
    toast({ title: "Caption copied!", description: "Ready to share on social media." });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const isLoading = eventLoading || qrLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!event || !eventQr) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Event or QR code not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Button>

      {/* Event Info */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">{event.name}</CardTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
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
        </CardHeader>
        {event.description && (
          <CardContent>
            <p className="text-muted-foreground">{event.description}</p>
          </CardContent>
        )}
      </Card>

      {/* QR Code & Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Your Event QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrDataUrl && (
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-xl mb-4">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-4 font-mono">
              {eventQr.qr_code_identifier}
            </p>
            <div className="flex flex-wrap gap-2 w-full">
              <Button onClick={downloadQR} variant="outline" className="flex-1 gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={copyLink} variant="outline" className="flex-1 gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share & Invite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share your guestlist link with friends. Anyone who registers is added to your list.
            </p>
            
            <ShareInviteDialog
              eventName={event.name}
              eventDate={format(new Date(event.date), "EEEE, MMMM d")}
              venue={event.venue}
              guestlistUrl={registrationUrl}
              promoterName={promoter?.name || ""}
              trigger={
                <Button className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Invite
                </Button>
              }
            />

            <div>
              <label className="text-sm text-muted-foreground">Direct Link</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={registrationUrl}
                  readOnly
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono truncate"
                />
                <Button onClick={copyLink} size="icon" variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={copyPromoCaption} variant="secondary" className="w-full gap-2">
              <Share2 className="w-4 h-4" />
              Copy Promo Caption
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <QrCode className="w-4 h-4" />
              <span className="text-sm">Scans</span>
            </div>
            <p className="text-2xl font-bold">{stats?.scans || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Registrations</span>
            </div>
            <p className="text-2xl font-bold">{stats?.registrations || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">Checked In</span>
            </div>
            <p className="text-2xl font-bold">{stats?.attended || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Commission</span>
            </div>
            <p className="text-2xl font-bold">
              {commission ? formatCurrency(Number(commission.amount)) : "IDR 0"}
            </p>
            {commission && (
              <Badge
                variant="outline"
                className={
                  commission.status === "paid"
                    ? "border-green-500 text-green-500"
                    : commission.status === "approved"
                    ? "border-blue-500 text-blue-500"
                    : "border-yellow-500 text-yellow-500"
                }
              >
                {commission.status}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
