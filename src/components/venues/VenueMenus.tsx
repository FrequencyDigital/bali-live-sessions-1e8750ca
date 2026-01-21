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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, UtensilsCrossed, Wine, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VenueMenusProps {
  venueId: string;
}

interface MenuItem {
  id: string;
  venue_id: string;
  category: "food" | "drink";
  subcategory: string | null;
  name: string;
  price_idr: number;
  description: string | null;
  is_active: boolean;
}

interface MenuItemForm {
  category: "food" | "drink";
  subcategory: string;
  name: string;
  price_idr: string;
  description: string;
  is_active: boolean;
}

export function VenueMenus({ venueId }: VenueMenusProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuCategory, setMenuCategory] = useState<"food" | "drink">("drink");
  const [formData, setFormData] = useState<MenuItemForm>({
    category: "drink",
    subcategory: "",
    name: "",
    price_idr: "",
    description: "",
    is_active: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["menu-items", venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("venue_id", venueId)
        .order("category")
        .order("subcategory")
        .order("name");
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MenuItemForm) => {
      const { error } = await supabase.from("menu_items").insert({
        venue_id: venueId,
        category: data.category,
        subcategory: data.subcategory || null,
        name: data.name,
        price_idr: parseInt(data.price_idr) || 0,
        description: data.description || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", venueId] });
      toast({ title: "Menu item added" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MenuItemForm> }) => {
      const updateData: Record<string, unknown> = { ...data };
      if (data.price_idr) {
        updateData.price_idr = parseInt(data.price_idr);
      }
      const { error } = await supabase.from("menu_items").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", venueId] });
      toast({ title: "Menu item updated" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", venueId] });
      toast({ title: "Menu item deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", venueId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      category: menuCategory,
      subcategory: "",
      name: "",
      price_idr: "",
      description: "",
      is_active: true,
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      subcategory: item.subcategory || "",
      name: item.name,
      price_idr: item.price_idr.toString(),
      description: item.description || "",
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormData({
      ...formData,
      category: menuCategory,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const drinkItems = menuItems?.filter((i) => i.category === "drink") || [];
  const foodItems = menuItems?.filter((i) => i.category === "food") || [];

  const getSubcategories = (items: MenuItem[]) => {
    const subcats = [...new Set(items.map((i) => i.subcategory).filter(Boolean))];
    return subcats.sort();
  };

  const groupBySubcategory = (items: MenuItem[]) => {
    const grouped: Record<string, MenuItem[]> = {};
    items.forEach((item) => {
      const subcat = item.subcategory || "Other";
      if (!grouped[subcat]) grouped[subcat] = [];
      grouped[subcat].push(item);
    });
    return grouped;
  };

  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Menu Items</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-purple text-primary-foreground" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as "food" | "drink" })}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drink">Drink</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g., Cocktails, Mains"
                    className="bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jack Daniels and Coke"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (IDR) *</Label>
                <Input
                  type="number"
                  value={formData.price_idr}
                  onChange={(e) => setFormData({ ...formData, price_idr: e.target.value })}
                  placeholder="120000"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-purple text-primary-foreground">
                  {editingItem ? "Update" : "Add Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={menuCategory} onValueChange={(v) => setMenuCategory(v as "food" | "drink")}>
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="drink" className="flex items-center gap-2">
            <Wine className="w-4 h-4" />
            Drinks ({drinkItems.length})
          </TabsTrigger>
          <TabsTrigger value="food" className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Food ({foodItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drink" className="mt-6">
          <MenuTable
            items={drinkItems}
            groupedItems={groupBySubcategory(drinkItems)}
            formatPrice={formatPrice}
            onEdit={openEditDialog}
            onDelete={(id) => deleteMutation.mutate(id)}
            onToggleActive={(id, active) => toggleActiveMutation.mutate({ id, is_active: active })}
            emptyIcon={<Wine className="w-12 h-12 text-muted-foreground/30" />}
            emptyText="No drink items yet"
          />
        </TabsContent>

        <TabsContent value="food" className="mt-6">
          <MenuTable
            items={foodItems}
            groupedItems={groupBySubcategory(foodItems)}
            formatPrice={formatPrice}
            onEdit={openEditDialog}
            onDelete={(id) => deleteMutation.mutate(id)}
            onToggleActive={(id, active) => toggleActiveMutation.mutate({ id, is_active: active })}
            emptyIcon={<UtensilsCrossed className="w-12 h-12 text-muted-foreground/30" />}
            emptyText="No food items yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MenuTable({
  items,
  groupedItems,
  formatPrice,
  onEdit,
  onDelete,
  onToggleActive,
  emptyIcon,
  emptyText,
}: {
  items: MenuItem[];
  groupedItems: Record<string, MenuItem[]>;
  formatPrice: (price: number) => string;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  emptyIcon: React.ReactNode;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          {emptyIcon}
          <h3 className="font-semibold text-foreground mt-4 mb-2">{emptyText}</h3>
          <p className="text-muted-foreground text-sm">
            Add items manually or upload a menu PDF to extract items automatically
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([subcategory, subItems]) => (
        <Card key={subcategory} className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">{subcategory}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Item</TableHead>
                  <TableHead className="text-muted-foreground text-right">Price</TableHead>
                  <TableHead className="text-muted-foreground text-center">Active</TableHead>
                  <TableHead className="text-muted-foreground text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subItems.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className={`font-medium ${item.is_active ? "text-foreground" : "text-muted-foreground"}`}>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(item.price_idr)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) => onToggleActive(item.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
