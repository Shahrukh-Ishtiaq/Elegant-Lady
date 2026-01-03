import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ruler } from "lucide-react";

const SizeGuide = () => {
  const braSizes = [
    { size: "32B", bust: "32-33", under: "28-29" },
    { size: "34B", bust: "34-35", under: "30-31" },
    { size: "36B", bust: "36-37", under: "32-33" },
    { size: "38B", bust: "38-39", under: "34-35" },
    { size: "32C", bust: "33-34", under: "28-29" },
    { size: "34C", bust: "35-36", under: "30-31" },
    { size: "36C", bust: "37-38", under: "32-33" },
    { size: "38C", bust: "39-40", under: "34-35" },
  ];

  const pantySizes = [
    { size: "S", waist: "24-26", hip: "34-36" },
    { size: "M", waist: "27-29", hip: "37-39" },
    { size: "L", waist: "30-32", hip: "40-42" },
    { size: "XL", waist: "33-35", hip: "43-45" },
    { size: "XXL", waist: "36-38", hip: "46-48" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Size Guide</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                How to Measure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Bust Measurement</h3>
                  <p className="text-muted-foreground text-sm">
                    Measure around the fullest part of your bust, keeping the tape parallel to the floor.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Under Bust</h3>
                  <p className="text-muted-foreground text-sm">
                    Measure directly under your bust, where the band of your bra sits.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Waist Measurement</h3>
                  <p className="text-muted-foreground text-sm">
                    Measure around your natural waistline, the narrowest part of your torso.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Hip Measurement</h3>
                  <p className="text-muted-foreground text-sm">
                    Measure around the fullest part of your hips.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bra Size Chart (inches)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Bust</TableHead>
                    <TableHead>Under Bust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {braSizes.map((item) => (
                    <TableRow key={item.size}>
                      <TableCell className="font-medium">{item.size}</TableCell>
                      <TableCell>{item.bust}"</TableCell>
                      <TableCell>{item.under}"</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Panty Size Chart (inches)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Waist</TableHead>
                    <TableHead>Hip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pantySizes.map((item) => (
                    <TableRow key={item.size}>
                      <TableCell className="font-medium">{item.size}</TableCell>
                      <TableCell>{item.waist}"</TableCell>
                      <TableCell>{item.hip}"</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="text-center text-muted-foreground">
            <p>Need help finding your size? Contact us on WhatsApp for personalized assistance!</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SizeGuide;
