import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "@/types/product";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (id: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart and wishlist from database when user logs in
  useEffect(() => {
    if (user) {
      loadCartFromDB();
      loadWishlistFromDB();
    } else {
      // Clear local state when logged out
      setCart([]);
      setWishlist([]);
    }
  }, [user]);

  const loadCartFromDB = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          selected_size,
          selected_color,
          products (
            id,
            name,
            price,
            images,
            description,
            sizes,
            colors,
            in_stock,
            rating,
            review_count,
            categories (name)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const cartItems: CartItem[] = data.map((item: any) => ({
          id: item.product_id,
          name: item.products?.name || '',
          price: item.products?.price || 0,
          category: item.products?.categories?.name || '',
          description: item.products?.description || '',
          images: item.products?.images || [],
          sizes: item.products?.sizes || [],
          colors: item.products?.colors || [],
          inStock: item.products?.in_stock ?? true,
          rating: item.products?.rating || 0,
          reviewCount: item.products?.review_count || 0,
          quantity: item.quantity,
          selectedSize: item.selected_size || '',
          selectedColor: item.selected_color || '',
        }));
        setCart(cartItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlistFromDB = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        setWishlist(data.map((item) => item.product_id));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const addToCart = async (item: CartItem) => {
    if (user) {
      // Save to database for logged-in users
      try {
        const { error } = await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            product_id: item.id,
            quantity: item.quantity,
            selected_size: item.selectedSize,
            selected_color: item.selectedColor,
          }, {
            onConflict: 'user_id,product_id,selected_size,selected_color',
          });

        if (error) throw error;
        
        // Reload cart from DB to get accurate state
        await loadCartFromDB();
        toast.success(`${item.name} added to cart!`);
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error('Failed to add to cart');
      }
    } else {
      // Local state for non-logged-in users
      setCart((prev) => {
        const existing = prev.find(
          (i) => i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor
        );
        
        if (existing) {
          toast.success("Updated quantity in cart");
          return prev.map((i) =>
            i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
        
        toast.success(`${item.name} added to cart!`);
        return [...prev, item];
      });
    }
  };

  const removeFromCart = async (id: string, selectedSize?: string, selectedColor?: string) => {
    if (user) {
      try {
        let query = supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (selectedSize) query = query.eq('selected_size', selectedSize);
        if (selectedColor) query = query.eq('selected_color', selectedColor);

        const { error } = await query;
        if (error) throw error;

        await loadCartFromDB();
        toast.success("Item removed from cart");
      } catch (error) {
        console.error('Error removing from cart:', error);
        toast.error('Failed to remove item');
      }
    } else {
      setCart((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item removed from cart");
    }
  };

  const updateQuantity = async (id: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, selectedSize, selectedColor);
      return;
    }

    if (user) {
      try {
        let query = supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (selectedSize) query = query.eq('selected_size', selectedSize);
        if (selectedColor) query = query.eq('selected_color', selectedColor);

        const { error } = await query;
        if (error) throw error;

        await loadCartFromDB();
      } catch (error) {
        console.error('Error updating quantity:', error);
        toast.error('Failed to update quantity');
      }
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
    setCart([]);
  };

  const toggleWishlist = async (productId: string) => {
    if (user) {
      const isCurrentlyInWishlist = wishlist.includes(productId);
      
      try {
        if (isCurrentlyInWishlist) {
          const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

          if (error) throw error;
          setWishlist((prev) => prev.filter((id) => id !== productId));
          toast.success("Removed from wishlist");
        } else {
          const { error } = await supabase
            .from('wishlist')
            .insert({ user_id: user.id, product_id: productId });

          if (error) throw error;
          setWishlist((prev) => [...prev, productId]);
          toast.success("Added to wishlist");
        }
      } catch (error) {
        console.error('Error toggling wishlist:', error);
        toast.error('Failed to update wishlist');
      }
    } else {
      // Prompt user to login
      toast.error("Please login to save items to your wishlist");
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
