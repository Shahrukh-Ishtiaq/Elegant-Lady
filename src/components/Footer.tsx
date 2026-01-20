import { Link } from "react-router-dom";
import { Instagram, Facebook, Heart, ExternalLink } from "lucide-react";
import daisyLogo from "@/assets/daisy-logo.png";
import nexoraLogo from "@/assets/nexora-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={daisyLogo} 
                alt="DAISY Logo" 
                className="h-28 md:h-32 w-auto object-contain drop-shadow-lg"
              />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              <span className="font-semibold text-primary">Delicate Details, Distinctive.</span>
              <br />
              Premium lingerie for the modern woman.
            </p>
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

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 <span className="font-semibold text-primary">DAISY</span>. All rights reserved. | Delicate Details, Distinctive
            </p>
            
            {/* Powered by Nexora Studio */}
            <a 
              href="https://nexora-studio-web.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <span>Powered by</span>
              <img 
                src={nexoraLogo} 
                alt="Nexora Studio" 
                className="h-6 w-6 object-contain"
              />
              <span className="font-medium">Nexora Studio</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
