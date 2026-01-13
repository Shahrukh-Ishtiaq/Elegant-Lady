import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, ArrowRight } from "lucide-react";
import { Promotion } from "@/hooks/usePromotions";

interface PromoBannerProps {
  promotion: Promotion;
  variant?: "default" | "compact";
}

export function PromoBanner({ promotion, variant = "default" }: PromoBannerProps) {
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-accent/80 to-primary/20 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{promotion.title}</span>
            {promotion.badge_text && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {promotion.badge_text}
              </Badge>
            )}
          </div>
          <Link to="/shop">
            <Button size="sm" variant="ghost" className="text-primary h-8">
              Shop Now <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 rounded-xl p-6 mb-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.3),transparent)]" />
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-full">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{promotion.title}</h3>
              {promotion.badge_text && (
                <Badge className="bg-primary text-primary-foreground animate-pulse">
                  {promotion.badge_text}
                </Badge>
              )}
            </div>
            {promotion.description && (
              <p className="text-muted-foreground">{promotion.description}</p>
            )}
          </div>
        </div>
        <Link to="/shop">
          <Button className="shadow-soft group">
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
