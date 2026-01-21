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
        const { data, error } = await supabase
          .from("promoters")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (error) throw error;

        setPromoter(data);
        setIsPromoter(!!data);
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
