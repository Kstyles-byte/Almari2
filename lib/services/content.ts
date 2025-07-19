import { createServerActionClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
type HeroBannerRow = Tables<'HeroBanner'>;
type ProductRow = Tables<'Product'>;
type SpecialOfferRow = Tables<'SpecialOffer'>;

/**
 * Fetches the active hero banner with the highest priority.
 */
export async function getActiveHeroBanner(): Promise<HeroBannerRow | null> {
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
export async function getFeaturedProducts(limit = 4): Promise<ProductRow[]> {
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

/**
 * Fetches the active special offer with the highest priority.
 */
export async function getActiveSpecialOffer() {
  const supabase = await createServerActionClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('SpecialOffer')
      .select('*')
      .eq('isactive', true)
      .or(`startdate.is.null,startdate.lte.${now}`)
      .or(`enddate.is.null,enddate.gte.${now}`)
      .order('priority', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    const mapped = {
      id: data.id,
      title: (data as any).title,
      subtitle: (data as any).subtitle,
      discountCode: (data as any).discountcode,
      discountDescription: (data as any).discountdescription,
      buttonText: (data as any).buttontext,
      buttonLink: (data as any).buttonlink,
      isActive: (data as any).isactive,
      priority: (data as any).priority,
      startDate: (data as any).startdate,
      endDate: (data as any).enddate,
      discountType: (data as any).discounttype,
      discountValue: Number((data as any).discountvalue ?? 0),
      createdAt: (data as any).createdat,
      updatedAt: (data as any).updatedat,
    } as any;

    return mapped;
  } catch (error) {
    console.error('Error fetching active special offer:', error);
    return null;
  }
}

// Add other content-related service functions here later if needed 