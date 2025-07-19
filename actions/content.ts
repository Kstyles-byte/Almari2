'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerActionClient } from '../lib/supabase/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { HeroBanner, Category } from '@/types';
import slugify from 'slugify';

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
  const supabase = await createServerActionClient();
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
      imagePublicId: null,
      mobileImagePublicId: null,
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
 * Admin helper – fetches ALL hero banners (active or inactive) using the service-role key so that
 * RLS will not block the query. This should only be called from secured admin pages.
 */
export async function getAllHeroBannersAdmin(): Promise<HeroBanner[]> {
  // We purposely bypass RLS here because only admins can invoke this on the server.
  const supabase = await import('../lib/supabase/action').then((m) => m.createSupabaseServerActionClient(false));

  const { data, error } = await supabase
    .from('HeroBanner')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching all hero banners (admin):', error);
    return [];
  }

  return data ?? [];
}

/**
 * Get a single hero banner by ID
 */
export async function getHeroBannerById(id: string): Promise<HeroBanner | null> {
  const supabase = await createServerActionClient();
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
  const supabase = await createServerActionClient();
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
  data: Partial<Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<HeroBanner | null> {
  const supabase = await createServerActionClient();
  try {
    // Data should already contain ISO strings or null for dates from the form/schema
    // No need to call toISOString() again here
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString() // Set update time
    };

    const { data: updatedBanner, error } = await supabase
      .from('HeroBanner')
      .update(updatePayload) // Use the prepared payload
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
  const supabase = await createServerActionClient();
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
  const supabase = await createServerActionClient();
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
  const supabase = await createServerActionClient();
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
    const rootCategories = allCategories.filter((category: Category) => !category.parent_id);
    const childCategories = allCategories.filter((category: Category) => category.parent_id);
    
    // Add children to their respective parent categories
    return rootCategories.map((category: Category) => ({
      ...category,
      children: childCategories.filter((child: Category) => child.parent_id === category.id)
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
  const supabase = await createServerActionClient();
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .is('parent_id', null)
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
  const supabase = await createServerActionClient();
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .eq('parent_id', parentId)
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
  const supabase = await createServerActionClient();
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
  const supabase = await createServerActionClient();
  
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
  const supabase = await createServerActionClient();

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
 * Also attempts to delete the associated image from Cloudinary by parsing the imageUrl.
 * Requires admin privileges.
 * Expects the banner ID to be bound to the action.
 */
export async function deleteHeroBannerAction(bannerId: string): Promise<void> {
  const supabase = await createServerActionClient();

  // --- Authorization Check --- (Assumed correct)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { console.error('Delete Action: Auth failed.'); return; }
  const { data: userProfile, error: profileError } = await supabase
    .from('User').select('role').eq('id', user.id).single();
  if (profileError || !userProfile) { console.error('Delete Action: Profile fetch failed.'); return; }
  if (userProfile.role !== 'ADMIN') { console.error('Delete Action: Unauthorized.'); return; }
  // --- End Authorization Check ---

  if (!bannerId || typeof bannerId !== 'string') {
    console.error('Delete Action: Invalid Banner ID provided.');
    return;
  }

  console.log(`Admin user ${user.id} authorized. Attempting to delete banner ${bannerId}...`);

  let extractedPublicId: string | null = null;
  let bannerNotFound = false;

  // 1. Attempt to fetch the imageUrl first
  try {
      const { data: bannerData, error: fetchError } = await supabase
          .from('HeroBanner')
          .select('imageUrl') // Fetch imageUrl
          .eq('id', bannerId)
          .single();

      if (fetchError) {
          if (fetchError.code === 'PGRST116') { 
              console.warn(`Delete Action: Banner with ID ${bannerId} not found.`);
              bannerNotFound = true; 
          } else {
              console.error('Supabase Fetch Error (Delete Action):', fetchError);
          }
      } else if (bannerData?.imageUrl) {
           try {
                // Basic parsing for Cloudinary URL structure
                const url = new URL(bannerData.imageUrl);
                const pathSegments = url.pathname.split('/');
                // Find the segment after the version number (e.g., v12345)
                const versionIndex = pathSegments.findIndex(segment => /^v\d+$/.test(segment));
                if (versionIndex > -1 && versionIndex < pathSegments.length - 1) {
                    const publicIdWithExtension = pathSegments.slice(versionIndex + 1).join('/');
                    extractedPublicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
                    console.log(`Extracted publicId: ${extractedPublicId}`);
                } else {
                    console.warn(`Could not determine public ID structure from imageUrl: ${bannerData.imageUrl}`);
                }
           } catch (parseError) {
               console.warn(`Could not parse public ID from imageUrl ${bannerData.imageUrl}:`, parseError);
           }
      } else if (!bannerData) {
           console.warn(`Delete Action: Banner ${bannerId} found, but imageUrl is null or data missing.`);
           bannerNotFound = true;
      }
  } catch (fetchCatchError) {
      console.error('Unexpected error during banner fetch:', fetchCatchError);
  }

  // Exit now if the banner was confirmed not found
  if (bannerNotFound) {
      return; 
  }

  // Outer try-catch for the deletion part
  try {
    // 2. Delete the banner row from Supabase
    console.log(`Attempting to delete banner row ${bannerId} from Supabase...`);
    const { error: deleteError } = await supabase
      .from('HeroBanner')
      .delete()
      .eq('id', bannerId);

    if (deleteError) {
      console.error('Supabase Delete Error:', deleteError);
      throw new Error('Failed to delete banner from database.');
    }
    console.log(`Successfully deleted banner row ${bannerId} from Supabase.`);

    // 3. Delete image from Cloudinary ONLY if we extracted a public ID
    if (extractedPublicId) {
      console.log(`Deleting associated Cloudinary image: ${extractedPublicId}`);
      try {
        await cloudinary.uploader.destroy(extractedPublicId);
      } catch (cloudinaryDeleteError) {
        console.warn(`Failed to delete image (${extractedPublicId}) from Cloudinary:`, cloudinaryDeleteError);
      }
    } else {
        console.log(`No public ID extracted from imageUrl for banner ${bannerId}. Skipping Cloudinary deletion.`);
    }

    // 4. Revalidate paths
    revalidatePath('/');
    revalidatePath('/admin/content/hero');

    console.log(`Successfully processed deletion request for hero banner ${bannerId}`);

  } catch (error: any) {
    console.error('Error during banner deletion phase:', error);
  }
}

// ===================== SPECIAL OFFER ACTIONS =====================

import { SpecialOffer } from '@/types/content';

/**
 * Create a new special offer
 */
export async function createSpecialOffer(data: {
  title: string;
  subtitle?: string;
  discountCode?: string;
  discountDescription?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive?: boolean;
  priority?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}): Promise<SpecialOffer | null> {
  // Use service-role client (bypass RLS for admin)
  const supabase = await import('../lib/supabase/action').then(m => m.createSupabaseServerActionClient(false));
  try {
    // Map camelCase keys to snake_case DB columns
    const formattedData: Record<string, any> = {
      title: data.title,
      subtitle: data.subtitle ?? null,
      discountcode: data.discountCode ? data.discountCode.trim().toUpperCase() : null,
      discountdescription: data.discountDescription ?? null,
      buttontext: data.buttonText ?? null,
      buttonlink: data.buttonLink ?? null,
      isactive: data.isActive ?? true,
      priority: data.priority ?? 0,
      discounttype: data.discountType ?? 'PERCENTAGE',
      discountvalue: data.discountValue ?? 0,
      startdate: data.startDate ? (data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate) : null,
      enddate: data.endDate ? (data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate) : null,
      updatedat: new Date().toISOString(),
      createdat: new Date().toISOString(),
    };

    const { data: newOffer, error } = await supabase
      .from('SpecialOffer')
      // cast as any to satisfy TS generic expectations
      .insert([formattedData as any])
      .select()
      .single();

    if (error) throw error;

    // Revalidate homepage and admin offers page
    revalidatePath('/');
    revalidatePath('/admin/content/offers');
    // @ts-ignore – casting DB row to interface with different case mapping
    return newOffer as unknown as SpecialOffer;
  } catch (error) {
    console.error('Error creating special offer:', error);
    return null;
  }
}

/**
 * Update an existing special offer
 */
export async function updateSpecialOffer(id: string, data: Partial<Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SpecialOffer | null> {
  // Use service-role client for admin upsert
  const supabase = await import('../lib/supabase/action').then(m => m.createSupabaseServerActionClient(false));
  try {
    const updatePayload: Record<string, any> = {
      updatedat: new Date().toISOString(),
    };

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.subtitle !== undefined) updatePayload.subtitle = data.subtitle;
    if (data.discountCode !== undefined) updatePayload.discountcode = data.discountCode ? data.discountCode.trim().toUpperCase() : null;
    if (data.discountDescription !== undefined) updatePayload.discountdescription = data.discountDescription;
    if (data.discountType !== undefined) updatePayload.discounttype = data.discountType;
    if (data.discountValue !== undefined) updatePayload.discountvalue = data.discountValue;
    if (data.buttonText !== undefined) updatePayload.buttontext = data.buttonText;
    if (data.buttonLink !== undefined) updatePayload.buttonlink = data.buttonLink;
    if (data.isActive !== undefined) updatePayload.isactive = data.isActive;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.startDate !== undefined)
      updatePayload.startdate = ((data.startDate as any) instanceof Date)
        ? (data.startDate as any).toISOString()
        : data.startDate ?? null;
    if (data.endDate !== undefined)
      updatePayload.enddate = ((data.endDate as any) instanceof Date)
        ? (data.endDate as any).toISOString()
        : data.endDate ?? null;

    const { data: updatedOffer, error } = await supabase
      .from('SpecialOffer')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/admin/content/offers');
    // @ts-ignore – casting DB row to interface with different case mapping
    return updatedOffer as unknown as SpecialOffer;
  } catch (error) {
    console.error('Error updating special offer:', error);
    return null;
  }
}

/**
 * Delete a special offer
 */
export async function deleteSpecialOffer(id: string): Promise<boolean> {
  const supabase = await import('../lib/supabase/action').then(m => m.createSupabaseServerActionClient(false));
  try {
    const { error } = await supabase
      .from('SpecialOffer')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/admin/content/offers');
    return true;
  } catch (error) {
    console.error('Error deleting special offer:', error);
    return false;
  }
}

// ===================== END SPECIAL OFFER ACTIONS ===================== 

// ----------------- CATEGORY HELPERS -----------------

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createServerActionClient();
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching category by id:', error);
    return null;
  }
}

export async function createCategory(data: { name: string; iconUrl?: string | null; parentId?: string | null }): Promise<Category | null> {
  const supabase = await import('../lib/supabase/action').then(m => m.createSupabaseServerActionClient(false));
  try {
    const slug = slugify(data.name, { lower: true });
    // ensure unique slug – fetch at most one existing row
    const { data: existing, error: checkErr } = await supabase
      .from('Category')
      .select('id')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();
    if (checkErr && checkErr.code !== 'PGRST116') {
      // PGRST116 indicates no rows found when using maybeSingle, treat as no duplicate
      throw checkErr;
    }
    if (existing) {
      throw new Error('Category with this name already exists');
    }
    const payload = {
      name: data.name,
      slug,
      icon_url: data.iconUrl ?? null,
      parent_id: data.parentId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: created, error } = await supabase.from('Category').insert([payload]).select().single();
    if (error) throw error;
    revalidatePath('/admin/content/categories');
    return created;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

export async function updateCategory(id: string, data: Partial<{ name: string; iconUrl?: string | null; parentId?: string | null }>): Promise<Category | null> {
  const supabase = await import('../lib/supabase/action').then(m => m.createSupabaseServerActionClient(false));
  try {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.name) {
      payload.name = data.name;
      payload.slug = slugify(data.name, { lower: true });
    }
    if (data.iconUrl !== undefined) payload.icon_url = data.iconUrl;
    if (data.parentId !== undefined) payload.parent_id = data.parentId;

    const { data: updated, error } = await supabase
      .from('Category')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    revalidatePath('/admin/content/categories');
    return updated;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = await createServerActionClient();
  try {
    const { error } = await supabase.from('Category').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/content/categories');
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}
// ---------------------------------------------------- 