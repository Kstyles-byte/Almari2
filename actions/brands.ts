"use server";

// TODO: Replace with actual database query
export async function getAllBrands(): Promise<string[]> {
  console.warn("getAllBrands action using placeholder data.");
  // In a real scenario, fetch distinct vendor store names from Product/Vendor table
  // Example:
  // const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  // const { data, error } = await supabase
  //   .from('Vendor')
  //   .select('storeName')
  //   .eq('isApproved', true)
  //   .order('storeName');
  // if (error) return [];
  // return data.map(v => v.storeName).filter(Boolean) as string[];
  
  // Placeholder data:
  return ["Emporium Elegance", "Urban Threads", "Velvet Vault", "TechElite"];
} 