import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

const Admin = () => {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Product added successfully!");
    setProductName("");
    setProductPrice("");
    setProductCategory("");
  };

  // Mock data
  const orders = [
    { id: "ORD001", customer: "Sarah Ahmed", status: "Processing", total: 6449, date: "2025-01-15" },
    { id: "ORD002", customer: "Fatima Khan", status: "Shipped", total: 4250, date: "2025-01-14" },
    { id: "ORD003", customer: "Ayesha Ali", status: "Delivered", total: 8750, date: "2025-01-13" },
    { id: "ORD004", customer: "Zainab Malik", status: "Processing", total: 3299, date: "2025-01-12" },
  ];

  const stats = [
    { title: "Total Revenue", value: "PKR 456,000", icon: TrendingUp, change: "+12.5%" },
    { title: "Total Orders", value: "234", icon: ShoppingCart, change: "+8.2%" },
    { title: "Products", value: "30", icon: Package, change: "+3" },
    { title: "Customers", value: "189", icon: Users, change: "+15.3%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Lovabelle store</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-none shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{stat.change}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="add-product">Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="border-none shadow-soft">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Manage and track customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === "Delivered" ? "default" : 
                              order.status === "Shipped" ? "secondary" : 
                              "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell className="text-right">PKR {order.total.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="border-none shadow-soft">
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>View and manage your product catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enable Lovable Cloud to manage products with a database. Currently showing 30 products from mock data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-product">
            <Card className="border-none shadow-soft">
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>Create a new product listing</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input 
                      id="product-name"
                      placeholder="e.g., Silk Lace Bralette"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-price">Price (PKR)</Label>
                      <Input 
                        id="product-price"
                        type="number"
                        placeholder="e.g., 2450"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-category">Category</Label>
                      <Input 
                        id="product-category"
                        placeholder="e.g., Bras"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-description">Description</Label>
                    <textarea 
                      id="product-description"
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                      placeholder="Describe the product features and benefits..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-image">Product Image</Label>
                    <Input 
                      id="product-image"
                      type="file"
                      accept="image/*"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Add Product
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    Enable Lovable Cloud to store products in a database
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
