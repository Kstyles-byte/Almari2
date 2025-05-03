"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function getAllBrands(): Promise<string[]> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Fetch distinct, non-null store names from approved vendors
    const { data, error } = await supabase
      .from('Vendor') // Reference your Vendor table name
      .select('store_name') // Select the store name column (snake_case)
      .eq('is_approved', true) // Only fetch from approved vendors
      .not('store_name', 'is', null) // Ensure store_name is not null
      .order('store_name'); // Order alphabetically

    if (error) {
      console.error("Error fetching brands (vendors):", error.message);
      return [];
    }

    // Extract the store names, filter out any nulls/empties just in case, and ensure uniqueness
    const brandNames = data
      ?.map(v => v.store_name)
      ?.filter((name): name is string => !!name) || []; // Type guard for string
      
    return [...new Set(brandNames)]; // Return unique names

  } catch (err) {
    console.error("Unexpected error fetching brands:", err);
    return [];
  }
} 