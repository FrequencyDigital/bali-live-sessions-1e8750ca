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
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Users, Edit, Archive, ArchiveRestore, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Venue {
  id: string;
  name: string;
  address: string | null;
  google_maps_link: string | null;
  contact_person: string | null;
  contact_whatsapp: string | null;
  total_capacity: number;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
}

interface VenueFormData {
  name: string;
  address: string;
  google_maps_link: string;
  contact_person: string;
  contact_whatsapp: string;
  total_capacity: number;
  notes: string;
}

export default function Venues() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState<VenueFormData>({
    name: "",
    address: "",
    google_maps_link: "",
    contact_person: "",
    contact_whatsapp: "",
    total_capacity: 100,
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: venues, isLoading } = useQuery({
    queryKey: ["venues", showArchived],
    queryFn: async () => {
      let query = supabase
        .from("venues")
        .select("*")
        .order("name");
      
      if (!showArchived) {
        query = query.eq("is_archived", false);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Venue[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VenueFormData) => {
      const { error } = await supabase.from("venues").insert({
        name: data.name,
        address: data.address || null,
        google_maps_link: data.google_maps_link || null,
        contact_person: data.contact_person || null,
        contact_whatsapp: data.contact_whatsapp || null,
        total_capacity: data.total_capacity,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast({ title: "Venue created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VenueFormData> }) => {
      const { error } = await supabase.from("venues").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast({ title: "Venue updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("venues")
        .update({ is_archived: archived })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast({ title: archived ? "Venue archived" : "Venue restored" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      google_maps_link: "",
      contact_person: "",
      contact_whatsapp: "",
      total_capacity: 100,
      notes: "",
    });
    setEditingVenue(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVenue) {
      updateMutation.mutate({ id: editingVenue.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address || "",
      google_maps_link: venue.google_maps_link || "",
      contact_person: venue.contact_person || "",
      contact_whatsapp: venue.contact_whatsapp || "",
      total_capacity: venue.total_capacity,
      notes: venue.notes || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Venues</h1>
          <p className="text-muted-foreground mt-1">
            Manage venue profiles, seating areas, and menus
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="border-border"
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-purple text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingVenue ? "Edit Venue" : "Add New Venue"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Potato Head Beach Club"
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Petitenget, Seminyak"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maps">Google Maps Link</Label>
                  <Input
                    id="maps"
                    value={formData.google_maps_link}
                    onChange={(e) => setFormData({ ...formData, google_maps_link: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input
                      id="contact"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="John Doe"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.contact_whatsapp}
                      onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
                      placeholder="+62 812 3456 7890"
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.total_capacity}
                    onChange={(e) => setFormData({ ...formData, total_capacity: parseInt(e.target.value) || 0 })}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Sound checks, house rules, load-in info..."
                    className="bg-input border-border resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-purple text-primary-foreground">
                    {editingVenue ? "Update Venue" : "Add Venue"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : venues?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No venues yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Add your first venue to start managing locations
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gradient-purple text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues?.map((venue) => (
            <Link key={venue.id} to={`/venues/${venue.id}`}>
              <Card
                className={`bg-card border-border hover:border-primary/30 transition-colors group cursor-pointer ${
                  venue.is_archived ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {venue.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {venue.name}
                        </CardTitle>
                        {venue.is_archived && (
                          <Badge variant="outline" className="border-muted text-muted-foreground text-xs">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditDialog(venue);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          archiveMutation.mutate({ id: venue.id, archived: !venue.is_archived });
                        }}
                      >
                        {venue.is_archived ? (
                          <ArchiveRestore className="w-4 h-4" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {venue.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {venue.total_capacity}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
