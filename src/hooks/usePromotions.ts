import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  badge_text: string | null;
  is_active: boolean;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) setPromotions(data);
      setLoading(false);
    };

    fetchPromotions();
  }, []);

  return { promotions, loading, activePromo: promotions[0] };
}
