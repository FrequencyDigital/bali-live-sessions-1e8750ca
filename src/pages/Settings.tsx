import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Database } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return { ...data, user_id: user.id };
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string | null) => {
      if (!profile?.user_id) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", profile.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile photo updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: role } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data?.role;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["system-stats"],
    queryFn: async () => {
      const [events, guests, promoters] = await Promise.all([
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("guests").select("id", { count: "exact" }),
        supabase.from("promoters").select("id", { count: "exact" }),
      ]);
      return {
        events: events.count || 0,
        guests: guests.count || 0,
        promoters: promoters.count || 0,
      };
    },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and system preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <ImageUpload
              currentImageUrl={profile?.avatar_url}
              onImageChange={(url) => updateAvatarMutation.mutate(url)}
              folder="profiles"
              identifier={profile?.user_id || "user"}
              fallbackText={profile?.full_name || profile?.email || "U"}
              size="lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile?.full_name || ""}
                readOnly
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={profile?.email || ""}
                readOnly
                className="bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Access Level</CardTitle>
              <CardDescription>Your permissions in the system</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={
                role === "super_admin"
                  ? "border-primary/30 text-primary"
                  : "border-success/30 text-success"
              }
            >
              {role === "super_admin" ? "Super Admin" : role || "No Role Assigned"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {role === "super_admin"
                ? "Full access to all features"
                : role === "admin"
                ? "Can view data and manage guest lists"
                : "Contact a super admin to get access"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">System Overview</CardTitle>
              <CardDescription>Current data in the system</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">{stats?.events || 0}</p>
              <p className="text-sm text-muted-foreground">Events</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">{stats?.guests || 0}</p>
              <p className="text-sm text-muted-foreground">Guests</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">{stats?.promoters || 0}</p>
              <p className="text-sm text-muted-foreground">Promoters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
