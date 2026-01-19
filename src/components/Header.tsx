import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  LogOut,
  Shield,
  Package,
  UserCircle,
} from "lucide-react";
import daisyLogo from "@/assets/daisy-logo.png";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface HeaderProps {
  cartItemCount?: number;
}

export const Header = ({ cartItemCount }: HeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { cart, wishlist } = useCart();
  const { user, isAdmin, signOut } = useAuth();

  const displayCartCount =
    cartItemCount !== undefined ? cartItemCount : cart.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center"
                    >
                      <img
                        src={daisyLogo}
                        alt="DAISY"
                        className="h-20 w-auto object-contain"
                      />
                      <span className="text-xs text-muted-foreground mt-1">Delicate Details, Distinctive</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-lg font-medium hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-lg font-medium hover:text-primary transition-colors py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Signed in as {user.email}
                        </p>
                        <Link
                          to="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant="outline"
                            className="w-full justify-start mb-2"
                          >
                            <UserCircle className="mr-2 h-4 w-4" />
                            My Profile
                          </Button>
                        </Link>
                        <Link
                          to="/my-orders"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant="outline"
                            className="w-full justify-start mb-2"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            My Orders
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleSignOut}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          Sign In / Sign Up
                        </Button>
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* LOGO (DESKTOP LEFT, MOBILE CENTER) - LARGER SIZE */}
          <div className="relative flex items-center h-24">
            <Link to="/" className="flex flex-col items-center">
              <img
                src={daisyLogo}
                alt="DAISY"
                className="h-16 md:h-20 w-auto object-contain drop-shadow-md"
              />
              <span className="hidden md:block text-[10px] text-muted-foreground tracking-wide">Delicate Details, Distinctive</span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 md:w-64"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                >
                  ✕
                </Button>
              </form>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>

                <div className="hidden md:flex items-center gap-1">
                  {user ? (
                    <>
                      <Link to="/profile">
                        <Button variant="ghost" size="icon" title="My Profile">
                          <UserCircle className="h-5 w-5" />
                        </Button>
                      </Link>
                      <Link to="/my-orders">
                        <Button variant="ghost" size="icon" title="My Orders">
                          <Package className="h-5 w-5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        title="Sign Out"
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth">
                      <Button variant="ghost" size="icon" title="Sign In">
                        <User className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>

                <Link to="/shop?filter=wishlist">
                  <Button variant="ghost" size="icon" className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlist.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {wishlist.length}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {displayCartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {displayCartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
