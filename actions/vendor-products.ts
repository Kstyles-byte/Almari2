'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerActionClient as createAsyncServerActionClient } from '@/lib/supabase/server';

/**
 * Creates a new product for the authenticated vendor
 */
export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  category_id: string;
  inventory: number;
  is_published: boolean;
  slug: string;
}) {
  try {
    // Use the async server action client
    const supabase = await createAsyncServerActionClient();

    // First get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Log some debugging info
    console.log('Server createProduct - Auth check result:', user ? 'User found' : 'No user');
    if (userError) console.error('Server createProduct - Auth error:', userError.message);
    
    if (!user) {
      return { error: 'Unauthorized - No active session found', success: false };
    }

    // Get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('Server createProduct - Vendor error:', vendorError?.message);
      return { error: 'Vendor not found for this user', success: false };
    }

    // Now create the product with the vendor ID
    const { data: product, error: productError } = await supabase
      .from('Product')
      .insert({
        name: data.name,
        description: data.description,
        price: data.price,
        compare_at_price: data.compare_at_price,
        category_id: data.category_id,
        inventory: data.inventory,
        is_published: data.is_published,
        slug: data.slug,
        vendor_id: vendorData.id
      })
      .select()
      .single();

    if (productError) {
      console.error('Server createProduct - Product error:', productError.message);
      return { error: `Error creating product: ${productError.message}`, success: false };
    }

    // Revalidate necessary paths
    revalidatePath('/vendor/products');
    revalidatePath(`/product/${data.slug}`);

    return { 
      success: true, 
      productId: product.id 
    };
  } catch (error: any) {
    console.error('Server createProduct - Unexpected error:', error.message);
    return { error: `Unexpected error: ${error.message}`, success: false };
  }
}

/**
 * Deletes a product and its associated images
 */
export async function deleteProduct(productId: string) {
  try {
    // Use the async server action client for consistent auth handling
    const supabase = await createAsyncServerActionClient();

    // First get the current user with more robust error handling
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Log some debugging info
    console.log('Server deleteProduct - Auth check:', 
      user ? `User found: ${user.id}` : 'No user found');
    
    if (userError) {
      console.error('Server deleteProduct - Auth error:', userError.message);
      return { error: `Authentication error: ${userError.message}`, success: false };
    }
    
    if (!user) {
      // Try to refresh the session before giving up
      console.log('Attempting to refresh the session...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh failed:', refreshError.message);
        return { error: 'Unauthorized - Session refresh failed', success: false };
      }
      
      // Check if user is now available after refresh
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (!refreshedUser) {
        return { error: 'Unauthorized - No active session found', success: false };
      }
      
      console.log('Session refreshed successfully, continuing with request');
      // Update the user variable with the refreshed user
      user = refreshedUser;
    }

    // Get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('Server deleteProduct - Vendor error:', vendorError?.message);
      return { error: 'Vendor not found for this user', success: false };
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', productId)
      .eq('vendor_id', vendorData.id)
      .single();

    if (productError || !product) {
      console.error('Server deleteProduct - Product ownership check:', productError?.message);
      return { error: 'Product not found or you do not have permission to delete it', success: false };
    }

    // Delete associated images (ProductImage table entries)
    // Note: This relies on RLS/cascade deletes in the database or manually deleting them here
    const { error: deleteImagesError } = await supabase
      .from('ProductImage')
      .delete()
      .eq('product_id', productId);

    if (deleteImagesError) {
      console.error('Server deleteProduct - Image deletion error:', deleteImagesError.message);
      // Continue with product deletion even if image deletion fails
    }

    // Delete the product
    const { error: deleteProductError } = await supabase
      .from('Product')
      .delete()
      .eq('id', productId);

    if (deleteProductError) {
      console.error('Server deleteProduct - Product deletion error:', deleteProductError.message);
      return { error: `Error deleting product: ${deleteProductError.message}`, success: false };
    }

    // Revalidate the products page to reflect the deletion
    revalidatePath('/vendor/products');
    
    return { success: true };
  } catch (error: any) {
    console.error('Server deleteProduct - Unexpected error:', error.message);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred', 
      success: false 
    };
  }
}

/**
 * Toggles a product's published status
 */
