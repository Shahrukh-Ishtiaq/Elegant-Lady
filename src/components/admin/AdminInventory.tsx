import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Bell,
  Search,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  in_stock: boolean;
  price: number;
  images: string[];
  category_id: string | null;
}

interface InventoryStats {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  healthyStock: number;
}

const LOW_STOCK_THRESHOLD = 5;

export const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    healthyStock: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, in_stock, price, images, category_id")
        .order("stock_quantity", { ascending: true });

      if (error) throw error;

      const productData = data || [];
      setProducts(productData);

      // Calculate stats
      const outOfStock = productData.filter((p) => !p.in_stock || p.stock_quantity === 0).length;
      const lowStock = productData.filter(
        (p) => p.in_stock && p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD
      ).length;
      const healthyStock = productData.filter((p) => p.stock_quantity > LOW_STOCK_THRESHOLD).length;

      setStats({
        totalProducts: productData.length,
        outOfStock,
        lowStock,
        healthyStock,
      });

      // Show alerts for critical stock
      if (outOfStock > 0) {
        toast.warning(`${outOfStock} product(s) are out of stock!`);
      }
      if (lowStock > 0) {
        toast.info(`${lowStock} product(s) have low stock`);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          stock_quantity: newQuantity,
          in_stock: newQuantity > 0,
        })
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stock_quantity: newQuantity, in_stock: newQuantity > 0 }
            : p
        )
      );
      toast.success("Stock updated");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const getStockStatus = (quantity: number, inStock: boolean) => {
    if (!inStock || quantity === 0) {
      return { label: "Out of Stock", color: "bg-destructive", variant: "destructive" as const };
    }
    if (quantity <= LOW_STOCK_THRESHOLD) {
      return { label: "Low Stock", color: "bg-yellow-500", variant: "secondary" as const };
    }
    return { label: "In Stock", color: "bg-green-500", variant: "default" as const };
  };

  const getStockProgress = (quantity: number) => {
    // Assuming max stock of 100 for progress bar
    return Math.min((quantity / 100) * 100, 100);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "low") {
      return matchesSearch && product.in_stock && product.stock_quantity <= LOW_STOCK_THRESHOLD && product.stock_quantity > 0;
    }
    if (filter === "out") {
      return matchesSearch && (!product.in_stock || product.stock_quantity === 0);
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.outOfStock > 0 ? "border-destructive" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.lowStock > 0 ? "border-yellow-500" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.healthyStock}</p>
              </div>
              <Bell className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchProducts}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("low")}
                className={filter === "low" ? "" : "text-yellow-600 border-yellow-300"}
              >
                Low Stock ({stats.lowStock})
              </Button>
              <Button
                variant={filter === "out" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setFilter("out")}
                className={filter === "out" ? "" : "text-destructive border-destructive/30"}
              >
                Out of Stock ({stats.outOfStock})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product.stock_quantity, product.in_stock);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={product.stock_quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              updateStock(product.id, val);
                            }}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="w-32">
                          <div className="space-y-1">
                            <Progress value={getStockProgress(product.stock_quantity)} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {product.stock_quantity} units
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStock(product.id, product.stock_quantity + 10)}
                            >
                              +10
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStock(product.id, product.stock_quantity + 50)}
                            >
                              +50
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};