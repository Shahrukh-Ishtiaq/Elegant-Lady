import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

const About = () => {
  const { cart } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cart.length} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-center">About DAISY</h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Delicate Details, Distinctive
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed">
                DAISY was born from a simple belief: every woman deserves lingerie that makes her feel 
                confident, comfortable, and beautiful. We understand that the right undergarments aren't just 
                about what's underneath—they're about how you feel throughout your entire day.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                We're dedicated to providing high-quality, comfortable, and stylish lingerie that celebrates 
                every woman's unique beauty. From everyday essentials to special occasion pieces, we carefully 
                curate collections that combine style, comfort, and affordability.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-semibold mb-4">Quality & Comfort</h2>
              <p className="text-muted-foreground leading-relaxed">
                Every piece in our collection is selected with care, prioritizing soft fabrics, perfect fit, 
                and timeless designs. We believe that comfort and style should go hand in hand, and our 
                range of bras, panties, nightwear, and loungewear reflects this philosophy.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-semibold mb-4">Why Choose Us</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    Only the finest fabrics and craftsmanship make it into our collection.
                  </p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">Perfect Fit</h3>
                  <p className="text-muted-foreground">
                    Wide range of sizes ensuring every woman finds her perfect match.
                  </p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">Affordable Luxury</h3>
                  <p className="text-muted-foreground">
                    Premium quality without the premium price tag.
                  </p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-xl mb-2">Customer First</h3>
                  <p className="text-muted-foreground">
                    Your satisfaction and comfort are our top priorities.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
