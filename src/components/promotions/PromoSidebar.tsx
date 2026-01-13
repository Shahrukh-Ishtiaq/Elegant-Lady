import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Percent, ArrowRight } from "lucide-react";
import { Promotion } from "@/hooks/usePromotions";

interface PromoSidebarProps {
  promotions: Promotion[];
}

export function PromoSidebar({ promotions }: PromoSidebarProps) {
  if (promotions.length === 0) return null;

  const icons = [Sparkles, Gift, Percent];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        Special Offers
      </h3>
      {promotions.slice(0, 3).map((promo, index) => {
        const Icon = icons[index % icons.length];
        return (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-accent/50 to-background hover:shadow-soft transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm line-clamp-1">{promo.title}</span>
                      {promo.badge_text && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {promo.badge_text}
                        </Badge>
                      )}
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {promo.description}
                      </p>
                    )}
                    <Link to="/shop" className="inline-block mt-2">
                      <Button size="sm" variant="link" className="h-auto p-0 text-primary text-xs">
                        Explore <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
