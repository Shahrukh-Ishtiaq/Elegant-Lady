import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Heart, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { StarRating } from "@/components/StarRating";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  category_id: string;
  images: string[];
  sizes: string[];
  colors: string[];
  in_stock: boolean;
  stock_quantity: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_new: boolean;
  category?: { name: string };
}

const PRODUCTS_PER_PAGE = 8;

const Shop = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const wishlistFilter = searchParams.get("filter");
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || "all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(PRODUCTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { cart, addToCart, toggleWishlist, isInWishlist, wishlist } = useCart();

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('in_stock', true);
      
      if (data && !error) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    };

    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name');
      if (data) {
        setCategories(data);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

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
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.category?.name && product.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => 
        product.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Color filter
    if (selectedColor !== "all") {
      filtered = filtered.filter((product) =>
        product.colors && product.colors.some(c => c.toLowerCase().includes(selectedColor.toLowerCase()))
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

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((product) => (product.rating || 0) >= minRating);
    }
    
    return filtered;
  }, [products, selectedCategory, selectedColor, priceRange, ratingFilter, searchQuery, wishlistFilter, wishlist, isInWishlist]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, selectedColor, priceRange, ratingFilter, searchQuery, wishlistFilter]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const hasMoreProducts = displayCount < filteredProducts.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMoreProducts) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, filteredProducts.length));
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMoreProducts, filteredProducts.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMoreProducts, isLoadingMore]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || '',
      category: product.category?.name || '',
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      inStock: product.in_stock,
      rating: product.rating || 0,
      reviewCount: product.review_count || 0,
      quantity: 1,
      selectedSize: product.sizes?.[0] || '',
      selectedColor: product.colors?.[0] || '',
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedColor("all");
    setPriceRange("all");
    setRatingFilter("all");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedColor !== "all" || priceRange !== "all" || ratingFilter !== "all";

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
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                  {cat.name}
                </SelectItem>
              ))}
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

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {displayedProducts.length} of {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map((product) => (
              <Card key={product.id} className="border-none shadow-soft hover:shadow-elegant transition-all group">
                <Link to={`/product/${product.id}`}>
                  <div className="relative overflow-hidden rounded-t-lg aspect-[3/4] bg-muted">
                    {product.images && product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                    {product.discount_percentage > 0 && (
                      <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                        {product.discount_percentage}% OFF
                      </Badge>
                    )}
                    {product.is_new && (
                      <Badge className="absolute top-4 right-4 bg-accent">New</Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <Badge variant="secondary" className="mb-2">{product.category?.name || 'Uncategorized'}</Badge>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={product.rating || 0} size="sm" />
                      <span className="text-xs text-muted-foreground">({product.review_count || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-primary">PKR {product.price.toLocaleString()}</p>
                      {product.discount_percentage > 0 && product.original_price > product.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          PKR {product.original_price.toLocaleString()}
                        </p>
                      )}
                    </div>
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
        )}

        {/* Loading More Indicator */}
        {hasMoreProducts && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more products...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found matching your filters.</p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={clearAllFilters}
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
