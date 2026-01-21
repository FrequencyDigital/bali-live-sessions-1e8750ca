import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Mail, UserCheck, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface VenueManagersProps {
  venueId: string;
}

interface VenueManager {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
  user_email?: string;
  is_linked: boolean;
}

export function VenueManagers({ venueId }: VenueManagersProps) {
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch venue managers with their user info
  const { data: managers, isLoading } = useQuery({
    queryKey: ["venue-managers", venueId],
    queryFn: async () => {
      // Get venue managers
      const { data: venueManagers, error } = await supabase
        .from("venue_managers")
        .select("*")
        .eq("venue_id", venueId);

      if (error) throw error;

      // For each manager, try to get user email from profiles
      const managersWithEmail: VenueManager[] = await Promise.all(
        (venueManagers || []).map(async (manager) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("user_id", manager.user_id)
            .maybeSingle();

          return {
            ...manager,
            user_email: profile?.email || "Unknown",
            is_linked: true,
          };
        })
      );

      return managersWithEmail;
    },
  });

  // Fetch pending invites (managers added by email but not yet signed up)
  const { data: pendingInvites } = useQuery({
    queryKey: ["pending-venue-manager-invites", venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_manager_invites")
        .select("*")
        .eq("venue_id", venueId)
        .eq("status", "pending");

      if (error) {
        // Table might not exist yet, return empty array
        if (error.code === "42P01") return [];
        throw error;
      }
      return data || [];
    },
  });

  // Add venue manager mutation
  const addManager = useMutation({
    mutationFn: async (managerEmail: string) => {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("email", managerEmail.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        // User exists, add them directly
        const { error } = await supabase.from("venue_managers").insert({
          user_id: existingUser.user_id,
          venue_id: venueId,
        });

        if (error) {
          if (error.code === "23505") {
            throw new Error("This user is already a manager of this venue");
          }
          throw error;
        }

        return { type: "linked", email: managerEmail };
      } else {
        // User doesn't exist, create an invite
        const { error } = await supabase.from("venue_manager_invites").insert({
          email: managerEmail.toLowerCase().trim(),
          venue_id: venueId,
          status: "pending",
        });

        if (error) {
          if (error.code === "23505") {
            throw new Error("An invite has already been sent to this email");
          }
          // If table doesn't exist, we need to create it via migration
          if (error.code === "42P01") {
            throw new Error("Invite system not yet configured. Please add user after they sign up.");
          }
          throw error;
        }

        return { type: "invited", email: managerEmail };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["venue-managers", venueId] });
      queryClient.invalidateQueries({ queryKey: ["pending-venue-manager-invites", venueId] });
      setEmail("");
      setIsAdding(false);
      toast({
        title: result.type === "linked" ? "Manager Added" : "Invite Sent",
        description:
          result.type === "linked"
            ? `${result.email} has been added as a venue manager.`
            : `${result.email} will be added as a manager when they sign up.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove venue manager mutation
  const removeManager = useMutation({
    mutationFn: async (managerId: string) => {
      const { error } = await supabase
        .from("venue_managers")
        .delete()
        .eq("id", managerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-managers", venueId] });
      toast({
        title: "Manager Removed",
        description: "The venue manager has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove invite mutation
  const removeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("venue_manager_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-venue-manager-invites", venueId] });
      toast({
        title: "Invite Cancelled",
        description: "The pending invite has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addManager.mutate(email);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Manager Form */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Add Venue Manager</CardTitle>
          <CardDescription>
            Add a user by email. If they haven't signed up yet, they'll be added automatically when they do.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddManager} className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="manager-email" className="sr-only">
                Email
              </Label>
              <Input
                id="manager-email"
                type="email"
                placeholder="manager@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <Button
              type="submit"
              disabled={addManager.isPending || !email.trim()}
              className="gradient-purple"
            >
              {addManager.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Managers */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Current Managers</CardTitle>
          <CardDescription>
            Users who can view and edit this venue's details, menus, and seating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!managers || managers.length === 0) && (!pendingInvites || pendingInvites.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No managers assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active managers */}
              {managers?.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{manager.user_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(manager.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      Active
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Manager</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {manager.user_email} as a manager of this venue?
                            They will no longer be able to view or edit venue details.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeManager.mutate(manager.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {/* Pending invites */}
              {pendingInvites?.map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                      Pending
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Invite</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel the invite for {invite.email}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeInvite.mutate(invite.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancel Invite
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}