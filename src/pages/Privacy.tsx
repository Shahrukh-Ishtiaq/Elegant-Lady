import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, FileText } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Name and contact information</li>
                <li>Shipping and billing addresses</li>
                <li>Email address and phone number</li>
                <li>Order history and preferences</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send promotional offers (with your consent)</li>
                <li>Improve our products and services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. 
                Your data is stored securely and is only accessible to authorized personnel.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at infodaisy221@gmail.com
              </p>
            </CardContent>
          </Card>

          <div className="text-center text-muted-foreground text-sm">
            <p>Last updated: January 2025</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
