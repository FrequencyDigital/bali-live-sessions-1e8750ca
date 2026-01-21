import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type Promoter = Database["public"]["Tables"]["promoters"]["Row"];

export function usePromoter() {
  const { user, loading: authLoading } = useAuth();
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPromoter, setIsPromoter] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPromoter(null);
      setIsPromoter(false);
      setLoading(false);
      return;
    }

    const fetchPromoter = async () => {
      try {
        // 1) Primary: fetch by linked user_id
        const { data, error } = await supabase
          .from("promoters")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPromoter(data);
          setIsPromoter(true);
          return;
        }

        // 2) Fallback: if user_id isn't linked yet, try to find by email and self-link.
        // This supports magic-link login flows where the user never enters an OTP in-app.
        const userEmail = user.email?.toLowerCase().trim();
        if (!userEmail) {
          setPromoter(null);
          setIsPromoter(false);
          return;
        }

        const { data: byEmail, error: byEmailError } = await supabase
          .from("promoters")
          .select("*")
          .eq("is_active", true)
          .is("user_id", null)
          .ilike("email", userEmail)
          .maybeSingle();

        if (byEmailError) throw byEmailError;

        if (!byEmail) {
          setPromoter(null);
          setIsPromoter(false);
          return;
        }

        const { error: linkError } = await supabase
          .from("promoters")
          .update({ user_id: user.id })
          .eq("id", byEmail.id)
          .is("user_id", null);

        if (linkError) throw linkError;

        // Re-fetch by user_id to confirm link & ensure we have the latest row.
        const { data: linked, error: linkedError } = await supabase
          .from("promoters")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (linkedError) throw linkedError;

        setPromoter(linked);
        setIsPromoter(!!linked);
      } catch (error) {
        console.error("Error fetching promoter:", error);
        setPromoter(null);
        setIsPromoter(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoter();
  }, [user, authLoading]);

  return { promoter, loading: authLoading || loading, isPromoter, user };
}
