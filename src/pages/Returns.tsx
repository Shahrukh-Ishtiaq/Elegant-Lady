import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

const Returns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Returns & Exchanges</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Return Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We want you to love your purchase! If you're not completely satisfied, 
                you can return or exchange items within 7 days of delivery.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Eligible for Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Items in original condition with tags attached</li>
                <li>Unworn and unwashed items</li>
                <li>Items in original packaging</li>
                <li>Wrong size or color received</li>
                <li>Defective or damaged items</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Not Eligible for Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Intimate wear and undergarments (for hygiene reasons)</li>
                <li>Items worn, washed, or altered</li>
                <li>Items without original tags</li>
                <li>Sale or clearance items</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                How to Return
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Contact us via WhatsApp or email within 7 days of delivery</li>
                <li>Provide your order number and reason for return</li>
                <li>Pack the item securely in original packaging</li>
                <li>Ship the item back to our address</li>
                <li>Refund will be processed within 5-7 business days</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Note:</strong> Return shipping costs are the responsibility of the customer, 
                except in cases of defective or wrong items.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Returns;
