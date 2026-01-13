import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PartyPopper, ArrowRight } from "lucide-react";
import { Promotion } from "@/hooks/usePromotions";

interface CartPromoProps {
  promotion: Promotion;
}

export function CartPromo({ promotion }: CartPromoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="bg-primary/10 p-2 rounded-full"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <PartyPopper className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{promotion.title}</span>
                {promotion.badge_text && (
                  <Badge className="bg-primary/20 text-primary text-xs">
                    {promotion.badge_text}
                  </Badge>
                )}
              </div>
              {promotion.description && (
                <p className="text-xs text-muted-foreground">{promotion.description}</p>
              )}
            </div>
            <Link to="/shop">
              <Button size="sm" variant="outline" className="shrink-0">
                Add More <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