export async function toggleProductPublishStatus(productId: string, currentStatus: boolean) {
  try {
    // Use the async server action client for consistent auth handling
    const supabase = await createAsyncServerActionClient();

    // First get the current user with more robust error handling
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Log some debugging info
    console.log('Server toggleProductPublishStatus - Auth check:', 
      user ? `User found: ${user.id}` : 'No user found');
    
    if (userError) {
      console.error('Server toggleProductPublishStatus - Auth error:', userError.message);
      return { error: `Authentication error: ${userError.message}`, success: false };
    }
    
    if (!user) {
      // Try to refresh the session before giving up
      console.log('Attempting to refresh the session...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh failed:', refreshError.message);
        return { error: 'Unauthorized - Session refresh failed', success: false };
      }
      
      // Check if user is now available after refresh
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (!refreshedUser) {
        return { error: 'Unauthorized - No active session found', success: false };
      }
      
      console.log('Session refreshed successfully, continuing with request');
      // Update the user variable with the refreshed user
      user = refreshedUser;
    }

    // After ensuring user is authenticated, get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('Server toggleProductPublishStatus - Vendor error:', vendorError?.message);
      return { error: 'Vendor not found for this user', success: false };
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', productId)
      .eq('vendor_id', vendorData.id)
      .single();

    if (productError || !product) {
      console.error('Server toggleProductPublishStatus - Product ownership check:', productError?.message);
      return { 
        error: 'Product not found or you do not have permission to update it', 
        success: false 
      };
    }

    // Update the product's published status
    const { error: updateError } = await supabase
      .from('Product')
      .update({ is_published: !currentStatus })
      .eq('id', productId);

    if (updateError) {
      console.error('Server toggleProductPublishStatus - Update error:', updateError.message);
      return { 
        error: `Error updating product status: ${updateError.message}`, 
        success: false 
      };
    }

    // Revalidate the products page to reflect the change
    revalidatePath('/vendor/products');
    
    return { 
      success: true, 
      newStatus: !currentStatus 
    };
  } catch (error: any) {
    console.error('Server toggleProductPublishStatus - Unexpected error:', error.message);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred', 
      success: false 
    };
  }
}

/**
 * Saves a product image URL to the database
 */
export async function saveProductImage(data: {
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
}) {
  try {
    // Use the async server action client
    const supabase = await createAsyncServerActionClient();

    // First get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Log some debugging info
    console.log('Server saveProductImage - Auth check result:', user ? 'User found' : 'No user');
    if (userError) console.error('Server saveProductImage - Auth error:', userError.message);
    
    if (!user) {
      return { error: 'Unauthorized - No active session found', success: false };
    }

    // Get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('Server saveProductImage - Vendor error:', vendorError?.message);
      return { error: 'Vendor not found for this user', success: false };
    }

    // Verify product ownership
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', data.productId)
      .eq('vendor_id', vendorData.id)
      .single();

    if (productError || !productData) {
      console.error('Server saveProductImage - Product ownership check:', productError?.message);
      return { error: 'Not authorized to add images to this product', success: false };
    }

    // Insert the image, handle primary image status
    if (data.isPrimary) {
      // First update all existing images to not be primary for this product
      await supabase
        .from('ProductImage')
        .update({ display_order: 999 }) // Use high display_order to make them appear later
        .eq('product_id', data.productId);
    }

    // Now insert the new image
    const { data: imageData, error: imageError } = await supabase
      .from('ProductImage')
      .insert({
        product_id: data.productId,
        url: data.imageUrl,
        display_order: 0, // Default to first position
        alt_text: `Image for ${data.productId}`
      })
      .select()
      .single();

    if (imageError) {
      console.error('Server saveProductImage - Image save error:', imageError.message);
      return { error: `Error saving image: ${imageError.message}`, success: false };
    }

    // If this should be primary, update it after insert (since field doesn't exist)
    if (data.isPrimary) {
      const { error: updateError } = await supabase
        .from('ProductImage')
        .update({ display_order: -1 }) // Use display_order to determine primary (-1 means first)
        .eq('id', imageData.id);
        
      if (updateError) {
        console.error('Server saveProductImage - Primary flag update error:', updateError.message);
      }
    }

    // Revalidate paths
    revalidatePath(`/vendor/products/${data.productId}`);
    revalidatePath('/vendor/products');

    return { 
      success: true, 
      imageId: imageData.id 
    };
  } catch (error: any) {
    console.error('Server saveProductImage - Unexpected error:', error.message);
    return { error: `Unexpected error: ${error.message}`, success: false };
  }
} 