import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ShoppingBag, AlertCircle, Scale } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                By accessing or using DAISY's website and services, you agree to be bound 
                by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Orders & Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>All prices are listed in Pakistani Rupees (PKR)</li>
                <li>We reserve the right to cancel orders due to stock unavailability</li>
                <li>Payment is due at the time of order or upon delivery (COD)</li>
                <li>Orders are confirmed via email and SMS</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>We strive to display accurate product colors and details</li>
                <li>Actual colors may vary slightly due to screen settings</li>
                <li>Product availability is subject to change without notice</li>
                <li>We reserve the right to limit quantities per order</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                DAISY shall not be liable for any indirect, incidental, or consequential damages 
                arising from the use of our products or services. Our liability is limited to the 
                purchase price of the products ordered.
              </p>
            </CardContent>
          </Card>

          <div className="text-center text-muted-foreground text-sm">
            <p>Last updated: January 2025</p>
            <p className="mt-2">For questions, contact us at infodaisy221@gmail.com</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
