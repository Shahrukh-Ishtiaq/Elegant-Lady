import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight } from "lucide-react";
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

const Home = () => {
  const { cart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, promotionsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('promotions').select('*').eq('is_active', true)
      ]);
      
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (promotionsRes.data) setPromotions(promotionsRes.data);
    };
    fetchData();
  }, []);

  const activePromo = promotions[0];

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

      {/* Hero Section with Parallax */}
      <section className="relative h-[600px] overflow-hidden">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <img 
            src={heroImage} 
            alt="Elegant Lady Lingerie" 
            className="w-full h-full object-cover scale-110"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-xl space-y-6"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.h1 
                variants={itemVariants}
                className="text-5xl md:text-6xl font-bold leading-tight"
              >
                Seamless comfort anytime
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-xl text-muted-foreground"
              >
                Discover comfort, confidence, and style in every piece.
              </motion.p>
              <motion.div variants={itemVariants}>
                <Link to="/shop">
                  <Button variant="hero" size="xl" className="shadow-elegant group">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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

      {/* CTA Banner */}
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto relative">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 px-4 py-3 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <Button variant="default" size="lg">Subscribe</Button>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Home;