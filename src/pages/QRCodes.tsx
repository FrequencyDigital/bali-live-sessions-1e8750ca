import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QRCodes() {
  const { toast } = useToast();

  const { data: promoters, isLoading } = useQuery({
    queryKey: ["promoters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "upcoming")
        .order("date");
      if (error) throw error;
      return data;
    },
  });

  const generateQRUrl = (promoterId: string, qrCode: string, eventId?: string) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      promoter: qrCode,
      ...(eventId && { event: eventId }),
    });
    return `${baseUrl}/register?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copied to clipboard" });
  };

  const downloadQR = (promoterName: string, qrCode: string) => {
    // Create a simple QR code using canvas
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple QR placeholder - in production, use a proper QR library
    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(promoterName, size / 2, size / 2 - 10);
    ctx.font = "12px monospace";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(qrCode, size / 2, size / 2 + 20);

    const link = document.createElement("a");
    link.download = `qr-${promoterName.toLowerCase().replace(/\s/g, "-")}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast({ title: "QR Code downloaded" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage promoter QR codes for event registration
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {promoters?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active QR Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-coral" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {events?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : promoters?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <QrCode className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No QR codes available
            </h3>
            <p className="text-muted-foreground">
              Add promoters to generate QR codes for event registration
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promoters?.map((promoter) => (
            <Card key={promoter.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-coral flex items-center justify-center text-primary-foreground font-bold">
                      {promoter.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">
                        {promoter.name}
                      </CardTitle>
                      <Badge variant="outline" className="border-success/30 text-success text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Display */}
                <div className="aspect-square bg-gradient-to-br from-muted to-secondary rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-coral/5" />
                  <div className="relative z-10 text-center p-4">
                    <QrCode className="w-24 h-24 text-primary mx-auto mb-3" />
                    <p className="text-xs font-mono text-muted-foreground">
                      {promoter.qr_code_identifier}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border"
                      onClick={() =>
                        copyToClipboard(
                          generateQRUrl(promoter.id, promoter.qr_code_identifier)
                        )
                      }
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border"
                      onClick={() =>
                        downloadQR(promoter.name, promoter.qr_code_identifier)
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  {/* Event-specific links */}
                  {events && events.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Event-specific links:
                      </p>
                      <div className="space-y-1.5">
                        {events.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() =>
                              copyToClipboard(
                                generateQRUrl(
                                  promoter.id,
                                  promoter.qr_code_identifier,
                                  event.id
                                )
                              )
                            }
                            className="w-full text-left px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors flex items-center justify-between"
                          >
                            <span className="truncate">{event.name}</span>
                            <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
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
