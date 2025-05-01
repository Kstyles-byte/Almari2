import { createServerActionClient } from '@/lib/supabase/server';
import { HeroBanner, Product } from '@/types/supabase';

/**
 * Fetches the active hero banner with the highest priority.
 */
export async function getActiveHeroBanner(): Promise<HeroBanner | null> {
  const supabase = await createServerActionClient(); // Await client creation
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('HeroBanner')
      .select('*')
      .eq('isActive', true)
      .or(`startDate.is.null,startDate.lte.${now}`)
      .or(`endDate.is.null,endDate.gte.${now}`)
      .order('priority', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to return null if not found

    if (error) throw error;
    return data;

  } catch (error) {
    console.error("Error fetching active hero banner:", error);
    return null; // Return null on error
  }
}

/**
 * Fetches featured products.
 */
export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const supabase = await createServerActionClient(); // Await client creation

  try {
    const { data, error } = await supabase
      .from('Product')
      .select(`
        *,
        Vendor ( id, storeName ),
        Category ( id, name )
      `)
      .eq('isFeatured', true)
      .eq('isPublished', true)
      .limit(limit);

    if (error) throw error;
    return data || [];

  } catch (error) {
    console.error("Error fetching featured products:", error);
    return []; // Return empty array on error
  }
}

// Add other content-related service functions here later if needed 