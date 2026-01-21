import { Navigate, Outlet } from "react-router-dom";
import { usePromoter } from "@/hooks/usePromoter";
import { Loader2 } from "lucide-react";

export function PromoterProtectedRoute() {
  const { promoter, loading, user } = usePromoter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/promoter/login" replace />;
  }

  if (!promoter) {
    return <Navigate to="/promoter/login" replace />;
  }

  return <Outlet />;
}
