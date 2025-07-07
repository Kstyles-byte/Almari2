'use server';

import { createClient } from '@supabase/supabase-js';
import type { Vendor, Product, Category, ProductImage, Review } from '../types/index';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fallback guard – these should be set in env.
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or service role key is missing in store actions.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ---------------------------------------------
// Helper – format product for ProductGrid usage
// ---------------------------------------------
interface FormattedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  vendor: string; // store name
  inventory: number;
}

function formatProducts(raw: any[]): FormattedProduct[] {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return raw.map((p) => {
    const reviews: { rating: number }[] = p.Review || [];
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    const createdAtMs = new Date(p.created_at).getTime();

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.compare_at_price,
      image: p.ProductImage?.[0]?.url || '/assets/placeholder-product.svg',
      rating: parseFloat(avgRating.toFixed(1)),
      reviews: reviews.length,
      isNew: !isNaN(createdAtMs) && createdAtMs > sevenDaysAgo,
      vendor: p.Vendor?.store_name || 'Unknown',
      inventory: p.inventory,
    };
  });
}

// ---------------------------------------------
// Public actions
// ---------------------------------------------

export async function getVendorStoreMeta(vendorId: string) {
  try {
    // 1. Fetch vendor basic info
    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select('*')
      .eq('id', vendorId)
      .single<Vendor>();

    if (vendorError || !vendor) {
      throw vendorError || new Error('Vendor not found');
    }

    // 2. Fetch product ids for vendor (also used for rating)
    const { data: vendorProducts, error: productError } = await supabase
      .from('Product')
      .select('id, category:Category(id, name, slug)')
      .eq('vendor_id', vendorId);

    if (productError) throw productError;

    const productIds = vendorProducts?.map((p) => p.id) || [];
    const productsCount = productIds.length;

    // unique categories
    const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
    vendorProducts?.forEach((p) => {
      if (p.category) {
        categoryMap.set(p.category.id, p.category);
      }
    });
    const categories = Array.from(categoryMap.values());

    // 3. Compute rating
    let avgRating = 0;
    let reviewsCount = 0;
    if (productIds.length > 0) {
      const { data: reviews, error: reviewsError } = await supabase
        .from('Review')
        .select('rating')
        .in('product_id', productIds);
      if (reviewsError) throw reviewsError;
      reviewsCount = reviews?.length || 0;
      avgRating = reviewsCount
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsCount
        : 0;
    }

    return {
      vendor,
      categories,
      productsCount,
      averageRating: parseFloat(avgRating.toFixed(1)),
      reviewsCount,
    };
  } catch (error) {
    console.error('Error fetching vendor store meta:', error);
    return null;
  }
}

interface GetVendorStoreProductsParams {
  categorySlug?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'price-asc' | 'price-desc';
}

export async function getVendorStoreProducts(
  vendorId: string,
  {
    categorySlug,
    page = 1,
    limit = 12,
    sortBy = 'newest',
  }: GetVendorStoreProductsParams = {}
) {
  try {
    let query = supabase
      .from('Product')
      .select(
        `id, name, slug, description, price, compare_at_price, inventory, created_at, Vendor:Vendor(id, store_name), Category(id, name, slug), ProductImage(url), Review(rating)`,
        { count: 'exact' }
      )
      .eq('vendor_id', vendorId)
      .eq('is_published', true)
      .gt('inventory', 0);

    if (categorySlug) {
      query = query.eq('Category.slug', categorySlug);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const products = formatProducts(data || []);

    const totalPages = Math.ceil((count || 0) / limit);

    return { products, totalCount: count || 0, totalPages };
  } catch (error) {
    console.error('Error fetching vendor store products:', error);
    return { products: [], totalCount: 0, totalPages: 0 };
  }
} 