import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PromoterProtectedRoute } from "@/components/promoter/PromoterProtectedRoute";
import { PromoterLayout } from "@/components/promoter/PromoterLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Guests from "./pages/Guests";
import Promoters from "./pages/Promoters";
import QRCodes from "./pages/QRCodes";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Venues from "./pages/Venues";
import VenueDetail from "./pages/VenueDetail";
import NotFound from "./pages/NotFound";
import PromoterLogin from "./pages/promoter/PromoterLogin";
import PromoterDashboard from "./pages/promoter/PromoterDashboard";
import PromoterEvents from "./pages/promoter/PromoterEvents";
import PromoterEventDetail from "./pages/promoter/PromoterEventDetail";
import PromoterQRCodes from "./pages/promoter/PromoterQRCodes";
import PromoterPayouts from "./pages/promoter/PromoterPayouts";
import Guestlist from "./pages/Guestlist";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/promoter/login" element={<PromoterLogin />} />
          <Route path="/guestlist/:code" element={<Guestlist />} />
          <Route path="/guestlist" element={<Guestlist />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/promoters" element={<Promoters />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/:id" element={<VenueDetail />} />
              <Route path="/qr-codes" element={<QRCodes />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Promoter Portal Routes */}
          <Route element={<PromoterProtectedRoute />}>
            <Route element={<PromoterLayout />}>
              <Route path="/promoter/dashboard" element={<PromoterDashboard />} />
              <Route path="/promoter/events" element={<PromoterEvents />} />
              <Route path="/promoter/events/:id" element={<PromoterEventDetail />} />
              <Route path="/promoter/qr-codes" element={<PromoterQRCodes />} />
              <Route path="/promoter/payouts" element={<PromoterPayouts />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
