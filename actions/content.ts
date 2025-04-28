'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '../lib/supabase/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { HeroBanner, Category } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Cloudinary (ensure environment variables are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

/**
 * Get all categories
 * Optionally include their child categories
 */
export async function getAllCategories(includeChildren: boolean = false): Promise<Category[]> {
  const supabase = createClient(); // Create client inside function if not global
  try {
    // First get all categories
    const { data: categories, error } = await supabase
      .from('Category')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    const allCategories = categories || [];

    if (!includeChildren) {
      return allCategories;
    }
    
    // If children are requested, organize them into a hierarchical structure
    const rootCategories = allCategories.filter((category: Category) => !category.parentId);
    const childCategories = allCategories.filter((category: Category) => category.parentId);
    
    // Add children to their respective parent categories
    return rootCategories.map((category: Category) => ({
      ...category,
      children: childCategories.filter((child: Category) => child.parentId === category.id)
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get categories with no parent (root/main categories)
 */
export async function getRootCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .is('parentId', null)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching root categories:', error);
    return [];
  }
}

/**
 * Get child categories for a specific parent category
 */
export async function getChildCategories(parentId: string): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .eq('parentId', parentId)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching child categories for parent ${parentId}:`, error);
    return [];
  }
}

/**
 * Get a single category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error);
    return null;
  }
}

// Define Zod schema for input validation
const HeroImageUpdateSchema = z.object({
  bannerId: z.string().uuid('Invalid Banner ID format.'),
  imageFile: z.instanceof(File).refine((file) => file.size > 0, 'Image file is required.').refine((file) => file.size <= 5 * 1024 * 1024, 'Image must be 5MB or less.').refine((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type), 'Invalid image format (JPEG, PNG, WEBP, GIF allowed).'),
  currentPublicId: z.string().optional().nullable(), // Public ID of the image being replaced
});

/**
 * Server Action to update the Hero Banner image.
 * Uploads to Cloudinary and updates Supabase.
 * Requires admin privileges.
 */
export async function updateHeroImage(prevState: any, formData: FormData): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = createClient();
  
  // --- Authorization Check ---
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth Error:', authError);
    return { success: false, message: 'Authentication failed.' };
  }

  // Fetch user details including role (assuming role is stored in user_metadata or a separate table)
  // This might require a separate query depending on your setup
  // Example: Fetching from a hypothetical 'User' table based on user.id
  const { data: userProfile, error: profileError } = await supabase
    .from('User') // Assuming your user table is named 'User'
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
     console.error('Profile Fetch Error:', profileError);
     return { success: false, message: 'Could not verify user role.' };
  }

  // Check if the user role is ADMIN (using the enum value from your schema)
  if (userProfile.role !== 'ADMIN') {
    console.warn(`Unauthorized attempt to update hero image by user: ${user.id}`);
    return { success: false, message: 'Unauthorized: Admin access required.' };
  }
  // --- End Authorization Check ---

  console.log(`Admin user ${user.id} authorized. Proceeding with image update...`);

  const validatedFields = HeroImageUpdateSchema.safeParse({
    bannerId: formData.get('bannerId'),
    imageFile: formData.get('imageFile'),
    currentPublicId: formData.get('currentPublicId') || null, // Ensure null if empty/undefined
  });

  if (!validatedFields.success) {
    console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Invalid input.',
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { bannerId, imageFile, currentPublicId } = validatedFields.data;

  try {
    // Convert File to buffer for Cloudinary upload
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload new image to Cloudinary using your preset
    console.log(`Uploading new image for banner ${bannerId} using preset 'zerviaupload'...`);
    const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => { // Use imported type
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: 'zerviaupload', // Your specified upload preset
          folder: 'hero_banners', // Optional: organize uploads
          public_id: `hero_${bannerId}_${Date.now()}`, // Create a somewhat unique public_id
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(new Error('Failed to upload image to Cloudinary.'));
          } else {
            console.log('Cloudinary Upload Success:', result?.public_id);
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    if (!uploadResult?.public_id || !uploadResult?.secure_url) {
      throw new Error('Cloudinary upload failed or did not return expected result.');
    }

    // Update Supabase with new image URL and public ID
    console.log(`Updating Supabase for banner ${bannerId} with new image publicId: ${uploadResult.public_id}`);
    const { error: updateError } = await supabase
      .from('HeroBanner')
      .update({
        imageUrl: uploadResult.secure_url,
        imagePublicId: uploadResult.public_id,
        // updatedAt will be handled by trigger or manually if needed
      })
      .eq('id', bannerId);

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      // Attempt to delete the newly uploaded image if DB update fails
      try {
        console.log(`Attempting to delete orphan Cloudinary image: ${uploadResult.public_id}`);
        await cloudinary.uploader.destroy(uploadResult.public_id);
      } catch (cleanupError) {
        console.error(`Failed to cleanup Cloudinary image ${uploadResult.public_id} after DB error:`, cleanupError);
      }
      throw new Error('Failed to update banner in database.');
    }

    // Delete old image from Cloudinary if it exists
    if (currentPublicId) {
      console.log(`Deleting old Cloudinary image: ${currentPublicId}`);
      try {
        await cloudinary.uploader.destroy(currentPublicId);
      } catch (deleteError) {
        // Log deletion error but don't fail the whole operation
        console.warn(`Failed to delete old image (${currentPublicId}) from Cloudinary:`, deleteError);
      }
    }

    // Revalidate paths
    revalidatePath('/'); // Revalidate homepage
    revalidatePath('/admin/content/hero'); // Revalidate admin page

    console.log(`Successfully updated hero image for banner ${bannerId}`);
    return { success: true, message: 'Hero image updated successfully.' };

  } catch (error: any) {
    console.error('Error in updateHeroImage action:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred while updating the hero image.',
      error: error?.message // Return error message string
    };
  }
}

// --- Zod Schema for Content Update (including Settings) ---
const HeroContentUpdateSchema = z.object({
  bannerId: z.string().uuid('Invalid Banner ID format.'),
  title: z.string().min(3, 'Title must be at least 3 characters.').max(100, 'Title must be 100 characters or less.'),
  subtitle: z.string().max(255, 'Subtitle must be 255 characters or less.').optional().nullable(),
  buttonText: z.string().max(50, 'Button text must be 50 characters or less.').optional().nullable(),
  buttonLink: z.string().max(255).refine(val => !val || val.startsWith('/') || val.startsWith('http'), {
    message: 'Button link must be a relative path (start with /) or a full URL (start with http).',
  }).optional().nullable(),
  priority: z.coerce.number().int().min(0, 'Priority must be a non-negative integer.'), // Coerce to number
  isActive: z.preprocess((val) => val === 'on', z.boolean()), // Handle Switch value ('on' or undefined)
  startDate: z.string().optional().nullable().refine(val => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid start date format.',
  }).transform(val => val ? new Date(val).toISOString() : null), // Convert to ISO string or null
  endDate: z.string().optional().nullable().refine(val => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid end date format.',
  }).transform(val => val ? new Date(val).toISOString() : null), // Convert to ISO string or null
});

/**
 * Server Action to update Hero Banner text content and settings.
 * Requires admin privileges.
 */
export async function updateHeroContent(prevState: any, formData: FormData): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = createClient();

  // --- Authorization Check (Reusing the pattern from updateHeroImage) ---
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, message: 'Authentication failed.' };
  }
  const { data: userProfile, error: profileError } = await supabase
    .from('User').select('role').eq('id', user.id).single();
  if (profileError || !userProfile) {
     return { success: false, message: 'Could not verify user role.' };
  }
  if (userProfile.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized: Admin access required.' };
  }
  // --- End Authorization Check ---

  console.log(`Admin user ${user.id} authorized for content update...`);

  // Extract values from FormData
  const rawData = {
    bannerId: formData.get('bannerId'),
    title: formData.get('title'),
    subtitle: formData.get('subtitle') || null,
    buttonText: formData.get('buttonText') || null,
    buttonLink: formData.get('buttonLink') || null,
    priority: formData.get('priority'),
    isActive: formData.get('isActive'), // Will be 'on' or null
    startDate: formData.get('startDate') || null, // Handle empty string
    endDate: formData.get('endDate') || null,   // Handle empty string
  };

  console.log("Raw form data:", rawData);

  const validatedFields = HeroContentUpdateSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('Content & Settings Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Invalid input for content or settings fields.',
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { bannerId, ...contentData } = validatedFields.data;

  // Validate end date is after start date if both are provided
  if (contentData.startDate && contentData.endDate && new Date(contentData.endDate) < new Date(contentData.startDate)) {
    return {
      success: false,
      message: 'End date cannot be before the start date.',
      error: { endDate: ['End date cannot be before the start date.'] }
    };
  }

  try {
    console.log(`Updating Supabase content & settings for banner ${bannerId}:`, contentData);
    const { error: updateError } = await supabase
      .from('HeroBanner')
      .update({
        ...contentData,
        // Supabase handles timestamp updates
      })
      .eq('id', bannerId);

    if (updateError) {
      console.error('Supabase Content Update Error:', updateError);
      throw new Error('Failed to update banner content/settings in database.');
    }

    // Revalidate paths
    revalidatePath('/'); // Revalidate homepage
    revalidatePath('/admin/content/hero'); // Revalidate admin page

    console.log(`Successfully updated hero content & settings for banner ${bannerId}`);
    return { success: true, message: 'Hero content and settings updated successfully.' };

  } catch (error: any) {
    console.error('Error in updateHeroContent action:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred while updating the hero content.',
      error: error?.message
    };
  }
}

/**
 * Server Action to delete a Hero Banner.
 * Also deletes the associated image from Cloudinary.
 * Requires admin privileges.
 * Expects the banner ID to be bound to the action.
 */
export async function deleteHeroBannerAction(bannerId: string): Promise<void> {
  const supabase = createClient();

  // --- Authorization Check ---
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Delete Action: Authentication failed.');
    return;
  }
  const { data: userProfile, error: profileError } = await supabase
    .from('User').select('role').eq('id', user.id).single();
  if (profileError || !userProfile) {
    console.error('Delete Action: Could not verify user role.');
    return;
  }
  if (userProfile.role !== 'ADMIN') {
    console.error('Delete Action: Unauthorized: Admin access required.');
    return;
  }
  // --- End Authorization Check ---

  if (!bannerId || typeof bannerId !== 'string') {
    console.error('Delete Action: Invalid Banner ID provided.');
    return;
  }

  console.log(`Admin user ${user.id} authorized. Attempting to delete banner ${bannerId}...`);

  try {
    // 1. Get the banner details to find the Cloudinary public ID
    const { data: banner, error: fetchError } = await supabase
      .from('HeroBanner')
      .select('imagePublicId') // Select only needed field
      .eq('id', bannerId)
      .single();

    if (fetchError) {
      console.error('Supabase Fetch Error (Delete Action):', fetchError);
      throw new Error('Failed to fetch banner details before deletion.');
    }

    const publicIdToDelete = banner?.imagePublicId;

    // 2. Delete from Supabase
    const { error: deleteError } = await supabase
      .from('HeroBanner')
      .delete()
      .eq('id', bannerId);

    if (deleteError) {
      console.error('Supabase Delete Error:', deleteError);
      throw new Error('Failed to delete banner from database.');
    }

    // 3. Delete image from Cloudinary if it exists
    if (publicIdToDelete) {
      console.log(`Deleting associated Cloudinary image: ${publicIdToDelete}`);
      try {
        await cloudinary.uploader.destroy(publicIdToDelete);
      } catch (deleteError) {
        // Log deletion error but don't fail the whole operation if DB delete succeeded
        console.warn(`Failed to delete image (${publicIdToDelete}) from Cloudinary:`, deleteError);
      }
    }

    // 4. Revalidate paths
    revalidatePath('/'); // Revalidate homepage
    revalidatePath('/admin/content/hero'); // Revalidate admin page

    console.log(`Successfully deleted hero banner ${bannerId}`);

  } catch (error: any) {
    console.error('Error in deleteHeroBannerAction:', error);
  }
}

// Removed the trailing comment 