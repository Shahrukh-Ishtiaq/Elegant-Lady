import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ShoppingCart, Users, DollarSign, Sparkles, Mail, Bell, MessageSquare, Boxes, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminPromotions } from "@/components/admin/AdminPromotions";
import { AdminSubscribers } from "@/components/admin/AdminSubscribers";
import { AdminMessages } from "@/components/admin/AdminMessages";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [unviewedOrders, setUnviewedOrders] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Wait for auth to complete before redirecting
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
        toast.error("Access denied. Admin privileges required.");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      const cleanup = setupOrderNotifications();
      return cleanup;
    }
  }, [isAdmin]);

  // Reminder sound effect for unviewed orders
  useEffect(() => {
    if (unviewedOrders.size > 0 && soundEnabled) {
      // Play reminder every 30 seconds until orders are viewed
      reminderIntervalRef.current = setInterval(() => {
        if (unviewedOrders.size > 0) {
          playReminderSound();
          toast.warning(`⚠️ ${unviewedOrders.size} order(s) pending review!`, {
            description: "Click the Orders tab to view and approve.",
            duration: 8000,
          });
        }
      }, 30000); // 30 seconds

      return () => {
        if (reminderIntervalRef.current) {
          clearInterval(reminderIntervalRef.current);
        }
      };
    }
  }, [unviewedOrders.size, soundEnabled]);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders").select("id, total", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      // Store existing order IDs so we don't alert for them
      ordersRes.data?.forEach(order => {
        processedOrdersRef.current.add(order.id);
      });

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const setupOrderNotifications = () => {
    const channel = supabase
      .channel('admin-orders-loud')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as { id: string; total: number };
          
          // Check if this is a new order we haven't processed
          if (!processedOrdersRef.current.has(newOrder.id)) {
            processedOrdersRef.current.add(newOrder.id);
            setNewOrderCount(prev => prev + 1);
            
            // Add to unviewed orders
            setUnviewedOrders(prev => new Set([...prev, newOrder.id]));
            
            // Play LOUD notification sound
            if (soundEnabled) {
              playLoudNotificationSound();
            }
            
            // Show persistent toast notification
            toast.success("🔔 NEW ORDER RECEIVED!", {
              description: `Order #${newOrder.id.slice(0, 8)} - PKR ${Number(newOrder.total).toLocaleString()}`,
              duration: 15000,
              action: {
                label: "View Order",
                onClick: () => {
                  // Mark as viewed
                  markOrderViewed(newOrder.id);
                }
              }
            });
            
            // Refresh stats
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  };

  const markOrderViewed = useCallback((orderId: string) => {
    setUnviewedOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  }, []);

  const markAllOrdersViewed = useCallback(() => {
    setUnviewedOrders(new Set());
    setNewOrderCount(0);
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playLoudNotificationSound = () => {
    try {
      const audioContext = getAudioContext();
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      
      // Create a loud, attention-grabbing notification sound
      // Multiple tones for urgency
      const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.5) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Play a loud multi-tone alert (like a cash register + alert)
      // First sequence - attention getter
      playTone(880, now, 0.15, 0.6);
      playTone(1046.5, now + 0.12, 0.15, 0.6);
      playTone(1318.51, now + 0.24, 0.2, 0.7);
      
      // Second sequence - confirmation chime
      playTone(1318.51, now + 0.5, 0.1, 0.5);
      playTone(1567.98, now + 0.6, 0.1, 0.5);
      playTone(2093, now + 0.7, 0.3, 0.6);
      
      // Third sequence - repeat for emphasis
      playTone(880, now + 1.1, 0.15, 0.5);
      playTone(1046.5, now + 1.22, 0.15, 0.5);
      playTone(1318.51, now + 1.34, 0.25, 0.6);
      
    } catch (error) {
      console.log("Audio notification not available:", error);
    }
  };

  const playReminderSound = () => {
    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      
      // Play a reminder beep - two short tones
      const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.4) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Short reminder beeps
      playTone(800, now, 0.1, 0.4);
      playTone(1000, now + 0.15, 0.1, 0.4);
      playTone(800, now + 0.4, 0.1, 0.4);
      playTone(1000, now + 0.55, 0.1, 0.4);
      
    } catch (error) {
      console.log("Reminder sound not available:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <motion.div 
        className="container mx-auto px-4 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your store</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? "text-primary" : "text-muted-foreground"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            
            {/* New Order Badge */}
            {newOrderCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full cursor-pointer"
                onClick={markAllOrdersViewed}
              >
                <Bell className="h-5 w-5 animate-bounce" />
                <span className="font-semibold">{newOrderCount} New Order{newOrderCount > 1 ? 's' : ''}!</span>
              </motion.div>
            )}
            
            {/* Unviewed Orders Warning */}
            {unviewedOrders.size > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full"
              >
                <Bell className="h-5 w-5" />
                <span className="font-semibold">{unviewedOrders.size} Pending Review</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalProducts}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalOrders}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalUsers}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `PKR ${stats.totalRevenue.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="orders" className="space-y-6" onValueChange={(value) => {
            if (value === 'orders') {
              markAllOrdersViewed();
            }
          }}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 max-w-5xl">
              <TabsTrigger value="orders" className="flex items-center gap-1 relative">
                <ShoppingCart className="h-3 w-3" />
                <span className="hidden sm:inline">Orders</span>
                {unviewedOrders.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unviewedOrders.size}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-1">
                <Boxes className="h-3 w-3" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="promotions" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">Promos</span>
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="hidden sm:inline">Subs</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <AdminOrders />
            </TabsContent>

            <TabsContent value="products">
              <AdminProducts />
            </TabsContent>

            <TabsContent value="inventory">
              <AdminInventory />
            </TabsContent>

            <TabsContent value="categories">
              <AdminCategories />
            </TabsContent>

            <TabsContent value="promotions">
              <AdminPromotions />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="subscribers">
              <AdminSubscribers />
            </TabsContent>

            <TabsContent value="messages">
              <AdminMessages />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;