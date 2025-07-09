"use server";

import { createServerActionClient } from '../lib/supabase/server';
import type { Vendor, Product, Review, Category } from '@/types';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Define expected data structure
interface VendorShowcaseData {
  id: string;
  name: string;
  logoUrl: string;
}

/**
 * Fetch active vendors for the showcase
 */
export async function getActiveVendors(limit = 6): Promise<VendorShowcaseData[]> {
  const supabase = await createServerActionClient(); // Create client inside function
  try {
    const { data, error } = await supabase
      .from('Vendor') // Assuming table name is 'Vendor'
      .select('id, store_name, logo_url') // Use snake_case
      .eq('is_active', true) // Filter for active vendors & use snake_case
      .order('created_at', { ascending: false }); // Use snake_case

    if (error) {
      console.error("Error fetching active vendors:", error);
      return []; 
    }
    if (!data) return [];

    return data.map(vendor => ({
        id: vendor.id,
        name: vendor.store_name || 'Unnamed Vendor', // Use snake_case
        logoUrl: vendor.logo_url || '/images/vendors/default-logo.png' // Use snake_case
    }));

  } catch (error) {
    console.error("Error processing active vendors:", error);
    return [];
  }
}

/**
 * Get featured vendors for homepage
 */
export async function getFeaturedVendors(limit = 3) {
  // Prefer service role key so public vendor list isn't blocked by RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  try {
    // Define the structure expected from the vendors query (matching the select statement)
    // Supabase might return relations as arrays even with !inner
    type VendorWithUser = {
        id: string;
        store_name: string | null;
        description: string | null;
        logo_url: string | null;
        banner_url: string | null;
        User: { 
            name: string | null;
            email: string | null;
        } | null; // Expect single object or null
    };
    
    // 1. Fetch approved vendors without joining User table to avoid RLS restrictions
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('Vendor')
      .select(`
        id,
        store_name,
        description,
        logo_url,
        banner_url
      `)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (vendorsError) {
      console.error("Error fetching vendors:", vendorsError.message);
      throw vendorsError;
    }

    if (!vendorsData || vendorsData.length === 0) {
      return [];
    }

    const vendorIds = vendorsData.map(v => v.id);

    // Define the expected shape of the result after join
    type ProductWithDetails = Product & {
        category_id: string; // Use snake_case
        Category: Pick<Category, 'id' | 'name'> | null;
        Review: { rating: number }[] | null; // Match the select query
    };

    // 2. Fetch products associated with these vendors to get categories and review data
    const { data: productsData, error: productsError } = await supabase
      .from('Product')
      .select(`
        id,
        vendor_id,
        category_id,
        Category!inner ( name ), 
        Review ( rating )       
      `) 
      .in('vendor_id', vendorIds)
      .eq('is_published', true); 

    if (productsError) {
      console.error("Error fetching vendor products:", productsError.message);
      throw productsError;
    }
    
    const products = (productsData || []) as ProductWithDetails[]; 

    // 3. Process product data to aggregate stats per vendor
    const vendorStats = new Map<string, {
      productCount: number;
      totalRating: number;
      totalReviews: number;
      categoryNames: Set<string>;
    }>();

    products.forEach(product => { 
      const vendorId = product.vendor_id;
      if (!vendorStats.has(vendorId)) {
        vendorStats.set(vendorId, { productCount: 0, totalRating: 0, totalReviews: 0, categoryNames: new Set() });
      }
      const stats = vendorStats.get(vendorId)!; 

      stats.productCount += 1;
      // Safely access category name from the first element of the array
      const categoryName = product.Category?.name;
      if (categoryName) { 
        stats.categoryNames.add(categoryName);
      }

      (product.Review || []).forEach((review) => { 
        stats.totalRating += review.rating;
        stats.totalReviews += 1;
      });
    });

    // 4. Format the final vendor data
    return (vendorsData as VendorWithUser[]).map(vendor => { 
      const stats = vendorStats.get(vendor.id) || { productCount: 0, totalRating: 0, totalReviews: 0, categoryNames: new Set() };
      const avgRating = stats.totalReviews > 0
        ? stats.totalRating / stats.totalReviews
        : 4.5; 

      const slug = `${(vendor.store_name || 'vendor').toLowerCase().replace(/\s+/g, '-')}-${vendor.id.slice(0, 8)}`;

      return {
        id: vendor.id,
        name: vendor.store_name || 'Unnamed Vendor',
        description: vendor.description || '',
        image: vendor.banner_url || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070',   
        logo: vendor.logo_url || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1938',   
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: stats.totalReviews,
        productCount: stats.productCount,
        slug: slug,
        categories: Array.from(stats.categoryNames).slice(0, 3),
      };
    });

  } catch (error) {
    console.error("Error processing featured vendors:", error);
    return []; 
  }
}

export async function getVendorDetails(vendorId: string) {
  const supabase = await createServerActionClient();
  try {
    const { data: vendor, error } = await supabase
      .from('Vendor')
      .select('id, store_name, logo_url') // Use snake_case
      .eq('id', vendorId)
      .single();

    if (error) throw error;
    if (!vendor) return { success: false, error: 'Vendor not found' };

    return {
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.store_name, // Use snake_case
        logoUrl: vendor.logo_url, // Use snake_case
      },
    };
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    return { success: false, error: 'Error fetching vendor details' };
  }
}