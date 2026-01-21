import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePromoter } from "@/hooks/usePromoter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Settings, Calendar, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function PromoterPayouts() {
  const { promoter } = usePromoter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState({
    bank_name: "",
    account_number: "",
    account_holder: "",
    ewallet_type: "",
    ewallet_number: "",
  });

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["promoter-commissions-full", promoter?.id],
    queryFn: async () => {
      if (!promoter?.id) return [];
      const { data, error } = await supabase
        .from("commission_ledger")
        .select("*, events(name, date)")
        .eq("promoter_id", promoter.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!promoter?.id,
  });

  // Load existing payout details
  const { data: existingPayoutDetails } = useQuery({
    queryKey: ["payout-details", promoter?.id],
    queryFn: async () => {
      if (!promoter?.payout_details) return null;
      return promoter.payout_details as {
        bank_name?: string;
        account_number?: string;
        account_holder?: string;
        ewallet_type?: string;
        ewallet_number?: string;
      };
    },
    enabled: !!promoter?.id,
  });

  const updatePayoutMutation = useMutation({
    mutationFn: async (details: typeof payoutDetails) => {
      if (!promoter?.id) throw new Error("No promoter found");
      const { error } = await supabase
        .from("promoters")
        .update({ payout_details: details })
        .eq("id", promoter.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoter-profile"] });
      toast({ title: "Payout details updated!" });
      setPayoutDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSavePayoutDetails = () => {
    updatePayoutMutation.mutate(payoutDetails);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const totals = {
    pending: commissions?.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    approved: commissions?.filter((c) => c.status === "approved").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    paid: commissions?.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0) || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "border-green-500 text-green-500";
      case "approved":
        return "border-blue-500 text-blue-500";
      default:
        return "border-yellow-500 text-yellow-500";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground">Track your commission earnings</p>
        </div>
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Payout Details
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payout Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={payoutDetails.bank_name || existingPayoutDetails?.bank_name || ""}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, bank_name: e.target.value }))
                  }
                  placeholder="e.g., BCA, Mandiri, BNI"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={payoutDetails.account_number || existingPayoutDetails?.account_number || ""}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, account_number: e.target.value }))
                  }
                  placeholder="Your bank account number"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  value={payoutDetails.account_holder || existingPayoutDetails?.account_holder || ""}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, account_holder: e.target.value }))
                  }
                  placeholder="Name as it appears on account"
                />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-3">Or use an e-wallet:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-Wallet Type</Label>
                    <Input
                      value={payoutDetails.ewallet_type || existingPayoutDetails?.ewallet_type || ""}
                      onChange={(e) =>
                        setPayoutDetails((p) => ({ ...p, ewallet_type: e.target.value }))
                      }
                      placeholder="e.g., GoPay, OVO"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-Wallet Number</Label>
                    <Input
                      value={payoutDetails.ewallet_number || existingPayoutDetails?.ewallet_number || ""}
                      onChange={(e) =>
                        setPayoutDetails((p) => ({ ...p, ewallet_number: e.target.value }))
                      }
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSavePayoutDetails}
                className="w-full gradient-purple"
                disabled={updatePayoutMutation.isPending}
              >
                Save Details
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totals.pending)}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(totals.approved)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(totals.paid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Ledger */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Commission Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No commissions recorded yet</p>
              <p className="text-sm mt-1">
                Start promoting events to earn commissions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-center">Registrations</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions?.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.events?.name || "Unknown"}</p>
                          {c.events?.date && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(c.events.date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {c.registrations_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{c.commission_rate}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(c.amount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getStatusColor(c.status)}>
                          {c.status}
                        </Badge>
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
