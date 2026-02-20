import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Heart, ArrowLeft, ChevronLeft, ChevronRight, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { StarRating } from "@/components/StarRating";
import { ProductReviews } from "@/components/ProductReviews";
import { SizeGuidePopup } from "@/components/SizeGuidePopup";
import { usePromotions } from "@/hooks/usePromotions";
import { PromoSidebar } from "@/components/promotions/PromoSidebar";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  rating: number | null;
  review_count: number | null;
  is_new: boolean | null;
  is_frozen: boolean | null;
  category?: { id: string; name: string };
}

const ProductDetail = () => {
  const { id } = useParams();
  const { cart, addToCart, toggleWishlist, isInWishlist } = useCart();
  const { promotions } = usePromotions();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`*, category:categories(id, name)`)
        .eq('id', id)
        .single();

      if (data && !error) {
        setProduct(data as Product);
        
        // Fetch related products from same category first
        let relatedList: Product[] = [];
        if (data.category?.id) {
          const { data: sameCategory } = await supabase
            .from('products')
            .select(`*, category:categories(id, name)`)
            .eq('category_id', data.category.id)
            .neq('id', id)
            .eq('is_frozen', false)
            .limit(8);
          
          if (sameCategory) relatedList = sameCategory as Product[];
        }

        // If less than 8, fill with other products (any category)
        if (relatedList.length < 8) {
          const excludeIds = [id, ...relatedList.map(p => p.id)];
          const needed = 8 - relatedList.length;
          const { data: others } = await supabase
            .from('products')
            .select(`*, category:categories(id, name)`)
            .not('id', 'in', `(${excludeIds.join(',')})`)
            .eq('is_frozen', false)
            .order('rating', { ascending: false })
            .limit(needed);
          
          if (others) relatedList = [...relatedList, ...(others as Product[])];
        }

        setRelatedProducts(relatedList);
      }
      setLoading(false);
    };

    fetchProduct();
    setSelectedImage(0);
    setSelectedSize("");
    setSelectedColor("");
  }, [id]);

  // Check if product is truly available (in_stock and has stock quantity)
  const isProductAvailable = product?.in_stock !== false && (product?.stock_quantity || 0) > 0;

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    // Re-check stock before adding to cart
    const { data: currentProduct } = await supabase
      .from('products')
      .select('stock_quantity, in_stock')
      .eq('id', product.id)
      .single();
    
    if (!currentProduct?.in_stock || (currentProduct?.stock_quantity || 0) <= 0) {
      toast.error("Sorry, this product is now out of stock!");
      // Update local state
      setProduct(prev => prev ? { ...prev, in_stock: false, stock_quantity: 0 } : null);
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || '',
      category: product.category?.name || '',
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      inStock: product.in_stock || false,
      rating: product.rating || 0,
      reviewCount: product.review_count || 0,
      quantity: 1,
      selectedSize,
      selectedColor,
    });
  };

  const images = product?.images || [];
  const nextImage = () => setSelectedImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + images.length) % images.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cart.length} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[3/4] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product || product.is_frozen) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cart.length} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not available</h1>
          <p className="text-muted-foreground mb-6">This product is currently unavailable.</p>
          <Link to="/shop">
            <Button variant="default">Return to Shop</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cart.length} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/shop" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-soft group">
              {images.length > 0 ? (
                <>
                  <motion.img 
                    key={selectedImage}
                    src={images[selectedImage]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
              
              {product.discount_percentage && product.discount_percentage > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  {product.discount_percentage}% OFF
                </Badge>
              )}
              {product.is_new && (
                <Badge className="absolute top-4 right-4 bg-accent">New</Badge>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((img, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square overflow-hidden rounded-lg bg-muted border-2 transition-all cursor-pointer ${
                      selectedImage === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2">{product.category?.name || 'Uncategorized'}</Badge>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={product.rating || 0} size="md" showValue />
                <span className="text-sm text-muted-foreground">
                  ({product.review_count || 0} reviews)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-primary">PKR {product.price.toLocaleString()}</p>
                {product.original_price && product.original_price > product.price && (
                  <p className="text-xl text-muted-foreground line-through">
                    PKR {product.original_price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-muted-foreground text-lg">{product.description}</p>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Select Size</label>
                  <SizeGuidePopup 
                    category={product.category?.name}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 h-auto py-1">
                        <Ruler className="h-4 w-4" />
                        Size Guide
                      </Button>
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      className="min-w-[60px]"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-semibold">Select Color</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleAddToCart}
                disabled={!isProductAvailable}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isProductAvailable ? "Add to Cart" : "Out of Stock"}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => toggleWishlist(product.id)}
                className={isInWishlist(product.id) ? "text-primary" : ""}
              >
                <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Product Details</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {product.sizes && product.sizes.length > 0 && (
                    <li>• Available in {product.sizes.length} sizes</li>
                  )}
                  {product.colors && product.colors.length > 0 && (
                    <li>• {product.colors.length} color options</li>
                  )}
                  <li>• Premium quality fabric</li>
                  <li>• Machine washable</li>
                  <li>• Designed for all-day comfort</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Shipping & Returns</h3>
                <p className="text-sm text-muted-foreground">
                  Free shipping on orders over PKR 5,000. Easy 30-day returns.
                </p>
              </div>
            </div>

            {/* Promo Sidebar */}
            {promotions.length > 0 && (
              <div className="border-t pt-6">
                <PromoSidebar promotions={promotions} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div 
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-8">Customer Reviews</h2>
          <ProductReviews 
            productId={product.id} 
            productRating={product.rating || 0} 
            reviewCount={product.review_count || 0} 
          />
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div 
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">You May Also Like</h2>
                <p className="text-muted-foreground mt-1">Handpicked products just for you</p>
              </div>
              <Link to="/shop">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct, idx) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  whileHover={{ y: -4 }}
                >
                  <Link to={`/product/${relatedProduct.id}`} className="block group">
                    <Card className="border-none shadow-soft group-hover:shadow-elegant transition-all duration-300 overflow-hidden">
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                        {relatedProduct.images && relatedProduct.images[0] ? (
                          <img 
                            src={relatedProduct.images[0]} 
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {relatedProduct.discount_percentage && relatedProduct.discount_percentage > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5">
                              -{relatedProduct.discount_percentage}%
                            </Badge>
                          )}
                          {relatedProduct.is_new && (
                            <Badge className="bg-accent text-xs px-1.5 py-0.5">New</Badge>
                          )}
                        </div>
                        {/* Category tag */}
                        {relatedProduct.category?.name && (
                          <div className="absolute bottom-2 left-2">
                            <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-0.5 rounded-full">
                              {relatedProduct.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mb-2">
                          <StarRating rating={relatedProduct.rating || 0} size="sm" />
                          <span className="text-xs text-muted-foreground">({relatedProduct.review_count || 0})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-base md:text-lg font-bold text-primary">
                            PKR {relatedProduct.price.toLocaleString()}
                          </p>
                          {relatedProduct.original_price && relatedProduct.original_price > relatedProduct.price && (
                            <p className="text-xs text-muted-foreground line-through">
                              PKR {relatedProduct.original_price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;