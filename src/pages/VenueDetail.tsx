import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2 } from "lucide-react";
import { VenueOverview } from "@/components/venues/VenueOverview";
import { VenueSeatingAreas } from "@/components/venues/VenueSeatingAreas";
import { VenueMenus } from "@/components/venues/VenueMenus";
import { VenueFiles } from "@/components/venues/VenueFiles";
import { VenueManagers } from "@/components/venues/VenueManagers";

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue", id],
    queryFn: async () => {
      if (!id) throw new Error("No venue ID");
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Venue not found</h2>
          <Button asChild variant="outline">
            <Link to="/venues">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Venues
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link to="/venues">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet flex items-center justify-center text-primary-foreground font-bold text-lg">
            {venue.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{venue.name}</h1>
            {venue.address && (
              <p className="text-sm text-muted-foreground">{venue.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seating">Seating Areas</TabsTrigger>
          <TabsTrigger value="menus">Menus</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <VenueOverview venue={venue} />
        </TabsContent>

        <TabsContent value="seating" className="mt-6">
          <VenueSeatingAreas venueId={venue.id} />
        </TabsContent>

        <TabsContent value="menus" className="mt-6">
          <VenueMenus venueId={venue.id} />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <VenueFiles venueId={venue.id} />
        </TabsContent>

        <TabsContent value="managers" className="mt-6">
          <VenueManagers venueId={venue.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
