import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText, Upload, Trash2, Loader2, Sparkles, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VenueFilesProps {
  venueId: string;
}

interface VenueFile {
  id: string;
  venue_id: string;
  file_type: "drinks_menu" | "food_menu" | "other";
  file_url: string;
  file_name: string | null;
  uploaded_at: string;
}

interface ExtractedMenuItem {
  name: string;
  category: "food" | "drink";
  subcategory: string;
  price_idr: number;
  description: string | null;
  selected: boolean;
}

export function VenueFiles({ venueId }: VenueFilesProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileType, setFileType] = useState<VenueFile["file_type"]>("drinks_menu");
  const [customFileName, setCustomFileName] = useState("");
  const [extractedItems, setExtractedItems] = useState<ExtractedMenuItem[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files, isLoading } = useQuery({
    queryKey: ["venue-files", venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_files")
        .select("*")
        .eq("venue_id", venueId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as VenueFile[];
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (file: VenueFile) => {
      // Delete from storage
      const filePath = file.file_url.split("/venue-files/")[1];
      if (filePath) {
        await supabase.storage.from("venue-files").remove([filePath]);
      }
      // Delete from database
      const { error } = await supabase.from("venue_files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-files", venueId] });
      toast({ title: "File deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveExtractedItemsMutation = useMutation({
    mutationFn: async (items: ExtractedMenuItem[]) => {
      const selectedItems = items.filter((i) => i.selected);
      if (selectedItems.length === 0) return;

      const menuItems = selectedItems.map((item) => ({
        venue_id: venueId,
        category: item.category,
        subcategory: item.subcategory || null,
        name: item.name,
        price_idr: item.price_idr,
        description: item.description,
        is_active: true,
      }));

      const { error } = await supabase.from("menu_items").insert(menuItems);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", venueId] });
      toast({ title: "Menu items saved successfully" });
      setShowReviewDialog(false);
      setExtractedItems([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${venueId}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("venue-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("venue-files")
        .getPublicUrl(fileName);

      // Save to database - use custom name for "other" type if provided
      const displayName = fileType === "other" && customFileName.trim() 
        ? customFileName.trim() 
        : file.name;
      
      const { error: dbError } = await supabase.from("venue_files").insert({
        venue_id: venueId,
        file_type: fileType,
        file_url: urlData.publicUrl,
        file_name: displayName,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["venue-files", venueId] });
      toast({ title: "File uploaded successfully" });

      // Ask if user wants to extract menu items
      if (fileType === "drinks_menu" || fileType === "food_menu") {
        const shouldExtract = confirm("Would you like to extract menu items from this PDF using AI?");
        if (shouldExtract) {
          await extractMenuFromPdf(file);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setCustomFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const extractMenuFromPdf = async (file: File) => {
    setIsExtracting(true);
    
    try {
      // Read PDF as text (basic extraction - for better results, use a PDF parsing library)
      const text = await file.text();
      
      // Call the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-menu`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            pdfText: text,
            fileType: fileType,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract menu");
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const itemsWithSelection = data.items.map((item: Omit<ExtractedMenuItem, 'selected'>) => ({
          ...item,
          selected: true,
        }));
        setExtractedItems(itemsWithSelection);
        setShowReviewDialog(true);
        toast({ title: `AI extracted ${data.items.length} items`, description: "Review and confirm the items below" });
      } else {
        toast({ title: "No items extracted", description: "The AI couldn't find menu items in this PDF", variant: "destructive" });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Extraction failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const getFileTypeLabel = (type: VenueFile["file_type"]) => {
    const labels: Record<VenueFile["file_type"], string> = {
      drinks_menu: "Drinks Menu",
      food_menu: "Food Menu",
      other: "Other",
    };
    return labels[type];
  };

  const toggleItemSelection = (index: number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateExtractedItem = (index: number, field: keyof ExtractedMenuItem, value: unknown) => {
    setExtractedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const selectAll = () => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const deselectAll = () => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: false })));
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
      {/* Upload Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Upload Menu PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>File Type</Label>
              <Select value={fileType} onValueChange={(v) => {
                setFileType(v as VenueFile["file_type"]);
                if (v !== "other") setCustomFileName("");
              }}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drinks_menu">Drinks Menu</SelectItem>
                  <SelectItem value="food_menu">Food Menu</SelectItem>
                  <SelectItem value="other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fileType === "other" && (
              <div className="space-y-2 flex-1">
                <Label>Document Name</Label>
                <Input
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="e.g., Floor Plan, Contract"
                  className="bg-input border-border"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isExtracting}
              className="gradient-purple text-primary-foreground"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload PDF
            </Button>
          </div>
          
          {isExtracting && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <div>
                <p className="text-sm font-medium text-foreground">Extracting menu items...</p>
                <p className="text-xs text-muted-foreground">AI is analyzing the PDF to find menu items</p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Upload a PDF menu and AI will automatically extract items with names, prices, and categories.
          </p>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files?.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{file.file_name || "Menu PDF"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeLabel(file.file_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFileMutation.mutate(file)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Extracted Items Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Review Extracted Menu Items
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {extractedItems.filter((i) => i.selected).length} of {extractedItems.length} items selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead className="text-right">Price (IDR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedItems.map((item, index) => (
                    <TableRow key={index} className={`border-border ${!item.selected ? "opacity-50" : ""}`}>
                      <TableCell>
                        <Switch
                          checked={item.selected}
                          onCheckedChange={() => toggleItemSelection(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.name}
                          onChange={(e) => updateExtractedItem(index, "name", e.target.value)}
                          className="bg-input border-border h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.category}
                          onValueChange={(v) => updateExtractedItem(index, "category", v)}
                        >
                          <SelectTrigger className="bg-input border-border h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drink">Drink</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.subcategory || ""}
                          onChange={(e) => updateExtractedItem(index, "subcategory", e.target.value)}
                          className="bg-input border-border h-8"
                          placeholder="e.g., Cocktails"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.price_idr}
                          onChange={(e) => updateExtractedItem(index, "price_idr", parseInt(e.target.value) || 0)}
                          className="bg-input border-border h-8 w-28 text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="gradient-purple text-primary-foreground"
                onClick={() => saveExtractedItemsMutation.mutate(extractedItems)}
                disabled={extractedItems.filter((i) => i.selected).length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Save {extractedItems.filter((i) => i.selected).length} Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
