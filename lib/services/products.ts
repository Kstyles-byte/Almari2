import { createClient } from '@supabase/supabase-js';

export interface BasicProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  inventory: number;
  image?: string | null;
  vendorName?: string | null;
}

// Initializes and returns a cached Supabase client (browser safe)
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // This helper is meant for client-side usage only
    throw new Error('getProductsByIds should be called client-side');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Fetches basic product details for the given list of product IDs.
 * Uses the public, RLS-enabled Supabase client so it works for both guests and auth users.
 */
export async function getProductsByIds(ids: string[]): Promise<BasicProduct[]> {
  if (!ids.length) return [];
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('Product')
    .select(`id, name, slug, price, inventory, ProductImage(url), Vendor(store_name)`) // Minimal fields
    .in('id', ids);

  if (error) {
    console.error('getProductsByIds error:', error.message);
    return [];
  }

  return (
    data || []
  ).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    inventory: p.inventory,
    image: p.ProductImage?.[0]?.url ?? null,
    vendorName: p.Vendor?.store_name ?? null,
  }));
} 