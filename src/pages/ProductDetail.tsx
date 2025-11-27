import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { products } from "@/data/products";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { StarRating } from "@/components/StarRating";
import { ProductReviews } from "@/components/ProductReviews";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { cart, addToCart, toggleWishlist, isInWishlist } = useCart();
  
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);
  
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

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }
    addToCart({
      ...product,
      quantity: 1,
      selectedSize,
      selectedColor,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cart.length} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/shop" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-soft">
              <img 
                src={product.images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square overflow-hidden rounded-lg bg-muted border-2 transition-colors cursor-pointer ${
                    selectedImage === idx ? "border-primary" : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={product.rating} size="md" showValue />
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
              </div>
              <p className="text-3xl font-bold text-primary">PKR {product.price.toLocaleString()}</p>
            </div>

            <p className="text-muted-foreground text-lg">
              {product.description}
            </p>

            {/* Size Selection */}
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

            {/* Color Selection */}
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

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
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
                  <li>• Available in {product.sizes.length} sizes</li>
                  <li>• {product.colors.length} color options</li>
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
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Customer Reviews</h2>
          <ProductReviews 
            productId={product.id} 
            productRating={product.rating} 
            reviewCount={product.reviewCount} 
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="border-none shadow-soft hover:shadow-elegant transition-all">
                  <Link to={`/product/${relatedProduct.id}`}>
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
                      <img 
                        src={relatedProduct.images[0]} 
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{relatedProduct.name}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={relatedProduct.rating} size="sm" />
                        <span className="text-xs text-muted-foreground">({relatedProduct.reviewCount})</span>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        PKR {relatedProduct.price.toLocaleString()}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
