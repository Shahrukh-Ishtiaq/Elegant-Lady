import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          images,
          sizes,
          colors,
          in_stock,
          rating,
          review_count,
          categories (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedProducts: Product[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name || "",
        description: item.description || "",
        price: Number(item.price) || 0,
        category: item.categories?.name || "Uncategorized",
        images: item.images || [],
        sizes: item.sizes || [],
        colors: item.colors || [],
        inStock: item.in_stock ?? true,
        rating: Number(item.rating) || 0,
        reviewCount: item.review_count || 0,
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
};

export const useProduct = (id: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          images,
          sizes,
          colors,
          in_stock,
          rating,
          review_count,
          categories (name)
        `)
        .eq("id", productId)
        .single();

      if (error) throw error;

      if (data) {
        setProduct({
          id: data.id,
          name: data.name || "",
          description: data.description || "",
          price: Number(data.price) || 0,
          category: (data.categories as any)?.name || "Uncategorized",
          images: data.images || [],
          sizes: data.sizes || [],
          colors: data.colors || [],
          inStock: data.in_stock ?? true,
          rating: Number(data.rating) || 0,
          reviewCount: data.review_count || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  return { product, loading, error };
};
