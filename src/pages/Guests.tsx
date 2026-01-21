import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Users, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Guests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select(`
          *,
          events(name),
          promoters(name)
        `)
        .order("registration_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ id, attended }: { id: string; attended: boolean }) => {
      const { error } = await supabase
        .from("guests")
        .update({ attended })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast({ title: "Attendance updated" });
    },
  });

  const filteredGuests = guests?.filter((guest) => {
    const matchesSearch =
      guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.nationality?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventFilter === "all" || guest.event_id === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const exportGuests = () => {
    if (!filteredGuests) return;
    
    const csv = [
      ["Name", "Email", "WhatsApp", "Nationality", "Event", "Promoter", "Attended", "Registration Date"],
      ...filteredGuests.map((g) => [
        g.full_name,
        g.email || "",
        g.whatsapp_number || "",
        g.nationality || "",
        (g.events as any)?.name || "",
        (g.promoters as any)?.name || "",
        g.attended ? "Yes" : "No",
        format(new Date(g.registration_date), "yyyy-MM-dd"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Guest list exported" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest List</h1>
          <p className="text-muted-foreground mt-1">
            {filteredGuests?.length || 0} total guests registered
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportGuests}
          className="border-border hover:bg-secondary"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or nationality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-input border-border">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Guest Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading guests...
            </div>
          ) : filteredGuests?.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No guests found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || eventFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Guests will appear here when they register"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Contact</TableHead>
                    <TableHead className="text-muted-foreground">Nationality</TableHead>
                    <TableHead className="text-muted-foreground">Event</TableHead>
                    <TableHead className="text-muted-foreground">Source</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuests?.map((guest) => (
                    <TableRow
                      key={guest.id}
                      className="border-border hover:bg-secondary/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {guest.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {guest.email && (
                            <p className="text-sm text-muted-foreground">
                              {guest.email}
                            </p>
                          )}
                          {guest.whatsapp_number && (
                            <p className="text-sm text-muted-foreground">
                              {guest.whatsapp_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {guest.nationality || "-"}
                      </TableCell>
                      <TableCell>
                        {(guest.events as any)?.name ? (
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {(guest.events as any).name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(guest.promoters as any)?.name ? (
                          <Badge variant="outline" className="border-violet-500/50 text-violet-400">
                            {(guest.promoters as any).name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary/50 text-primary">
                            Direct – BLS
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleAttendance.mutate({
                              id: guest.id,
                              attended: !guest.attended,
                            })
                          }
                        >
                          {guest.attended ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                              <Check className="w-3 h-3 mr-1" />
                              Checked In
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground">
                              Registered
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(guest.registration_date), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
