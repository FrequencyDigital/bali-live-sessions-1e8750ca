import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  Wallet,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePromoter } from "@/hooks/usePromoter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import blsLogo from "@/assets/bls-logo.png";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "Dashboard", url: "/promoter/dashboard", icon: LayoutDashboard },
  { title: "Events", url: "/promoter/events", icon: Calendar },
  { title: "QR Codes", url: "/promoter/qr-codes", icon: QrCode },
  { title: "Payouts", url: "/promoter/payouts", icon: Wallet },
];

export function PromoterLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { promoter } = usePromoter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/promoter/login");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <img src={blsLogo} alt="Bali Live Sessions" className="h-8 w-auto invert mx-auto" />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "hover:bg-accent",
              isActive(item.url)
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive(item.url) && "text-primary")} />
            <span className="text-sm font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={promoter?.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {promoter?.name?.charAt(0)?.toUpperCase() || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {promoter?.name || "Promoter"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {promoter?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Log out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4">
        <img src={blsLogo} alt="BLS" className="h-6 w-auto invert" />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
