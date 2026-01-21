import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Edit, Trash2, QrCode, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Promoter = Database["public"]["Tables"]["promoters"]["Row"];
type PromoterInsert = Database["public"]["Tables"]["promoters"]["Insert"];

export default function Promoters() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
  const [formData, setFormData] = useState<Partial<PromoterInsert>>({
    name: "",
    email: "",
    phone: "",
    commission_per_attendee: 0,
    is_active: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promoters, isLoading } = useQuery({
    queryKey: ["promoters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promoters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: promoterStats } = useQuery({
    queryKey: ["promoter-stats"],
    queryFn: async () => {
      const { data: guests, error: guestsError } = await supabase
        .from("guests")
        .select("promoter_id, attended");
      if (guestsError) throw guestsError;

      const { data: scans, error: scansError } = await supabase
        .from("qr_scans")
        .select("promoter_id");
      if (scansError) throw scansError;

      const stats: Record<string, { registrations: number; attended: number; scans: number }> = {};
      
      guests.forEach((g) => {
        if (g.promoter_id) {
          if (!stats[g.promoter_id]) {
            stats[g.promoter_id] = { registrations: 0, attended: 0, scans: 0 };
          }
          stats[g.promoter_id].registrations++;
          if (g.attended) stats[g.promoter_id].attended++;
        }
      });

      scans.forEach((s) => {
        if (!stats[s.promoter_id]) {
          stats[s.promoter_id] = { registrations: 0, attended: 0, scans: 0 };
        }
        stats[s.promoter_id].scans++;
      });

      return stats;
    },
  });

  const generateQrCode = () => {
    return `BLS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: PromoterInsert) => {
      const { error } = await supabase.from("promoters").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      toast({ title: "Promoter created successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Promoter> }) => {
      const { error } = await supabase.from("promoters").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      toast({ title: "Promoter updated successfully" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promoters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] });
      toast({ title: "Promoter deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      commission_per_attendee: 0,
      is_active: true,
    });
    setEditingPromoter(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromoter) {
      updateMutation.mutate({ id: editingPromoter.id, data: formData });
    } else {
      createMutation.mutate({
        ...formData,
        qr_code_identifier: generateQrCode(),
      } as PromoterInsert);
    }
  };

  const openEditDialog = (promoter: Promoter) => {
    setEditingPromoter(promoter);
    setFormData({
      name: promoter.name,
      email: promoter.email || "",
      phone: promoter.phone || "",
      commission_per_attendee: Number(promoter.commission_per_attendee),
      is_active: promoter.is_active,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promoters</h1>
          <p className="text-muted-foreground mt-1">
            Manage your event promoters and track performance
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Promoter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingPromoter ? "Edit Promoter" : "Add New Promoter"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 812 3456 7890"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission per Attendee ($)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  value={formData.commission_per_attendee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commission_per_attendee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active Status</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-gold text-primary-foreground">
                  {editingPromoter ? "Update" : "Add Promoter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
      ) : promoters?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <UserCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No promoters yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Add your first promoter to start tracking performance
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gradient-gold text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Promoter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoters?.map((promoter) => {
            const stats = promoterStats?.[promoter.id] || {
              registrations: 0,
              attended: 0,
              scans: 0,
            };
            const commission = stats.attended * Number(promoter.commission_per_attendee);

            return (
              <Card
                key={promoter.id}
                className="bg-card border-border hover:border-primary/30 transition-colors group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-coral flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {promoter.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {promoter.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            promoter.is_active
                              ? "border-success/30 text-success"
                              : "border-muted text-muted-foreground"
                          }
                        >
                          {promoter.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(promoter)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(promoter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {promoter.qr_code_identifier}
                    </code>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{stats.scans}</p>
                      <p className="text-xs text-muted-foreground">Scans</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">
                        {stats.registrations}
                      </p>
                      <p className="text-xs text-muted-foreground">Registrations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{stats.attended}</p>
                      <p className="text-xs text-muted-foreground">Attended</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Commission</span>
                    </div>
                    <span className="font-bold text-primary">${commission.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
