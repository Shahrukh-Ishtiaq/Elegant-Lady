import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { usePromotions } from "@/hooks/usePromotions";
import { CartPromo } from "@/components/promotions/CartPromo";
import { PromoBanner } from "@/components/promotions/PromoBanner";

const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { promotions, activePromo } = usePromotions();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={0} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
            <h2 className="text-3xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">Discover our beautiful collection.</p>
            <Link to="/shop">
              <Button variant="default" size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cart.length} />
      <div className="container mx-auto px-4 py-8">
        {/* Cart Promo Banner */}
        {activePromo && <PromoBanner promotion={activePromo} variant="compact" />}

        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <Card key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${index}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <img src={item.images[0]} alt={item.name} className="w-24 h-24 object-cover rounded" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">Size: {item.selectedSize} | Color: {item.selectedColor}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-lg font-bold text-primary">PKR {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>PKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "Free" : `PKR ${shipping}`}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>Total</span>
                  <span className="text-primary">PKR {total.toLocaleString()}</span>
                </div>
                <Link to="/checkout">
                  <Button className="w-full" size="lg">Proceed to Checkout</Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" className="w-full">Continue Shopping</Button>
                </Link>

                {/* Cart Promo */}
                {promotions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <CartPromo promotion={promotions[0]} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
