import { createClient } from '@/lib/supabase/server';
import { HeroBanner } from '@/types/content'; // Assuming types are defined here or create this file

/**
 * Fetches the highest priority active hero banner.
 * Considers isActive flag and optional start/end dates.
 */
export async function getActiveHeroBanner(): Promise<HeroBanner | null> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('HeroBanner')
    .select('*')
    .eq('isActive', true)
    .or(`startDate.is.null,startDate.lte.${now}`) // Active if no start date or start date is past
    .or(`endDate.is.null,endDate.gte.${now}`)     // Active if no end date or end date is future
    .order('priority', { ascending: false })    // Highest priority first
    .limit(1)
    .maybeSingle(); // Returns single object or null

  if (error) {
    console.error('Error fetching active hero banner:', error);
    return null; // Or throw error depending on desired handling
  }

  // TODO: Define the HeroBanner type properly in @/types/content.ts based on the schema
  return data as HeroBanner | null; 
}

// Add other content-related service functions here later if needed 