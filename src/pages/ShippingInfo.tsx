import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, MapPin, Package } from "lucide-react";

const ShippingInfo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Shipping Information</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Delivery Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We deliver across Pakistan with the following shipping options:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Major Cities:</strong> Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad - 2-3 business days</li>
                <li><strong>Other Cities:</strong> 3-5 business days</li>
                <li><strong>Remote Areas:</strong> 5-7 business days</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Shipping Charges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>• Orders above PKR 3,000: <strong className="text-primary">FREE Shipping</strong></li>
                <li>• Orders below PKR 3,000: PKR 200 flat rate</li>
                <li>• Express delivery: Additional PKR 300</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Order Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Orders are processed within 24 hours on business days. 
                You will receive a confirmation email with tracking details once your order is shipped.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Cash on Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We offer Cash on Delivery (COD) service across Pakistan. 
                Please have the exact amount ready at the time of delivery.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ShippingInfo;
