import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get active hero banners for the homepage
 * Filters banners based on active status and date range (if specified)
 * Orders by priority (highest first)
 */
export async function getActiveHeroBanners(): Promise<HeroBanner[]> {
  try {
    const now = new Date().toISOString();
    
    // Query active banners with date filtering
    const { data, error } = await supabase
      .from('HeroBanner')
      .select('*')
      .eq('isActive', true)
      .or(`startDate.is.null,startDate.lte.${now}`)
      .or(`endDate.is.null,endDate.gte.${now}`)
      .order('priority', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching hero banners:', error);
    // Return fallback banner
    return [{
      id: 'default',
      title: 'Shop Your Favorite Products on Campus',
      subtitle: 'Discover a wide range of products from trusted vendors with convenient pickup locations right on campus.',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
      mobileImageUrl: null,
      isActive: true,
      priority: 10,
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
  }
}

/**
 * Get a single hero banner by ID
 */
export async function getHeroBannerById(id: string): Promise<HeroBanner | null> {
  try {
    const { data, error } = await supabase
      .from('HeroBanner')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching hero banner by ID:', error);
    return null;
  }
}

/**
 * Create a new hero banner
 */
export async function createHeroBanner(data: {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  isActive?: boolean;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<HeroBanner | null> {
  try {
    // Format dates to ISO strings if present
    const formattedData = {
      ...data,
      startDate: data.startDate ? data.startDate.toISOString() : null,
      endDate: data.endDate ? data.endDate.toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    const { data: newBanner, error } = await supabase
      .from('HeroBanner')
      .insert([formattedData])
      .select()
      .single();
    
    if (error) throw error;
    
    return newBanner;
  } catch (error) {
    console.error('Error creating hero banner:', error);
    return null;
  }
}

/**
 * Update an existing hero banner
 */
export async function updateHeroBanner(
  id: string,
  data: {
    title?: string;
    subtitle?: string | null;
    buttonText?: string | null;
    buttonLink?: string | null;
    imageUrl?: string;
    mobileImageUrl?: string | null;
    isActive?: boolean;
    priority?: number;
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<HeroBanner | null> {
  try {
    // Format dates to ISO strings if present
    const formattedData = {
      ...data,
      startDate: data.startDate ? data.startDate.toISOString() : null,
      endDate: data.endDate ? data.endDate.toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    const { data: updatedBanner, error } = await supabase
      .from('HeroBanner')
      .update(formattedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return updatedBanner;
  } catch (error) {
    console.error('Error updating hero banner:', error);
    return null;
  }
}

/**
 * Delete a hero banner
 */
export async function deleteHeroBanner(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('HeroBanner')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting hero banner:', error);
    return false;
  }
}

/**
 * Toggle the active status of a hero banner
 */
export async function toggleHeroBannerActive(id: string): Promise<HeroBanner | null> {
  try {
    // First get the current banner to check its active status
    const { data: currentBanner, error: fetchError } = await supabase
      .from('HeroBanner')
      .select('isActive')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!currentBanner) throw new Error("Hero banner not found");
    
    // Toggle the active status
    const { data: updatedBanner, error: updateError } = await supabase
      .from('HeroBanner')
      .update({ 
        isActive: !currentBanner.isActive,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return updatedBanner;
  } catch (error) {
    console.error('Error toggling hero banner active status:', error);
    return null;
  }
} 