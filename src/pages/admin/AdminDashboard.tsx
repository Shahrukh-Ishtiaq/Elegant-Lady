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
  const [pendingOrders, setPendingOrders] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  // Enable audio on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      // Resume audio context if it exists
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      const cleanup = setupOrderNotifications();
      return cleanup;
    }
  }, [isAdmin]);

  // Reminder sound effect for pending orders - every 30 seconds until approved
  useEffect(() => {
    if (pendingOrders.size > 0 && soundEnabled && hasInteracted) {
      // Clear existing interval
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
      
      // Play reminder every 30 seconds until orders are approved/processed
      reminderIntervalRef.current = setInterval(() => {
        if (pendingOrders.size > 0) {
          playReminderSound();
          toast.warning(`⚠️ ${pendingOrders.size} order(s) waiting for approval!`, {
            description: "Update order status to stop this alert.",
            duration: 8000,
          });
        }
      }, 30000); // 30 seconds

      return () => {
        if (reminderIntervalRef.current) {
          clearInterval(reminderIntervalRef.current);
        }
      };
    } else if (pendingOrders.size === 0 && reminderIntervalRef.current) {
      // Stop sound when no more pending orders
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }, [pendingOrders.size, soundEnabled, hasInteracted]);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders").select("id, total, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      // Store existing order IDs so we don't alert for them
      // Also track pending orders for sound alerts
      const pendingOrderIds = new Set<string>();
      ordersRes.data?.forEach(order => {
        processedOrdersRef.current.add(order.id);
        if (order.status === 'pending') {
          pendingOrderIds.add(order.id);
        }
      });
      setPendingOrders(pendingOrderIds);

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
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as { id: string; total: number; status: string };
          
          // Check if this is a new order we haven't processed
          if (!processedOrdersRef.current.has(newOrder.id)) {
            processedOrdersRef.current.add(newOrder.id);
            setNewOrderCount(prev => prev + 1);
            
            // Add to pending orders if status is pending
            if (newOrder.status === 'pending') {
              setPendingOrders(prev => new Set([...prev, newOrder.id]));
            }
            
            // Play LOUD notification sound
            if (soundEnabled && hasInteracted) {
              playLoudNotificationSound();
            }
            
            // Show persistent toast notification
            toast.success("🔔 NEW ORDER RECEIVED!", {
              description: `Order #${newOrder.id.slice(0, 8)} - PKR ${Number(newOrder.total).toLocaleString()}`,
              duration: 15000,
              action: {
                label: "View Orders",
                onClick: () => {
                  // Navigate to orders tab
                }
              }
            });
            
            // Refresh stats
            fetchStats();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const updatedOrder = payload.new as { id: string; status: string };
          
          // Remove from pending orders when status changes from pending
          if (updatedOrder.status !== 'pending') {
            setPendingOrders(prev => {
              const newSet = new Set(prev);
              newSet.delete(updatedOrder.id);
              return newSet;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Order subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  };

  const clearNewOrderBadge = useCallback(() => {
    setNewOrderCount(0);
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
      const playTone = (frequency: number, startTime: number, duration: number, volume: number = 0.6) => {
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
      playTone(880, now, 0.15, 0.7);
      playTone(1046.5, now + 0.12, 0.15, 0.7);
      playTone(1318.51, now + 0.24, 0.2, 0.8);
      
      // Second sequence - confirmation chime
      playTone(1318.51, now + 0.5, 0.1, 0.6);
      playTone(1567.98, now + 0.6, 0.1, 0.6);
      playTone(2093, now + 0.7, 0.3, 0.7);
      
      // Third sequence - repeat for emphasis
      playTone(880, now + 1.1, 0.15, 0.6);
      playTone(1046.5, now + 1.22, 0.15, 0.6);
      playTone(1318.51, now + 1.34, 0.25, 0.7);
      
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
      
      // Short reminder beeps - louder and more urgent
      playTone(800, now, 0.15, 0.5);
      playTone(1000, now + 0.2, 0.15, 0.5);
      playTone(800, now + 0.5, 0.15, 0.5);
      playTone(1000, now + 0.7, 0.15, 0.5);
      
    } catch (error) {
      console.log("Reminder sound not available:", error);
    }
  };

  // Test sound button handler
  const testSound = () => {
    setHasInteracted(true);
    playLoudNotificationSound();
    toast.info("Sound test played!");
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
            {/* Test Sound Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={testSound}
              className="text-xs"
            >
              Test Sound
            </Button>
            
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
                onClick={clearNewOrderBadge}
              >
                <Bell className="h-5 w-5 animate-bounce" />
                <span className="font-semibold">{newOrderCount} New Order{newOrderCount > 1 ? 's' : ''}!</span>
              </motion.div>
            )}
            
            {/* Pending Orders Warning - Sound plays until status changes */}
            {pendingOrders.size > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full"
              >
                <Bell className="h-5 w-5" />
                <span className="font-semibold">{pendingOrders.size} Pending Approval</span>
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
              clearNewOrderBadge();
            }
          }}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 max-w-5xl">
              <TabsTrigger value="orders" className="flex items-center gap-1 relative">
                <ShoppingCart className="h-3 w-3" />
                <span className="hidden sm:inline">Orders</span>
                {pendingOrders.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingOrders.size}
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