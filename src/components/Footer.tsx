import { Link } from "react-router-dom";
import { Instagram, Facebook, Heart } from "lucide-react";
import elegantLadyLogo from "@/assets/elegant-lady-logo-gold.png";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={elegantLadyLogo} 
                alt="Elegant Lady Logo" 
                className="h-12 w-12 md:h-16 md:w-16 object-contain"
              />
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-primary drop-shadow-sm">
                  Elegant Lady
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground italic">
                  Seamless comfort anytime.
                </p>
              </div>
            </div>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop?category=bras" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Bras
                </Link>
              </li>
              <li>
                <Link to="/shop?category=panties" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Panties
                </Link>
              </li>
              <li>
                <Link to="/shop?category=nightwear" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Nightwear
                </Link>
              </li>
              <li>
                <Link to="/shop?category=loungewear" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Loungewear
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 <span className="font-semibold text-primary">Elegant Lady</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
