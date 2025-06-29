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
      .select('id, is_approved')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Server createProduct - Vendor error:', vendorError.message);
      return { error: 'Vendor profile not found', success: false };
    }
    
    if (!vendorData) {
      return { error: 'Vendor not found for this user', success: false };
    }
    
    // Ensure vendor is approved
    if (!vendorData.is_approved) {
      return { error: 'Vendor account is not approved yet', success: false };
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
 * Updates an existing product for the authenticated vendor
 */
export async function updateProduct(productId: string, data: {
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
    console.log(`Starting update for product ${productId}`);
    
    // Use the async server action client for consistent auth handling
    const supabase = await createAsyncServerActionClient();

    // First get the current user with more robust error handling
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Log some debugging info
    console.log('Server updateProduct - Auth check:', 
      user ? `User found: ${user.id}` : 'No user found');
    
    if (userError) {
      console.error('Server updateProduct - Auth error:', userError.message);
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
      .select('id, is_approved')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Server updateProduct - Vendor error:', vendorError.message);
      return { error: 'Vendor profile not found', success: false };
    }
    
    if (!vendorData) {
      return { error: 'Vendor not found for this user', success: false };
    }
    
    // Ensure vendor is approved
    if (!vendorData.is_approved) {
      return { error: 'Vendor account is not approved yet', success: false };
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id, slug')
      .eq('id', productId)
      .eq('vendor_id', vendorData.id)
      .single();

    if (productError) {
      console.error('Server updateProduct - Product ownership check:', productError.message);
      
      if (productError.code === 'PGRST116') {
        return { error: 'Product not found or you do not have permission to update it', success: false };
      }
      
      return { error: `Database error: ${productError.message}`, success: false };
    }
    
    if (!product) {
      return { error: 'Product not found or you do not have permission to update it', success: false };
    }

    // Verify the updated slug doesn't already exist for another product by this vendor
    if (data.slug !== product.slug) {
      const { data: existingProductWithSlug, error: slugCheckError } = await supabase
        .from('Product')
        .select('id')
        .eq('slug', data.slug)
        .eq('vendor_id', vendorData.id)
        .neq('id', productId)
        .single();

      if (existingProductWithSlug) {
        return { error: 'A product with this slug already exists. Please choose a different URL slug.', success: false };
      }
    }

    // Update the product with detailed logging
    console.log(`Updating product ${productId} with data:`, {
      ...data,
      price: parseFloat(data.price.toString()),
      inventory: parseInt(data.inventory.toString())
    });
    
    const { error: updateError } = await supabase
      .from('Product')
      .update({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price.toString()),
        compare_at_price: data.compare_at_price ? parseFloat(data.compare_at_price.toString()) : null,
        category_id: data.category_id,
        inventory: parseInt(data.inventory.toString()),
        is_published: data.is_published,
        slug: data.slug,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Server updateProduct - Update error:', updateError.message);
      return { 
        error: `Error updating product: ${updateError.message}`, 
        success: false 
      };
    }

    console.log(`Successfully updated product ${productId}`);
    
    // Revalidate necessary paths
    revalidatePath('/vendor/products');
    revalidatePath(`/vendor/products/${productId}/edit`);
    revalidatePath(`/product/${product.slug}`); // Old slug
    if (product.slug !== data.slug) {
      revalidatePath(`/product/${data.slug}`); // New slug (if changed)
    }
    
    return { 
      success: true,
      productId: productId
    };
  } catch (error: any) {
    console.error('Server updateProduct - Unexpected error:', error.message);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred', 
      success: false 
    };
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
      .select('id, is_approved')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Server deleteProduct - Vendor error:', vendorError.message);
      return { error: 'Vendor profile not found', success: false };
    }
    
    if (!vendorData) {
      return { error: 'Vendor not found for this user', success: false };
    }
    
    // Ensure vendor is approved
    if (!vendorData.is_approved) {
      return { error: 'Vendor account is not approved yet', success: false };
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
      .select('id, is_approved')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Server toggleProductPublishStatus - Vendor error:', vendorError.message);
      return { error: 'Vendor profile not found', success: false };
    }
    
    if (!vendorData) {
      return { error: 'Vendor not found for this user', success: false };
    }
    
    // Ensure vendor is approved
    if (!vendorData.is_approved) {
      return { error: 'Vendor account is not approved yet', success: false };
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
      .select('id, is_approved')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Server saveProductImage - Vendor error:', vendorError.message);
      return { error: 'Vendor profile not found', success: false };
    }
    
    if (!vendorData) {
      return { error: 'Vendor not found for this user', success: false };
    }
    
    // Ensure vendor is approved
    if (!vendorData.is_approved) {
      return { error: 'Vendor account is not approved yet', success: false };
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

/**
 * Deletes a specific product image
 */
export async function deleteProductImage(imageId: string) {
  try {
    // Use the async server action client
    const supabase = await createAsyncServerActionClient();

    // First get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Server deleteProductImage - Auth error:', userError?.message);
      return { error: 'Unauthorized - No active session found', success: false };
    }

    // Get vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id, is_approved')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      console.error('Server deleteProductImage - Vendor error:', vendorError.message);
      return { error: 'Vendor profile not found', success: false };
    }
    
    if (!vendorData) {
      return { error: 'Vendor not found for this user', success: false };
    }
    
    // Ensure vendor is approved
    if (!vendorData.is_approved) {
      return { error: 'Vendor account is not approved yet', success: false };
    }

    // First get the image details to check ownership and primary status
    const { data: imageData, error: imageError } = await supabase
      .from('ProductImage')
      .select('product_id, display_order')
      .eq('id', imageId)
      .single();

    if (imageError || !imageData) {
      console.error('Server deleteProductImage - Image fetch error:', imageError?.message);
      return { error: 'Image not found', success: false };
    }

    // Now verify product ownership using the product_id from the image
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', imageData.product_id)
      .eq('vendor_id', vendorData.id)
      .single();

    if (productError || !productData) {
      console.error('Server deleteProductImage - Product ownership check:', productError?.message);
      return { error: 'Not authorized to delete this image', success: false };
    }
    
    // Check if this is the primary image (display_order = -1)
    const isPrimaryImage = imageData.display_order === -1;

    // Delete the image
    const { error: deleteError } = await supabase
      .from('ProductImage')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Server deleteProductImage - Delete error:', deleteError.message);
      return { error: `Error deleting image: ${deleteError.message}`, success: false };
    }

    // If this was the primary image, select a new primary image if any exist
    if (isPrimaryImage) {
      // Get remaining images for this product
      const { data: remainingImages, error: remainingImagesError } = await supabase
        .from('ProductImage')
        .select('id')
        .eq('product_id', imageData.product_id)
        .order('created_at', { ascending: false }) // Get the newest one
        .limit(1);

      if (!remainingImagesError && remainingImages && remainingImages.length > 0) {
        // Make the most recent image the primary one
        const { error: updateError } = await supabase
          .from('ProductImage')
          .update({ display_order: -1 })
          .eq('id', remainingImages[0].id);

        if (updateError) {
          console.error('Server deleteProductImage - New primary image update error:', updateError.message);
        }
      }
    }

    // Revalidate paths
    revalidatePath(`/vendor/products/${imageData.product_id}/edit`);
    revalidatePath('/vendor/products');

    return { success: true };
  } catch (error: any) {
    console.error('Server deleteProductImage - Unexpected error:', error.message);
    return { error: `Unexpected error: ${error.message}`, success: false };
  }
} 