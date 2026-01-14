import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Validation schema for checkout form
const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().min(5, "Phone number too short").max(20, "Phone number too long").regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  address: z.string().min(5, "Address is required").max(500, "Address too long"),
  city: z.string().min(2, "City is required").max(100, "City name too long"),
  state: z.string().min(2, "State/Province is required").max(100, "State name too long"),
  zip: z.string().min(3, "Postal code is required").max(20, "Postal code too long"),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // Update email when user loads
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user?.email]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const sendOrderConfirmationEmail = async (orderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderId,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            image: item.images?.[0],
          })),
          total,
          shippingAddress: formData,
          paymentMethod,
        },
      });

      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Order confirmation email sent");
      }
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Ensure user is logged in (guest checkout disabled)
    if (!user?.id) {
      toast.error("Please sign in to complete your order");
      navigate("/auth");
      return;
    }

    // Validate form data with zod
    const validationResult = checkoutSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order items for atomic function
      const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        image: item.images[0],
      }));

      // Prepare shipping address
      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      };

      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('create_order_atomic', {
        p_user_id: user.id,
        p_total: total,
        p_shipping_address: shippingAddress,
        p_payment_method: paymentMethod,
        p_items: orderItems,
      });

      if (error) {
        // Handle specific error messages from the atomic function
        const errorMsg = error.message || '';
        
        if (errorMsg.includes('out of stock')) {
          toast.error(errorMsg);
        } else if (errorMsg.includes('not found in our catalog')) {
          toast.error("Some items in your cart are no longer available. Please refresh and try again.");
        } else if (errorMsg.includes('units of')) {
          toast.error(errorMsg);
        } else if (errorMsg.includes('must be logged in')) {
          toast.error("Please sign in to complete your order");
          navigate("/auth");
        } else {
          console.error("Order placement error:", error);
          toast.error("Unable to process your order. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }
      // Extract order ID from response (cast to proper type)
      const responseData = data as { order_id?: string } | null;
      const orderId = responseData?.order_id;

      // Send order confirmation email
      if (orderId) {
        await sendOrderConfirmationEmail(orderId);
      }

      const paymentMsg = paymentMethod === "card" 
        ? "Payment processed successfully! Order confirmed." 
        : "Order placed successfully! You will receive a confirmation email.";
      
      toast.success(paymentMsg);
      clearCart();
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in and has items in cart, show login prompt
  if (!user && cart.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <AlertCircle className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Sign In Required</h2>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign up or log in to continue with your order.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground">
              Create an account or sign in to complete your purchase. Your cart items will be saved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign In / Sign Up
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
            <h2 className="text-3xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">Add items to your cart before checkout.</p>
            <Link to="/shop">
              <Button variant="default" size="lg">Browse Products</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required 
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required 
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone}
                      onChange={handleInputChange}
                      required 
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={formData.address}
                      onChange={handleInputChange}
                      required 
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        value={formData.city}
                        onChange={handleInputChange}
                        required 
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input 
                        id="state" 
                        value={formData.state}
                        onChange={handleInputChange}
                        required 
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">Postal Code</Label>
                      <Input 
                        id="zip" 
                        value={formData.zip}
                        onChange={handleInputChange}
                        required 
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" disabled={isSubmitting} />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground mt-2">
                    Currently only Cash on Delivery is available. Card payments coming soon.
                  </p>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Place Order - PKR ${total.toLocaleString()}`
                )}
              </Button>
            </form>
          </div>

          <div>
            <Card className="border-none shadow-soft sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex gap-3">
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.selectedSize} / {item.selectedColor} × {item.quantity}
                        </p>
                        <p className="text-sm font-semibold">
                          PKR {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>PKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shipping === 0 ? "text-green-600" : ""}>
                      {shipping === 0 ? "Free" : `PKR ${shipping}`}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">PKR {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>Your personal data will be used to process your order and support your experience throughout this website.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;