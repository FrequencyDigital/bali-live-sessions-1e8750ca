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
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Edit, Trash2, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VenueSeatingAreasProps {
  venueId: string;
}

interface SeatingArea {
  id: string;
  venue_id: string;
  name: string;
  capacity: number;
  notes: string | null;
}

interface TableConfig {
  id: string;
  seating_area_id: string;
  table_type: "booth" | "high_table" | "standard" | "standing";
  count: number;
  min_spend: number | null;
  notes: string | null;
}

export function VenueSeatingAreas({ venueId }: VenueSeatingAreasProps) {
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<SeatingArea | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState({ name: "", capacity: 50, notes: "" });
  const [tableForm, setTableForm] = useState({
    table_type: "standard" as TableConfig["table_type"],
    count: 1,
    min_spend: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seatingAreas, isLoading } = useQuery({
    queryKey: ["seating-areas", venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seating_areas")
        .select("*")
        .eq("venue_id", venueId)
        .order("name");
      if (error) throw error;
      return data as SeatingArea[];
    },
  });

  const { data: tableConfigs } = useQuery({
    queryKey: ["table-configs", venueId],
    queryFn: async () => {
      if (!seatingAreas?.length) return [];
      const areaIds = seatingAreas.map((a) => a.id);
      const { data, error } = await supabase
        .from("table_configurations")
        .select("*")
        .in("seating_area_id", areaIds);
      if (error) throw error;
      return data as TableConfig[];
    },
    enabled: !!seatingAreas?.length,
  });

  const createAreaMutation = useMutation({
    mutationFn: async (data: typeof areaForm) => {
      const { error } = await supabase.from("seating_areas").insert({
        venue_id: venueId,
        name: data.name,
        capacity: data.capacity,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seating-areas", venueId] });
      toast({ title: "Seating area created" });
      resetAreaForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof areaForm }) => {
      const { error } = await supabase.from("seating_areas").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seating-areas", venueId] });
      toast({ title: "Seating area updated" });
      resetAreaForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seating_areas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seating-areas", venueId] });
      toast({ title: "Seating area deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createTableMutation = useMutation({
    mutationFn: async (data: typeof tableForm & { seating_area_id: string }) => {
      const { error } = await supabase.from("table_configurations").insert({
        seating_area_id: data.seating_area_id,
        table_type: data.table_type,
        count: data.count,
        min_spend: data.min_spend ? parseInt(data.min_spend) : null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-configs", venueId] });
      toast({ title: "Table configuration added" });
      resetTableForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("table_configurations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-configs", venueId] });
      toast({ title: "Table configuration deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetAreaForm = () => {
    setAreaForm({ name: "", capacity: 50, notes: "" });
    setEditingArea(null);
    setIsAreaDialogOpen(false);
  };

  const resetTableForm = () => {
    setTableForm({ table_type: "standard", count: 1, min_spend: "", notes: "" });
    setSelectedAreaId(null);
    setIsTableDialogOpen(false);
  };

  const openEditArea = (area: SeatingArea) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, capacity: area.capacity, notes: area.notes || "" });
    setIsAreaDialogOpen(true);
  };

  const openAddTable = (areaId: string) => {
    setSelectedAreaId(areaId);
    setIsTableDialogOpen(true);
  };

  const handleAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea) {
      updateAreaMutation.mutate({ id: editingArea.id, data: areaForm });
    } else {
      createAreaMutation.mutate(areaForm);
    }
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAreaId) {
      createTableMutation.mutate({ ...tableForm, seating_area_id: selectedAreaId });
    }
  };

  const getTableTypeLabel = (type: TableConfig["table_type"]) => {
    const labels: Record<TableConfig["table_type"], string> = {
      booth: "Booth",
      high_table: "High Table",
      standard: "Standard",
      standing: "Standing",
    };
    return labels[type];
  };

  const getAreaTables = (areaId: string) => {
    return tableConfigs?.filter((t) => t.seating_area_id === areaId) || [];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-3/4 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Seating Areas</h2>
        <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-purple text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Area
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingArea ? "Edit Seating Area" : "Add Seating Area"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAreaSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Area Name *</Label>
                <Input
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  placeholder="e.g., VIP Booths, Main Floor, Terrace"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={areaForm.capacity}
                  onChange={(e) => setAreaForm({ ...areaForm, capacity: parseInt(e.target.value) || 0 })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={areaForm.notes}
                  onChange={(e) => setAreaForm({ ...areaForm, notes: e.target.value })}
                  placeholder="Min spend rules, sightline notes..."
                  className="bg-input border-border resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={resetAreaForm}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-purple text-primary-foreground">
                  {editingArea ? "Update" : "Add Area"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Configuration Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Table Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTableSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Table Type *</Label>
              <Select
                value={tableForm.table_type}
                onValueChange={(v) => setTableForm({ ...tableForm, table_type: v as TableConfig["table_type"] })}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booth">Booth</SelectItem>
                  <SelectItem value="high_table">High Table</SelectItem>
                  <SelectItem value="standard">Standard Table</SelectItem>
                  <SelectItem value="standing">Standing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Count</Label>
                <Input
                  type="number"
                  value={tableForm.count}
                  onChange={(e) => setTableForm({ ...tableForm, count: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Spend (IDR)</Label>
                <Input
                  type="number"
                  value={tableForm.min_spend}
                  onChange={(e) => setTableForm({ ...tableForm, min_spend: e.target.value })}
                  placeholder="Optional"
                  className="bg-input border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={tableForm.notes}
                onChange={(e) => setTableForm({ ...tableForm, notes: e.target.value })}
                placeholder="Optional notes"
                className="bg-input border-border"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={resetTableForm}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-purple text-primary-foreground">
                Add Tables
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {seatingAreas?.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No seating areas yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add areas like VIP Booths, Main Floor, Terrace, etc.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seatingAreas?.map((area) => {
            const tables = getAreaTables(area.id);
            return (
              <Card key={area.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-foreground">{area.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Capacity: {area.capacity}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditArea(area)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteAreaMutation.mutate(area.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {area.notes && (
                    <p className="text-xs text-muted-foreground">{area.notes}</p>
                  )}
                  
                  {/* Table Configurations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Tables</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openAddTable(area.id)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {tables.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 italic">No table configurations</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tables.map((table) => (
                          <Badge
                            key={table.id}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                          >
                            <span>
                              {table.count}x {getTableTypeLabel(table.table_type)}
                            </span>
                            {table.min_spend && (
                              <span className="text-muted-foreground">
                                (IDR {table.min_spend.toLocaleString()})
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 hover:bg-destructive/20"
                              onClick={() => deleteTableMutation.mutate(table.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
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
