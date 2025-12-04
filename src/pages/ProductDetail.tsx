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
import { ShoppingCart, Heart, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { StarRating } from "@/components/StarRating";
import { ProductReviews } from "@/components/ProductReviews";

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
  rating: number | null;
  review_count: number | null;
  is_new: boolean | null;
  category?: { id: string; name: string };
}

const ProductDetail = () => {
  const { id } = useParams();
  const { cart, addToCart, toggleWishlist, isInWishlist } = useCart();
  
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
        
        // Fetch related products
        if (data.category?.id) {
          const { data: related } = await supabase
            .from('products')
            .select(`*, category:categories(id, name)`)
            .eq('category_id', data.category.id)
            .neq('id', id)
            .limit(4);
          
          if (related) setRelatedProducts(related as Product[]);
        }
      }
      setLoading(false);
    };

    fetchProduct();
    setSelectedImage(0);
    setSelectedSize("");
    setSelectedColor("");
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("Please select a color");
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cart.length} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
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
                <label className="text-sm font-semibold">Select Size</label>
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
                disabled={!product.in_stock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.in_stock ? "Add to Cart" : "Out of Stock"}
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
            <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, idx) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <Card className="border-none shadow-soft hover:shadow-elegant transition-all">
                    <Link to={`/product/${relatedProduct.id}`}>
                      <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
                        {relatedProduct.images && relatedProduct.images[0] ? (
                          <img 
                            src={relatedProduct.images[0]} 
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{relatedProduct.name}</h3>
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating rating={relatedProduct.rating || 0} size="sm" />
                          <span className="text-xs text-muted-foreground">({relatedProduct.review_count || 0})</span>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          PKR {relatedProduct.price.toLocaleString()}
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
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