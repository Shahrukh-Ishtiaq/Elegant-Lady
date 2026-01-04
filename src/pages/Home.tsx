import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Loader2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-lingerie.jpg";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  badge_text: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  images: string[] | null;
}

// Hero images for slideshow
const heroImages = [
  heroImage,
];

const Home = () => {
  const { cart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, promotionsRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('promotions').select('*').eq('is_active', true),
        supabase.from('products').select('id, name, images').eq('is_featured', true).limit(5)
      ]);
      
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (promotionsRes.data) setPromotions(promotionsRes.data);
      if (productsRes.data) setFeaturedProducts(productsRes.data);
    };
    fetchData();
  }, []);

  // Auto-advance hero slideshow with product images
  useEffect(() => {
    const allImages = [
      heroImage,
      ...featuredProducts.filter(p => p.images?.[0]).map(p => p.images![0])
    ];
    
    if (allImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % allImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredProducts]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscribeEmail || !subscribeEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email: subscribeEmail.toLowerCase().trim() });

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Thank you for subscribing! 🎉", {
          description: "You'll receive updates on new arrivals and exclusive offers."
        });
        setSubscribeEmail("");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const activePromo = promotions[0];

  // Combine hero image with featured product images for slideshow
  const allHeroImages = [
    heroImage,
    ...featuredProducts.filter(p => p.images?.[0]).map(p => p.images![0])
  ];

  const nextSlide = useCallback(() => {
    setCurrentHeroIndex(prev => (prev + 1) % allHeroImages.length);
  }, [allHeroImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentHeroIndex(prev => (prev - 1 + allHeroImages.length) % allHeroImages.length);
  }, [allHeroImages.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header cartItemCount={cart.length} />
      
      {/* Promo Banner */}
      {activePromo && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
          <motion.div 
            className="container mx-auto px-4 flex items-center justify-center gap-3"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">{activePromo.title}</span>
            <Badge variant="secondary" className="bg-background/20 text-primary-foreground animate-pulse">
              {activePromo.badge_text}
            </Badge>
            <span className="hidden sm:inline">{activePromo.description}</span>
            <Link to="/shop">
              <Button size="sm" variant="secondary" className="ml-2">
                Shop Now <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* Hero Section with Auto-Sliding Images */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentHeroIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7 }}
            style={{ y: heroY }}
            className="absolute inset-0"
          >
            <img 
              src={allHeroImages[currentHeroIndex]} 
              alt="Elegant Lady Lingerie" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        
        {/* Navigation Arrows */}
        {allHeroImages.length > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 p-3 rounded-full transition-all z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 p-3 rounded-full transition-all z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Slide Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {allHeroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentHeroIndex 
                      ? 'bg-primary w-8' 
                      : 'bg-background/50 hover:bg-background/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
      {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-xl space-y-6"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div 
                variants={itemVariants}
                className="inline-block"
              >
                <Badge variant="secondary" className="mb-4 text-sm px-4 py-1 bg-primary/90 text-primary-foreground border-none">
                  ✨ Premium Collection
                </Badge>
              </motion.div>
              <motion.h1 
                variants={itemVariants}
                className="text-5xl md:text-7xl font-bold leading-tight drop-shadow-lg"
              >
                <span 
                  className="text-primary font-extrabold"
                  style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.5)' 
                  }}
                >
                  Delicate Details
                </span>
                <br />
                <span 
                  className="text-foreground font-bold"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}
                >
                  Distinctive You.
                </span>
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-xl font-medium text-foreground/90 drop-shadow-sm"
                style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
              >
                Discover comfort, confidence, and style in every piece.
              </motion.p>
              <motion.div variants={itemVariants} className="flex gap-4">
                <Link to="/shop">
                  <Button variant="hero" size="xl" className="shadow-elegant group font-bold">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/shop?featured=true">
                  <Button variant="outline" size="xl" className="bg-background/80 backdrop-blur-sm font-semibold border-2">
                    View Collection
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <motion.section 
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "✨", title: "Comfort", desc: "Designed with your comfort in mind, using the softest fabrics." },
            { icon: "💖", title: "Confidence", desc: "Feel beautiful and confident in pieces that celebrate you." },
            { icon: "🌸", title: "Style", desc: "Timeless designs that blend elegance with modern trends." }
          ].map((feature, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="border-none shadow-soft hover:shadow-elegant transition-all hover:-translate-y-1 duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <motion.div 
                    className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <span className="text-2xl">{feature.icon}</span>
                  </motion.div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section 
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold">Shop by Category</h2>
          <p className="text-xl text-muted-foreground">Explore our curated collections</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category, idx) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              custom={idx}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <Link 
                to={`/shop?category=${category.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-elegant transition-all block aspect-square"
              >
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center">
                    <span className="text-4xl">👗</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end">
                  <div className="p-4 w-full">
                    <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Banner / Subscribe */}
      <motion.section 
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-gradient-romantic rounded-xl p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent)]" />
          <motion.h2 
            className="text-4xl font-bold relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Join Our Community
          </motion.h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto relative">
            Sign up for exclusive offers, style tips, and be the first to know about new arrivals.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto relative">
            <Input 
              type="email" 
              placeholder="Your email address" 
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              required
              disabled={isSubscribing}
            />
            <Button type="submit" variant="default" size="lg" disabled={isSubscribing}>
              {isSubscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Subscribe
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Home;
