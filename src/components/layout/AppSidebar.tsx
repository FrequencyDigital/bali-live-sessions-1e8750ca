import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck, 
  QrCode, 
  Bell, 
  Settings,
  LogOut
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Guest List", url: "/guests", icon: Users },
  { title: "Promoters", url: "/promoters", icon: UserCheck },
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
