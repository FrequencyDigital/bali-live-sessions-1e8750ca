import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePromoter } from "@/hooks/usePromoter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { QrCode, Copy, Download, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export default function PromoterQRCodes() {
  const { promoter } = usePromoter();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [masterQrDataUrl, setMasterQrDataUrl] = useState<string>("");

  const { data: eventQrs, isLoading } = useQuery({
    queryKey: ["my-all-event-qrs", promoter?.id],
    queryFn: async () => {
      if (!promoter?.id) return [];
      const { data, error } = await supabase
        .from("promoter_event_qr")
        .select("*, events(name, date, status)")
        .eq("promoter_id", promoter.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!promoter?.id,
  });

  const masterQrUrl = promoter
    ? `${window.location.origin}/register?promoter=${promoter.qr_code_identifier}`
    : "";

  useEffect(() => {
    if (masterQrUrl) {
      QRCode.toDataURL(masterQrUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#ffffff", light: "#00000000" },
      }).then(setMasterQrDataUrl);
    }
  }, [masterQrUrl]);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  };

  const downloadQR = async (url: string, name: string) => {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const link = document.createElement("a");
    link.download = `qr-${name.replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
    toast({ title: "QR code downloaded!" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your QR Codes</h1>
        <p className="text-muted-foreground">
          Download and share your promotional QR codes
        </p>
      </div>

      {/* Master QR Code */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Master QR Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use this code for general promotion. Guests will choose an event when registering.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {masterQrDataUrl && (
              <div className="bg-card p-4 rounded-xl">
                <img src={masterQrDataUrl} alt="Master QR Code" className="w-40 h-40" />
              </div>
            )}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="text-sm text-muted-foreground">Your Code</label>
                <p className="font-mono text-lg">{promoter?.qr_code_identifier}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => downloadQR(masterQrUrl, `master-${promoter?.name || "qr"}`)}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button onClick={() => copyLink(masterQrUrl)} variant="outline" className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event-Specific QR Codes */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Event-Specific QR Codes</h2>
        {eventQrs && eventQrs.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No event QR codes yet
              </p>
              <Button onClick={() => navigate("/promoter/events")} variant="outline">
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {eventQrs?.map((qr: any) => {
              const eventUrl = `${window.location.origin}/register?promoter=${qr.qr_code_identifier}&event=${qr.event_id}`;
              return (
                <Card key={qr.id} className="bg-card/50 border-border/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{qr.events?.name || "Unknown Event"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {qr.events?.date && (
                            <span>{format(new Date(qr.events.date), "MMM d, yyyy")}</span>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              qr.events?.status === "upcoming"
                                ? "border-green-500/50 text-green-500"
                                : "border-muted-foreground/50"
                            }
                          >
                            {qr.events?.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => downloadQR(eventUrl, qr.events?.name || "event")}
                        variant="ghost"
                        size="icon"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => copyLink(eventUrl)} variant="ghost" size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => navigate(`/promoter/events/${qr.event_id}`)}
                        variant="ghost"
                        size="icon"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
