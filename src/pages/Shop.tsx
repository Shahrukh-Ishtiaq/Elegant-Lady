import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { products } from "@/data/products";
import { ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const wishlistFilter = searchParams.get("filter");
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || "all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  
  const { cart, addToCart, toggleWishlist, isInWishlist, wishlist } = useCart();

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Wishlist filter
    if (wishlistFilter === "wishlist") {
      filtered = filtered.filter((product) => isInWishlist(product.id));
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Color filter
    if (selectedColor !== "all") {
      filtered = filtered.filter((product) =>
        product.colors.some(c => c.toLowerCase().includes(selectedColor.toLowerCase()))
      );
    }
    
    // Price filter
    if (priceRange !== "all") {
      filtered = filtered.filter((product) => {
        const price = product.price;
        if (priceRange === "under2000" && price >= 2000) return false;
        if (priceRange === "2000-3500" && (price < 2000 || price > 3500)) return false;
        if (priceRange === "over3500" && price <= 3500) return false;
        return true;
      });
    }
    
    return filtered;
  }, [selectedCategory, selectedColor, priceRange, searchQuery, wishlistFilter, wishlist, isInWishlist]);

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      ...product,
      quantity: 1,
      selectedSize: product.sizes[0],
      selectedColor: product.colors[0],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cart.length} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {wishlistFilter === "wishlist" ? "My Wishlist" : searchQuery ? `Search results for "${searchQuery}"` : "Shop All"}
          </h1>
          <p className="text-muted-foreground">
            {wishlistFilter === "wishlist" ? "Your favorite items" : "Discover your perfect pieces"}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="bras">Bras</SelectItem>
              <SelectItem value="panties">Panties</SelectItem>
              <SelectItem value="nightwear">Nightwear</SelectItem>
              <SelectItem value="loungewear">Loungewear</SelectItem>
              <SelectItem value="shapewear">Shapewear</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              <SelectItem value="blush">Blush Pink</SelectItem>
              <SelectItem value="cream">Cream</SelectItem>
              <SelectItem value="nude">Nude</SelectItem>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="black">Black</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under2000">Under PKR 2,000</SelectItem>
              <SelectItem value="2000-3500">PKR 2,000 - 3,500</SelectItem>
              <SelectItem value="over3500">Over PKR 3,500</SelectItem>
            </SelectContent>
          </Select>

          {(selectedCategory !== "all" || selectedColor !== "all" || priceRange !== "all") && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedCategory("all");
                setSelectedColor("all");
                setPriceRange("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-none shadow-soft hover:shadow-elegant transition-all group">
              <Link to={`/product/${product.id}`}>
                <div className="relative overflow-hidden rounded-t-lg aspect-[3/4] bg-muted">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.inStock && (
                    <Badge className="absolute top-4 right-4 bg-accent">New</Badge>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <Link to={`/product/${product.id}`}>
                  <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-primary">PKR {product.price.toLocaleString()}</p>
                </Link>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button 
                  className="flex-1" 
                  variant="default"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleWishlist(product.id)}
                  className={isInWishlist(product.id) ? "text-primary" : ""}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found matching your filters.</p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedColor("all");
                setPriceRange("all");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Shop;
