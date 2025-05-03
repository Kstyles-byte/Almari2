'use server';

import { createClient } from '@supabase/supabase-js';
import type { Product, Category, Vendor } from '../types/index';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Search products for quick suggestions with limited fields
 */
export async function searchProductSuggestions(query: string, limit: number = 5) {
  if (!query || query.trim().length < 2) {
    return { suggestions: [] };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { data: productsData, error } = await supabase
      .from('Product')
      .select(`
        id, name, slug, price,
        ProductImage ( url ),
        Category ( name ),
        Vendor ( store_name )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`) // Search in name or description
      .eq('is_published', true)
      .gt('inventory', 0)
      .order('created_at', { ascending: false }) // Newest first
      .limit(limit);

    if (error) {
      console.error("Error searching products:", error.message);
      throw error;
    }

    // Define structure for type-safety
    type ProductSuggestionResult = Pick<Product, 'id' | 'name' | 'slug' | 'price'> & {
      ProductImage: { url: string }[] | null;
      Category: Pick<Category, 'name'> | null;
      Vendor: Pick<Vendor, 'store_name'> | null;
    };

    // Map to frontend-friendly structure
    const suggestions = (productsData as unknown as ProductSuggestionResult[]).map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.ProductImage?.[0]?.url || '/placeholder-product.jpg',
      category: product.Category?.name || 'Uncategorized',
      vendor: product.Vendor?.store_name || 'Unknown',
    }));

    return { suggestions };
  } catch (error) {
    console.error("Error in product search suggestions:", error);
    return { suggestions: [], error: "Failed to search products" };
  }
}

/**
 * Get popular search terms (could be based on recent searches or trending products)
 */
export async function getPopularSearchTerms(limit: number = 5) {
  // This could be implemented with tracking search counts or using trending product categories
  // For now, we'll return a static list
  return {
    terms: [
      "Dresses", 
      "Shoes", 
      "T-shirts", 
      "Bags", 
      "Accessories"
    ].slice(0, limit)
  };
} 