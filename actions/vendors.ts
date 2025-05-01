"use server";

import { createServerActionClient } from '../lib/supabase/server';
import type { Vendor, Product, Review, Category } from '../types/supabase';

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
      .select('id, name, logoUrl') // Adjust columns as needed
      .eq('isActive', true) // Filter for active vendors
      .order('createdAt', { ascending: false }) // Or order by name, etc.
      .limit(limit);

    if (error) {
      console.error("Error fetching active vendors:", error);
      throw error;
    }

    return (data || []).map(vendor => ({
        id: vendor.id,
        name: vendor.name || 'Unnamed Vendor',
        logoUrl: vendor.logoUrl || '/images/vendors/default-logo.png' // Provide a default logo
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
  const supabase = await createServerActionClient(); // Create client inside function
  try {
    // Define the structure expected from the vendors query (matching the select statement)
    // Supabase might return relations as arrays even with !inner
    type VendorWithUser = {
        id: string;
        storeName: string | null;
        description: string | null;
        logo: string | null;
        banner: string | null;
        User: { 
            name: string | null;
            email: string | null;
        }[]; // Expect User as an array
    };
    
    // 1. Fetch approved vendors with their basic user info
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('Vendor')
      .select(`
        id,
        storeName,
        description,
        logo,
        banner,
        User!inner ( name, email ) 
      `)
      .eq('isApproved', true)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (vendorsError) {
      console.error("Error fetching vendors:", vendorsError.message);
      throw vendorsError;
    }

    if (!vendorsData || vendorsData.length === 0) {
      return [];
    }

    const vendorIds = vendorsData.map(v => v.id);

     type ProductWithDetails = {
        id: string;
        vendorId: string;
        categoryId: string;
        Category: { 
            name: string | null; 
        }[]; // Expect Category as an array
        Review: Pick<Review, 'rating'>[] | null; 
    };

    // 2. Fetch products associated with these vendors to get categories and review data
    const { data: productsData, error: productsError } = await supabase
      .from('Product')
      .select(`
        id,
        vendorId,
        categoryId,
        Category!inner ( name ), 
        Review ( rating )       
      `) 
      .in('vendorId', vendorIds)
      .eq('isPublished', true); 

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
      const vendorId = product.vendorId;
      if (!vendorStats.has(vendorId)) {
        vendorStats.set(vendorId, { productCount: 0, totalRating: 0, totalReviews: 0, categoryNames: new Set() });
      }
      const stats = vendorStats.get(vendorId)!; 

      stats.productCount += 1;
      // Safely access category name from the first element of the array
      const categoryName = product.Category?.[0]?.name;
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

      const slug = `${(vendor.storeName || 'vendor').toLowerCase().replace(/\s+/g, '-')}-${vendor.id.slice(0, 8)}`;

      return {
        id: vendor.id,
        name: vendor.storeName || 'Unnamed Vendor',
        description: vendor.description || '',
        image: vendor.banner || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070', 
        logo: vendor.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1938',   
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