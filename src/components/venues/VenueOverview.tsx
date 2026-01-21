import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Phone, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VenueOverviewProps {
  venue: {
    id: string;
    name: string;
    address: string | null;
    google_maps_link: string | null;
    contact_person: string | null;
    contact_whatsapp: string | null;
    total_capacity: number;
    notes: string | null;
    is_archived: boolean;
  };
}

export function VenueOverview({ venue }: VenueOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Details Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Venue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={
                venue.is_archived
                  ? "border-muted text-muted-foreground"
                  : "border-success/30 text-success"
              }
            >
              {venue.is_archived ? "Archived" : "Active"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Capacity</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{venue.total_capacity}</span>
            </div>
          </div>

          {venue.address && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{venue.address}</p>
                  {venue.google_maps_link && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <a
                        href={venue.google_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open in Maps
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {venue.contact_person && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{venue.contact_person}</p>
                  {venue.contact_whatsapp && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <a
                        href={`https://wa.me/${venue.contact_whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {venue.contact_whatsapp}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {venue.notes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {venue.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">
              No notes added yet. Edit the venue to add sound check info, house rules, load-in details, etc.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Future Attribution Section */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Attribution & Earnings (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">Promoter Attributed Spend</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Future POS feature</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">Company Attributed Spend</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Future POS feature</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Future POS feature</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            When the POS system is integrated, purchases will be linked to attendee wristbands/QR codes, 
            enabling automatic attribution to promoters and commission calculations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
