import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler, Info } from "lucide-react";

interface SizeGuidePopupProps {
  category?: string;
  trigger?: React.ReactNode;
}

const braSizes = [
  { size: "32A", bust: "31-32", under: "27-28", cup: "A" },
  { size: "32B", bust: "32-33", under: "27-28", cup: "B" },
  { size: "32C", bust: "33-34", under: "27-28", cup: "C" },
  { size: "34A", bust: "33-34", under: "29-30", cup: "A" },
  { size: "34B", bust: "34-35", under: "29-30", cup: "B" },
  { size: "34C", bust: "35-36", under: "29-30", cup: "C" },
  { size: "34D", bust: "36-37", under: "29-30", cup: "D" },
  { size: "36B", bust: "36-37", under: "31-32", cup: "B" },
  { size: "36C", bust: "37-38", under: "31-32", cup: "C" },
  { size: "36D", bust: "38-39", under: "31-32", cup: "D" },
  { size: "38B", bust: "38-39", under: "33-34", cup: "B" },
  { size: "38C", bust: "39-40", under: "33-34", cup: "C" },
  { size: "38D", bust: "40-41", under: "33-34", cup: "D" },
  { size: "40C", bust: "41-42", under: "35-36", cup: "C" },
  { size: "40D", bust: "42-43", under: "35-36", cup: "D" },
];

const pantySizes = [
  { size: "XS", waist: "22-24", hip: "32-34", usSize: "0-2" },
  { size: "S", waist: "24-26", hip: "34-36", usSize: "4-6" },
  { size: "M", waist: "27-29", hip: "37-39", usSize: "8-10" },
  { size: "L", waist: "30-32", hip: "40-42", usSize: "12-14" },
  { size: "XL", waist: "33-35", hip: "43-45", usSize: "16-18" },
  { size: "XXL", waist: "36-38", hip: "46-48", usSize: "20-22" },
];

const nightwearSizes = [
  { size: "XS", bust: "30-32", waist: "22-24", hip: "32-34", length: "Short" },
  { size: "S", bust: "32-34", waist: "24-26", hip: "34-36", length: "Regular" },
  { size: "M", bust: "34-36", waist: "27-29", hip: "37-39", length: "Regular" },
  { size: "L", bust: "36-38", waist: "30-32", hip: "40-42", length: "Regular" },
  { size: "XL", bust: "38-40", waist: "33-35", hip: "43-45", length: "Long" },
  { size: "XXL", bust: "40-42", waist: "36-38", hip: "46-48", length: "Long" },
];

const shapewearSizes = [
  { size: "S", waist: "24-26", hip: "34-36", compression: "Medium" },
  { size: "M", waist: "27-29", hip: "37-39", compression: "Medium" },
  { size: "L", waist: "30-32", hip: "40-42", compression: "Firm" },
  { size: "XL", waist: "33-35", hip: "43-45", compression: "Firm" },
  { size: "XXL", waist: "36-38", hip: "46-48", compression: "Extra Firm" },
];

export const SizeGuidePopup = ({ category, trigger }: SizeGuidePopupProps) => {
  const getDefaultTab = () => {
    if (!category) return "bras";
    const cat = category.toLowerCase();
    if (cat.includes("bra") || cat.includes("bralette")) return "bras";
    if (cat.includes("panty") || cat.includes("panties") || cat.includes("bikini")) return "panties";
    if (cat.includes("night") || cat.includes("sleep") || cat.includes("lounge") || cat.includes("robe")) return "nightwear";
    if (cat.includes("shape") || cat.includes("body")) return "shapewear";
    return "bras";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1">
            <Ruler className="h-4 w-4" />
            Size Guide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Ruler className="h-6 w-6 text-primary" />
            Size Guide
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* How to Measure Section */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-primary" />
              How to Measure
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-foreground">Bust</p>
                <p className="text-muted-foreground">Measure around the fullest part of your bust, keeping the tape parallel to the floor.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Under Bust</p>
                <p className="text-muted-foreground">Measure directly under your bust where the bra band sits.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Waist</p>
                <p className="text-muted-foreground">Measure at your natural waistline, the narrowest part of your torso.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Hip</p>
                <p className="text-muted-foreground">Measure around the fullest part of your hips.</p>
              </div>
            </div>
          </div>

          {/* Size Charts */}
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="bras">Bras</TabsTrigger>
              <TabsTrigger value="panties">Panties</TabsTrigger>
              <TabsTrigger value="nightwear">Nightwear</TabsTrigger>
              <TabsTrigger value="shapewear">Shapewear</TabsTrigger>
            </TabsList>

            <TabsContent value="bras" className="mt-4">
              <h4 className="font-semibold mb-2">Bra Size Chart (inches)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Bust</TableHead>
                      <TableHead>Under Bust</TableHead>
                      <TableHead>Cup</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {braSizes.map((item) => (
                      <TableRow key={item.size}>
                        <TableCell className="font-medium">{item.size}</TableCell>
                        <TableCell>{item.bust}"</TableCell>
                        <TableCell>{item.under}"</TableCell>
                        <TableCell>{item.cup}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                💡 <strong>Tip:</strong> If you're between sizes, we recommend sizing up for comfort.
              </p>
            </TabsContent>

            <TabsContent value="panties" className="mt-4">
              <h4 className="font-semibold mb-2">Panty Size Chart (inches)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Waist</TableHead>
                      <TableHead>Hip</TableHead>
                      <TableHead>US Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pantySizes.map((item) => (
                      <TableRow key={item.size}>
                        <TableCell className="font-medium">{item.size}</TableCell>
                        <TableCell>{item.waist}"</TableCell>
                        <TableCell>{item.hip}"</TableCell>
                        <TableCell>{item.usSize}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                💡 <strong>Tip:</strong> For bikini and thong styles, consider your hip measurement as the primary guide.
              </p>
            </TabsContent>

            <TabsContent value="nightwear" className="mt-4">
              <h4 className="font-semibold mb-2">Nightwear & Loungewear Size Chart (inches)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Bust</TableHead>
                      <TableHead>Waist</TableHead>
                      <TableHead>Hip</TableHead>
                      <TableHead>Length</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nightwearSizes.map((item) => (
                      <TableRow key={item.size}>
                        <TableCell className="font-medium">{item.size}</TableCell>
                        <TableCell>{item.bust}"</TableCell>
                        <TableCell>{item.waist}"</TableCell>
                        <TableCell>{item.hip}"</TableCell>
                        <TableCell>{item.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                💡 <strong>Tip:</strong> For a relaxed fit, consider sizing up. Robes and loungewear are designed for comfort.
              </p>
            </TabsContent>

            <TabsContent value="shapewear" className="mt-4">
              <h4 className="font-semibold mb-2">Shapewear Size Chart (inches)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Waist</TableHead>
                      <TableHead>Hip</TableHead>
                      <TableHead>Compression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shapewearSizes.map((item) => (
                      <TableRow key={item.size}>
                        <TableCell className="font-medium">{item.size}</TableCell>
                        <TableCell>{item.waist}"</TableCell>
                        <TableCell>{item.hip}"</TableCell>
                        <TableCell>{item.compression}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                💡 <strong>Tip:</strong> Shapewear should fit snugly but not be uncomfortable. Don't size down for more compression.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Need help finding your size? Contact us on WhatsApp for personalized assistance!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
