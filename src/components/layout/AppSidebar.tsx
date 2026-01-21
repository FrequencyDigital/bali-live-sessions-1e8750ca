import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck, 
  QrCode, 
  Bell, 
  Settings,
  LogOut,
  Building2,
  Wallet
} from "lucide-react";
import blsLogo from "@/assets/bls-logo.png";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Venues", url: "/venues", icon: Building2 },
  { title: "Guest List", url: "/guests", icon: Users },
  { title: "Promoters", url: "/promoters", icon: UserCheck },
  { title: "Commissions", url: "/commissions", icon: Wallet },
  { title: "QR Codes", url: "/qr-codes", icon: QrCode },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          <img 
            src={blsLogo} 
            alt="Bali Live Sessions" 
            className={`invert transition-all duration-200 ${isCollapsed ? 'h-8 w-auto' : 'h-10 w-auto'}`}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-3 py-2">
            {!isCollapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent",
                        isActive(item.url) 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-sidebar-foreground/70"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive(item.url) ? "text-primary" : ""
                      )} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs text-muted-foreground px-3 py-2">
            {!isCollapsed && "System"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent",
                        isActive(item.url) 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-sidebar-foreground/70"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive(item.url) ? "text-primary" : ""
                      )} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 mb-2",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Log out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
