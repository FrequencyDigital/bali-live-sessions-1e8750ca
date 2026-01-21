import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import {
  Wallet,
  Check,
  X,
  DollarSign,
  Calendar,
  Users,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  Banknote,
  AlertTriangle,
} from "lucide-react";

type CommissionStatus = "pending" | "approved" | "paid";

interface CommissionEntry {
  id: string;
  promoter_id: string;
  event_id: string;
  registrations_count: number;
  commission_rate: number;
  amount: number;
  status: CommissionStatus;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  promoter?: { name: string; email: string };
  event?: { name: string; date: string };
}

export default function CommissionLedger() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter state
  const [promoterFilter, setPromoterFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Payout dialog state
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutEntry, setPayoutEntry] = useState<CommissionEntry | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  // Revoke dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeEntry, setRevokeEntry] = useState<CommissionEntry | null>(null);

  // Fetch commissions
  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ["admin-commissions", promoterFilter, eventFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("commission_ledger")
        .select("*, promoters(name, email), events(name, date)")
        .order("created_at", { ascending: false });

      if (promoterFilter !== "all") {
        query = query.eq("promoter_id", promoterFilter);
      }
      if (eventFilter !== "all") {
        query = query.eq("event_id", eventFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((entry: any) => ({
        ...entry,
        promoter: entry.promoters,
        event: entry.events,
      })) as CommissionEntry[];
    },
  });

  // Fetch promoters for filter
  const { data: promoters } = useQuery({
    queryKey: ["promoters-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("promoters")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  // Fetch events for filter
  const { data: events } = useQuery({
    queryKey: ["events-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, date")
        .order("date", { ascending: false });
      return data || [];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("commission_ledger")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .in("id", ids)
        .eq("status", "pending");

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      setSelectedIds(new Set());
      toast({
        title: "Approved",
        description: `${ids.length} commission(s) approved successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve commissions",
        variant: "destructive",
      });
    },
  });

  // Payout mutation
  const payoutMutation = useMutation({
    mutationFn: async ({ id, reference, notes }: { id: string; reference: string; notes: string }) => {
      const { error } = await supabase
        .from("commission_ledger")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "approved");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      setPayoutDialogOpen(false);
      setPayoutEntry(null);
      setPaymentReference("");
      setPayoutNotes("");
      toast({
        title: "Paid",
        description: "Commission marked as paid",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process payout",
        variant: "destructive",
      });
    },
  });

  // Revoke mutation (deletes the entry)
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_ledger")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      setRevokeDialogOpen(false);
      setRevokeEntry(null);
      toast({
        title: "Revoked",
        description: "Commission entry has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke commission",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
            <Banknote className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAllPending = () => {
    const pendingIds = commissions
      ?.filter((c) => c.status === "pending")
      .map((c) => c.id) || [];
    setSelectedIds(new Set(pendingIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return;
    approveMutation.mutate(Array.from(selectedIds));
  };

  const handleSingleApprove = (id: string) => {
    approveMutation.mutate([id]);
  };

  const handleOpenPayout = (entry: CommissionEntry) => {
    setPayoutEntry(entry);
    setPayoutDialogOpen(true);
  };

  const handleConfirmPayout = () => {
    if (!payoutEntry) return;
    payoutMutation.mutate({
      id: payoutEntry.id,
      reference: paymentReference,
      notes: payoutNotes,
    });
  };

  const handleOpenRevoke = (entry: CommissionEntry) => {
    setRevokeEntry(entry);
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (!revokeEntry) return;
    revokeMutation.mutate(revokeEntry.id);
  };

  const resetFilters = () => {
    setPromoterFilter("all");
    setEventFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Summary stats
  const totals = {
    pending: commissions?.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    approved: commissions?.filter((c) => c.status === "approved").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    paid: commissions?.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
  };

  const pendingCount = commissions?.filter((c) => c.status === "pending").length || 0;
  const selectedPendingCount = Array.from(selectedIds).filter(
    (id) => commissions?.find((c) => c.id === id)?.status === "pending"
  ).length;

  if (commissionsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Commission Ledger
          </h1>
          <p className="text-muted-foreground">
            Review, approve, and track promoter commissions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{formatCurrency(totals.pending)}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} entries awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Approved (Unpaid)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{formatCurrency(totals.approved)}</div>
            <p className="text-xs text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-500" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totals.paid)}</div>
            <p className="text-xs text-muted-foreground">Completed payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Promoter</Label>
              <Select value={promoterFilter} onValueChange={setPromoterFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Promoters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Promoters</SelectItem>
                  {promoters?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Event</Label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-3">
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset Filters
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedIds.size > 0 && selectedIds.size === pendingCount}
            onCheckedChange={(checked) => (checked ? selectAllPending() : clearSelection())}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedPendingCount} pending selected`
              : `Select all ${pendingCount} pending`}
          </span>
          {selectedPendingCount > 0 && (
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={approveMutation.isPending}
              className="ml-auto"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve Selected ({selectedPendingCount})
            </Button>
          )}
        </div>
      )}

      {/* Commission Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Promoter</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-center">Attendees</TableHead>
                <TableHead className="text-center">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No commission entries found
                  </TableCell>
                </TableRow>
              ) : (
                commissions?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.status === "pending" && (
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.promoter?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{entry.promoter?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.event?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.event?.date && format(new Date(entry.event.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        <Users className="w-3 h-3 mr-1" />
                        {entry.registrations_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{entry.commission_rate}%</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(entry.amount))}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "MMM d, yyyy")}
                      </p>
                      {entry.paid_at && (
                        <p className="text-xs text-green-500">
                          Paid: {format(new Date(entry.paid_at), "MMM d")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSingleApprove(entry.id)}
                              disabled={approveMutation.isPending}
                              className="text-green-500 hover:text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenRevoke(entry)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {entry.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPayout(entry)}
                            disabled={payoutMutation.isPending}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                        )}
                        {entry.status === "paid" && (
                          <span className="text-xs text-muted-foreground">Completed</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Mark as Paid
            </DialogTitle>
            <DialogDescription>
              Confirm payout to {payoutEntry?.promoter?.name} for{" "}
              {formatCurrency(Number(payoutEntry?.amount || 0))}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Event:</span>
                  <span className="ml-2 font-medium">{payoutEntry?.event?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Attendees:</span>
                  <span className="ml-2 font-medium">{payoutEntry?.registrations_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="ml-2 font-medium">{payoutEntry?.commission_rate}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-2 font-medium text-green-500">
                    {formatCurrency(Number(payoutEntry?.amount || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label>Payment Reference (optional)</Label>
              <Input
                placeholder="e.g., Bank transfer #12345"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional notes..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayout} disabled={payoutMutation.isPending}>
              <Check className="w-4 h-4 mr-1" />
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Revoke Commission
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this commission entry? This will permanently remove it
              and the promoter will not receive payment for these registrations.
              <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                <p>
                  <strong>Promoter:</strong> {revokeEntry?.promoter?.name}
                </p>
                <p>
                  <strong>Event:</strong> {revokeEntry?.event?.name}
                </p>
                <p>
                  <strong>Amount:</strong> {formatCurrency(Number(revokeEntry?.amount || 0))}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              className="bg-red-500 hover:bg-red-600"
            >
              Revoke Commission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
