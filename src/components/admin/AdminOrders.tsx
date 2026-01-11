import { useState, useEffect } from "react";
import { supabase } from "../../integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Bell, Package, Eye, MapPin, Phone, Mail, CreditCard, Calendar, Filter, CalendarDays, Printer } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday, parseISO, startOfDay, endOfDay } from "date-fns";
import { useRef } from "react";

// HTML escape utility to prevent XSS attacks
const escapeHtml = (text: string | undefined | null): string => {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
  image?: string;
}

interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total: number;
  shipping_address: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  payment_method: string;
  items: OrderItem[];
  created_at: string;
}

type DateFilter = "all" | "today" | "yesterday" | "custom";

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDate, setCustomDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          const newOrder = {
            ...payload.new,
            shipping_address: payload.new.shipping_address as Order['shipping_address'],
            items: payload.new.items as Order['items'],
          } as Order;
          
          setOrders(prev => [newOrder, ...prev]);
          setNewOrderCount(prev => prev + 1);
          
          // Play notification sound
          playNotificationSound();
          
          // Show toast notification
          toast.success(
            `🔔 New Order Received!`,
            {
              description: `Order #${newOrder.id.slice(0, 8).toUpperCase()} - PKR ${Number(newOrder.total).toLocaleString()}`,
              duration: 10000,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply filters whenever orders, dateFilter, customDate, or statusFilter changes
  useEffect(() => {
    let filtered = [...orders];

    // Apply date filter
    if (dateFilter === "today") {
      filtered = filtered.filter(order => isToday(parseISO(order.created_at)));
    } else if (dateFilter === "yesterday") {
      filtered = filtered.filter(order => isYesterday(parseISO(order.created_at)));
    } else if (dateFilter === "custom" && customDate) {
      const selectedDate = parseISO(customDate);
      filtered = filtered.filter(order => {
        const orderDate = parseISO(order.created_at);
        return orderDate >= startOfDay(selectedDate) && orderDate <= endOfDay(selectedDate);
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, dateFilter, customDate, statusFilter]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound');
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const typedOrders = (data || []).map(order => ({
        ...order,
        shipping_address: order.shipping_address as Order['shipping_address'],
        items: order.items as Order['items'],
      }));
      
      setOrders(typedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success("Order status updated");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const clearNewOrderNotification = () => {
    setNewOrderCount(0);
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups for printing");
      return;
    }

    const orderDate = format(new Date(order.created_at), "MMMM dd, yyyy 'at' HH:mm");
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Order #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { padding: 20px; color: #333; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #d4a574; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #d4a574; }
    .order-info { text-align: right; }
    .order-id { font-size: 18px; font-weight: bold; color: #333; }
    .order-date { color: #666; font-size: 14px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #fef3cd; color: #856404; }
    .status.delivered { background: #d4edda; color: #155724; }
    .status.shipped { background: #cce5ff; color: #004085; }
    .status.processing { background: #e2d5f1; color: #5a3d8a; }
    .status.cancelled { background: #f8d7da; color: #721c24; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-block { background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .info-label { font-size: 12px; color: #888; margin-bottom: 4px; }
    .info-value { font-size: 14px; color: #333; font-weight: 500; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { text-align: left; padding: 12px; background: #f5f0eb; color: #666; font-size: 12px; text-transform: uppercase; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .product-cell { display: flex; align-items: center; gap: 12px; }
    .product-image { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
    .product-name { font-weight: 500; }
    .product-details { font-size: 12px; color: #666; margin-top: 4px; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; font-size: 16px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #d4a574; text-align: center; color: #888; font-size: 12px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">DAISY</div>
      <div style="color: #888; font-size: 12px;">Delicate Details, Distinctive You</div>
    </div>
    <div class="order-info">
      <div class="order-id">Order #${order.id.slice(0, 8).toUpperCase()}</div>
      <div class="order-date">${orderDate}</div>
      <div class="status ${order.status}">${order.status}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer & Shipping Information</div>
    <div class="grid">
      <div class="info-block">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${escapeHtml(order.shipping_address?.firstName)} ${escapeHtml(order.shipping_address?.lastName)}</div>
        <div class="info-label" style="margin-top: 12px;">Email</div>
        <div class="info-value">${escapeHtml(order.shipping_address?.email) || 'N/A'}</div>
        <div class="info-label" style="margin-top: 12px;">Phone</div>
        <div class="info-value">${escapeHtml(order.shipping_address?.phone) || 'N/A'}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Shipping Address</div>
        <div class="info-value">
          ${escapeHtml(order.shipping_address?.address)}<br/>
          ${escapeHtml(order.shipping_address?.city)}${order.shipping_address?.state ? ', ' + escapeHtml(order.shipping_address.state) : ''}${order.shipping_address?.zip ? ' ' + escapeHtml(order.shipping_address.zip) : ''}
        </div>
        <div class="info-label" style="margin-top: 12px;">Payment Method</div>
        <div class="info-value">${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card Payment'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Order Items</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Product</th>
          <th>Quantity</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items?.map(item => `
          <tr>
            <td>
              <div class="product-cell">
                ${item.image ? `<img src="${escapeHtml(item.image)}" class="product-image" alt="${escapeHtml(item.name)}" onerror="this.style.display='none'" />` : ''}
                <div>
                  <div class="product-name">${escapeHtml(item.name)}</div>
                  <div class="product-details">
                    ${item.selectedSize ? `Size: ${escapeHtml(item.selectedSize)}` : ''}
                    ${item.selectedSize && item.selectedColor ? ' • ' : ''}
                    ${item.selectedColor ? `Color: ${escapeHtml(item.selectedColor)}` : ''}
                  </div>
                </div>
              </div>
            </td>
            <td>${item.quantity}</td>
            <td class="text-right">PKR ${item.price.toLocaleString()}</td>
            <td class="text-right">PKR ${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `).join('') || ''}
        <tr class="total-row">
          <td colspan="3" class="text-right" style="border-top: 2px solid #d4a574; padding-top: 16px;">Order Total:</td>
          <td class="text-right" style="border-top: 2px solid #d4a574; padding-top: 16px; color: #d4a574;">PKR ${Number(order.total).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Thank you for shopping with DAISY!</p>
    <p>For any queries, please contact our customer support.</p>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "approved": return "bg-blue-500";
      case "processing": return "bg-purple-500";
      case "shipped": return "bg-indigo-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd, yyyy");
  };

  // Group orders by date
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const dateKey = format(parseISO(order.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            {newOrderCount > 0 && (
              <button
                onClick={clearNewOrderNotification}
                className="relative animate-bounce"
              >
                <Bell className="h-6 w-6 text-primary" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {newOrderCount}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live updates enabled
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
            <SelectTrigger className="w-36">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <Input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-40"
            />
          )}

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {(dateFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter("all");
                setStatusFilter("all");
                setCustomDate("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {dateFilter !== "all" || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "New orders will appear here automatically"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([dateKey, dateOrders]) => (
              <div key={dateKey} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {getDateLabel(dateOrders[0].created_at)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {dateOrders.length} order{dateOrders.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dateOrders.map((order) => (
                        <TableRow key={order.id} className={order.status === 'pending' ? 'bg-yellow-50/50' : ''}>
                          <TableCell className="font-mono text-xs">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">
                                {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {order.shipping_address?.email}
                              </p>
                              {order.shipping_address?.phone && (
                                <p className="text-muted-foreground text-xs">
                                  {order.shipping_address.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px]">
                              {order.items?.slice(0, 2).map((item, idx) => (
                                <p key={idx} className="text-sm truncate">
                                  {item.quantity}x {item.name}
                                </p>
                              ))}
                              {order.items?.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order.items.length - 2} more
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            PKR {Number(order.total).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.payment_method === "cod" ? "COD" : "Card"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewOrderDetails(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
              {selectedOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintOrder(selectedOrder)}
                  className="print:hidden ml-4"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print A4
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="text-2xl font-bold text-primary">
                    PKR {Number(selectedOrder.total).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOrder.shipping_address?.email || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedOrder.shipping_address?.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className="font-medium">
                        {selectedOrder.payment_method === "cod" ? "Cash on Delivery" : "Card"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h3>
                <div className="p-4 border rounded-lg">
                  <p>{selectedOrder.shipping_address?.address}</p>
                  <p>
                    {selectedOrder.shipping_address?.city}
                    {selectedOrder.shipping_address?.state && `, ${selectedOrder.shipping_address.state}`}
                    {selectedOrder.shipping_address?.zip && ` ${selectedOrder.shipping_address.zip}`}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Items ({selectedOrder.items?.length || 0})</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                          {item.selectedSize && ` • Size: ${item.selectedSize}`}
                          {item.selectedColor && ` • Color: ${item.selectedColor}`}
                        </p>
                      </div>
                      <p className="font-semibold">
                        PKR {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Ordered on {format(new Date(selectedOrder.created_at), "MMMM dd, yyyy 'at' HH:mm")}
              </div>

              {/* Update Status */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="text-sm font-medium">Update Status:</span>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => {
                    updateOrderStatus(selectedOrder.id, value);
                    setSelectedOrder({ ...selectedOrder, status: value });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
