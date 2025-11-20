import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-lingerie.jpg";
import collectionBras from "@/assets/collection-bras.jpg";
import collectionNightwear from "@/assets/collection-nightwear.jpg";
import collectionLoungewear from "@/assets/collection-loungewear.jpg";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <img 
          src={heroImage} 
          alt="Lovabelle Lingerie" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Seamless comfort anytime
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover comfort, confidence, and style in every piece.
              </p>
              <Link to="/shop">
                <Button variant="hero" size="xl" className="shadow-elegant">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-none shadow-soft hover:shadow-elegant transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold">Comfort</h3>
              <p className="text-muted-foreground">
                Designed with your comfort in mind, using the softest fabrics.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft hover:shadow-elegant transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center">
                <span className="text-2xl">💖</span>
              </div>
              <h3 className="text-xl font-semibold">Confidence</h3>
              <p className="text-muted-foreground">
                Feel beautiful and confident in pieces that celebrate you.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft hover:shadow-elegant transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center">
                <span className="text-2xl">🌸</span>
              </div>
              <h3 className="text-xl font-semibold">Style</h3>
              <p className="text-muted-foreground">
                Timeless designs that blend elegance with modern trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Collections */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold">Featured Collections</h2>
          <p className="text-xl text-muted-foreground">Explore our curated selection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bras Collection */}
          <Link to="/shop?category=bras" className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-elegant transition-all">
            <img 
              src={collectionBras} 
              alt="Bras Collection" 
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
              <div className="p-8 space-y-2">
                <h3 className="text-3xl font-bold">Bras</h3>
                <p className="text-muted-foreground">Support meets elegance</p>
                <Button variant="elegant" className="mt-4">Shop Collection</Button>
              </div>
            </div>
          </Link>

          {/* Nightwear Collection */}
          <Link to="/shop?category=nightwear" className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-elegant transition-all">
            <img 
              src={collectionNightwear} 
              alt="Nightwear Collection" 
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
              <div className="p-8 space-y-2">
                <h3 className="text-3xl font-bold">Nightwear</h3>
                <p className="text-muted-foreground">Luxurious sleep essentials</p>
                <Button variant="elegant" className="mt-4">Shop Collection</Button>
              </div>
            </div>
          </Link>

          {/* Loungewear Collection */}
          <Link to="/shop?category=loungewear" className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-elegant transition-all">
            <img 
              src={collectionLoungewear} 
              alt="Loungewear Collection" 
              className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
              <div className="p-8 space-y-2">
                <h3 className="text-3xl font-bold">Loungewear</h3>
                <p className="text-muted-foreground">Cozy everyday comfort</p>
                <Button variant="elegant" className="mt-4">Shop Collection</Button>
              </div>
            </div>
          </Link>

          {/* Shapewear Collection */}
          <div className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-elegant transition-all bg-accent">
            <div className="h-[400px] flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-bold">Shapewear</h3>
                <p className="text-muted-foreground">Smooth silhouettes</p>
                <Link to="/shop?category=shapewear">
                  <Button variant="default" className="mt-4">Shop Collection</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-romantic rounded-xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">Join Our Community</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sign up for exclusive offers, style tips, and be the first to know about new arrivals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 px-4 py-3 rounded-md border border-border bg-background"
            />
            <Button variant="default" size="lg">Subscribe</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
