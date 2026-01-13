import { usePromotions } from "@/hooks/usePromotions";
import { FloatingPromoBar } from "./FloatingPromoBar";

export function GlobalFloatingPromo() {
  const { promotions } = usePromotions();
  
  return <FloatingPromoBar promotions={promotions} />;
}
