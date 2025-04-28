'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { auth } from '../auth';
import type { Product, Notification } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure keys are available
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for admin product actions.");
  // Handle appropriately
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Validation schemas
const updateProductStatusSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'DRAFT', 'OUT_OF_STOCK']),
  rejectionReason: z.string().optional(),
});

const updateProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
  compareAtPrice: z.number().positive('Compare at price must be positive').optional().nullable(),
  sku: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'DRAFT', 'OUT_OF_STOCK']).optional(),
  categoryIds: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

const deleteProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

type UpdateProductStatusInput = z.infer<typeof updateProductStatusSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;
type DeleteProductInput = z.infer<typeof deleteProductSchema>;

/**
 * Check if the current user has admin permissions
 */
async function checkAdminPermission() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return session.user;
}

/**
 * Approve a pending product
 */
export async function approveProduct(productId: string) {
  await checkAdminPermission();
  
  try {
    // Check if product exists and is pending using Supabase
    const { data: existingProduct, error: fetchError } = await supabase
      .from('Product') // Assuming table name is 'Product'
      .select('id, name, status, vendorId') // Select necessary fields (vendorId was userId in prisma schema?)
      .eq('id', productId)
      .single();

    if (fetchError) {
        console.error("Error fetching product for approval:", fetchError.message);
        throw new Error("Failed to fetch product for approval.");
    }
    if (!existingProduct) {
      throw new Error('Product not found');
    }
    // Assuming 'status' field exists on your Supabase Product table
    if (existingProduct.status !== 'PENDING') {
      throw new Error('Only pending products can be approved');
    }
    
    // Update product status to active using Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update({
        status: 'ACTIVE',
        // approvedAt: new Date().toISOString(), // Optional: Add if column exists
        updatedAt: new Date().toISOString(), // Manually update timestamp
      })
      .eq('id', productId)
      .select('id, name, status') // Select fields needed for return value
      .single();

     if (updateError || !updatedProduct) {
        console.error("Error approving product:", updateError?.message);
        throw new Error(`Failed to approve product: ${updateError?.message}`);
    }

    // Create notification for vendor using Supabase
    // Assuming 'Notification' table and necessary columns exist
    // Assuming existingProduct.vendorId holds the Supabase Auth user ID of the vendor
     const { error: notificationError } = await supabase
        .from('Notification')
        .insert({
            userId: existingProduct.vendorId, // Check if vendorId maps to the User's ID
        title: 'Product Approved',
        message: `Your product "${existingProduct.name}" has been approved and is now live.`,
            type: 'PRODUCT_APPROVED', // Ensure this matches your NotificationType enum/values
            // data: { productId: existingProduct.id }, // Omitted for now - requires JSONB handling
        });

     if (notificationError) {
         console.error("Error creating approval notification:", notificationError.message);
         // Decide if this is critical - maybe log and continue?
     }

    // Revalidate paths
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    
    return { success: true, product: updatedProduct }; // Return the updated product data

  } catch (error) {
    console.error("Approve product action failed:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred during product approval' };
  }
}

/**
 * Reject a pending product
 */
export async function rejectProduct(productId: string, rejectionReason: string) {
  await checkAdminPermission();
  
  try {
    // Correctly fetch existing product using Supabase
    const { data: existingProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, name, status, vendorId, metadata') // Fetch metadata too
      .eq('id', productId)
      .single();

    if (fetchError) {
       // Handle different fetch errors
       if (fetchError.code === 'PGRST116') { // Not found
      throw new Error('Product not found');
       } else {
            console.error("Error fetching product for rejection:", fetchError.message);
            throw new Error("Failed to fetch product for rejection.");
       }
    }
    // existingProduct should now be the product object
    if (!existingProduct) { // Should be redundant if .single() error handling is correct, but safe check
       throw new Error('Product not found (post-fetch check).');
    }

    
    if (existingProduct.status !== 'PENDING') {
      throw new Error('Only pending products can be rejected');
    }
    
    // Prepare new metadata including the rejection reason
    const currentMetadata = (existingProduct.metadata as object || {});
    const newMetadata = {
        ...currentMetadata,
        rejectionReason: rejectionReason,
    };

    // Update product status to rejected using Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update({
        status: 'REJECTED',
        metadata: newMetadata,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('id, name, status, metadata') // Return updated product info
      .single();

    if (updateError || !updatedProduct) {
      console.error("Error rejecting product:", updateError?.message);
      throw new Error(`Failed to reject product: ${updateError?.message}`);
    }

    // Create notification for vendor using Supabase
     const { error: notificationError } = await supabase
        .from('Notification')
        .insert({
            userId: existingProduct.vendorId,
        title: 'Product Rejected',
        message: `Your product "${existingProduct.name}" has been rejected. Reason: ${rejectionReason}`,
            type: 'PRODUCT_REJECTED', // Ensure type matches Supabase enum/values
        });

     if (notificationError) {
         console.error("Error creating rejection notification:", notificationError.message);
     }

    // Revalidate paths
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    
    return { success: true, product: updatedProduct };

  } catch (error) {
    console.error("Reject product action failed:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred during product rejection' };
  }
}

/**
 * Update product status
 */
export async function updateProductStatus(data: UpdateProductStatusInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = updateProductStatusSchema.parse(data);
    
    // Check if product exists using Supabase
    const { data: existingProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, name, status, vendorId, metadata') // Fetch needed fields
      .eq('id', validatedData.id)
      .single();

     if (fetchError) {
        if (fetchError.code === 'PGRST116') {
      throw new Error('Product not found');
        } else {
            console.error("Error fetching product for status update:", fetchError.message);
            throw new Error("Failed to fetch product for status update.");
        }
     }
     if (!existingProduct) { // Safety check
        throw new Error('Product not found (post-fetch check).');
     }

    // Prepare update data, handling metadata merge for rejection
    // Define ProductStatus type based on the Zod schema enum for type safety
    type ProductStatus = z.infer<typeof updateProductStatusSchema>['status'];
    const updatePayload: { status: ProductStatus, metadata?: object, updatedAt: string } = {
      status: validatedData.status,
      updatedAt: new Date().toISOString(),
    };
    
    if (validatedData.status === 'REJECTED' && validatedData.rejectionReason) {
        const currentMetadata = (existingProduct.metadata as object || {});
        updatePayload.metadata = {
            ...currentMetadata,
        rejectionReason: validatedData.rejectionReason,
      };
    } else if (validatedData.status !== 'REJECTED') {
        // Optionally clear the rejection reason if status changes from REJECTED
        const currentMetadata = (existingProduct.metadata as object || {});
        if (currentMetadata && 'rejectionReason' in currentMetadata) {
             // Create a new object excluding rejectionReason
             const { rejectionReason, ...restMetadata } = currentMetadata;
             updatePayload.metadata = restMetadata;
        }
    }


    // Update product status using Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update(updatePayload)
      .eq('id', validatedData.id)
      .select('id, name, status, metadata') // Return relevant fields
      .single();

    if (updateError || !updatedProduct) {
        console.error("Error updating product status:", updateError?.message);
        throw new Error(`Failed to update product status: ${updateError?.message}`);
    }
    
    // Create notification for vendor based on status update
    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;
    
    switch (validatedData.status) {
      case 'ACTIVE':
        notificationType = 'PRODUCT_APPROVED'; // Match Supabase values
        notificationTitle = 'Product Approved';
        notificationMessage = `Your product "${existingProduct.name}" has been approved and is now live.`;
        break;
      case 'REJECTED':
        notificationType = 'PRODUCT_REJECTED';
        notificationTitle = 'Product Rejected';
        notificationMessage = `Your product "${existingProduct.name}" has been rejected.${validatedData.rejectionReason ? ` Reason: ${validatedData.rejectionReason}` : ''}`;
        break;
      default:
        // Assuming a generic type exists in Supabase for other status changes
        notificationType = 'PRODUCT_STATUS_UPDATED';
        notificationTitle = 'Product Status Updated';
        notificationMessage = `Your product "${existingProduct.name}" status has been updated to ${validatedData.status}.`;
    }
    
    const { error: notificationError } = await supabase
        .from('Notification')
        .insert({
            userId: existingProduct.vendorId, // Use vendorId
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
            // data field omitted
        });

     if (notificationError) {
         console.error("Error creating status update notification:", notificationError.message);
     }

    // Revalidate paths
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${validatedData.id}`);
    
    return { success: true, product: updatedProduct }; // Return updated product

  } catch (error) {
    console.error("Update product status action failed:", error);
    if (error instanceof z.ZodError) {
      // Flatten Zod errors for better readability if needed
      const flatErrors = error.flatten();
      return { success: false, error: "Validation failed", issues: flatErrors.fieldErrors };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred updating product status' };
  }
}

/**
 * Update an existing product (Admin version)
 */
export async function updateProduct(data: UpdateProductInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data against the schema
    const validatedData = updateProductSchema.parse(data);
    
    // Check if product exists using Supabase
    const { data: existingProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, name, vendorId, categoryId') // Select fields needed for checks/updates
      .eq('id', validatedData.id)
      .single();

    if (fetchError) {
        if (fetchError.code === 'PGRST116') { throw new Error('Product not found'); }
        console.error("Error fetching product for update:", fetchError.message);
        throw new Error("Failed to fetch product for update.");
    }
     if (!existingProduct) { // Safety check
        throw new Error('Product not found (post-fetch check).');
     }

    // Build the update data object selectively based on validated input
    // Use Partial<Product> for type safety
    // Define status type based on Zod schema enum
    type ProductStatus = z.infer<typeof updateProductStatusSchema>['status']; 
    const updatePayload: Partial<Omit<Product, 'createdAt' | 'updatedAt' | 'price' | 'comparePrice' | 'inventory'> & 
                            { price?: number; comparePrice?: number | null; inventory?: number; status?: ProductStatus; updatedAt: string }> = {
        updatedAt: new Date().toISOString(), // Manually set update timestamp
    };

    if (validatedData.name !== undefined) updatePayload.name = validatedData.name;
    if (validatedData.description !== undefined) updatePayload.description = validatedData.description;
    if (validatedData.price !== undefined) updatePayload.price = validatedData.price;
    // Handle null explicitly for comparePrice matching Supabase behavior
    if (validatedData.compareAtPrice !== undefined) updatePayload.comparePrice = validatedData.compareAtPrice;
    // if (validatedData.sku !== undefined) updatePayload.sku = validatedData.sku; // Assuming sku exists in Product type/table
    if (validatedData.stock !== undefined) updatePayload.inventory = validatedData.stock; // Map stock to inventory
    if (validatedData.status !== undefined) updatePayload.status = validatedData.status; // Assign validated status
    // Map isActive (from Zod) to isPublished (from Product type/table) if intended
    if (validatedData.isActive !== undefined) updatePayload.isPublished = validatedData.isActive;

    // Update category ID if provided and different (Schema supports only one categoryId)
    // Assuming categoryId *is* intended to be updatable via this admin action, even if not explicitly handled by original Prisma logic
    if (validatedData.categoryIds && validatedData.categoryIds.length > 0 && validatedData.categoryIds[0] !== existingProduct.categoryId) {
        // Optional: Check if new categoryId exists
        const { data: categoryExists } = await supabase.from('Category').select('id', { head: true }).eq('id', validatedData.categoryIds[0]);
        if (!categoryExists) {
            throw new Error(`Category with ID ${validatedData.categoryIds[0]} not found.`);
        }
        updatePayload.categoryId = validatedData.categoryIds[0]; // Use the first ID from the array
    }

    // Note: Image updates are not handled in this admin function based on original Prisma code

    // Update product in Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update(updatePayload)
      .eq('id', validatedData.id)
      .select('*') // Select all fields of the updated product
      .single();

    if (updateError || !updatedProduct) {
      console.error("Error updating product (admin):", updateError?.message);
      throw new Error(`Failed to update product: ${updateError?.message}`);
    }
    
    // Create notification for vendor
    const { error: notificationError } = await supabase
        .from('Notification')
        .insert({
            userId: existingProduct.vendorId, // Use vendorId from the product
        title: 'Product Updated',
        message: `Your product "${existingProduct.name}" has been updated by an administrator.`,
            type: 'PRODUCT_UPDATED', // Ensure type matches Supabase enum/values
        });

    if (notificationError) {
        console.error("Error creating product update notification:", notificationError.message);
    }

    // Revalidate paths
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${validatedData.id}`);
    // Maybe revalidate public product page too?
    if (updatedProduct.slug) {
        revalidatePath(`/products/${updatedProduct.slug}`);
    }

    return { success: true, product: updatedProduct };

  } catch (error) {
     console.error("Update product action failed (admin):", error);
    if (error instanceof z.ZodError) {
      const flatErrors = error.flatten();
      return { success: false, error: "Validation failed", issues: flatErrors.fieldErrors };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred updating product' };
  }
}

/**
 * Delete a product (Admin version)
 */
export async function deleteProduct(data: DeleteProductInput) {
  await checkAdminPermission();
  
  try {
    // Validate input data
    const validatedData = deleteProductSchema.parse(data);
    
    // Check if product exists using Supabase
    const { data: existingProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, name, vendorId') // Select fields needed for notification
      .eq('id', validatedData.id)
      .single();

    if (fetchError) {
        if (fetchError.code === 'PGRST116') { throw new Error('Product not found'); }
        console.error("Error fetching product for delete:", fetchError.message);
        throw new Error("Failed to fetch product for delete.");
    }
     if (!existingProduct) { // Safety check
        throw new Error('Product not found (post-fetch check).');
     }

    // Optional: Add checks similar to the vendor deleteProduct for cart/order items if needed by admin flow
    // const { data: cartItemData, error: cartCheckError } = await supabase...
    // if (cartItemData !== null) { throw new Error("Product exists in a cart"); }
    // const { data: orderItemData, error: orderCheckError } = await supabase...
    // if (orderItemData !== null) { throw new Error("Product exists in an order"); }

    // --- Deletion Process ---
    // Note: Supabase doesn't automatically cascade deletes defined only in Prisma.
    // Ensure ON DELETE CASCADE is set up for ProductImage and Review foreign keys in your actual Supabase DB schema.
    // If cascade is set up in Supabase, deleting the product will automatically delete related images/reviews.
    // If not, delete them manually first like in the vendor action. Assuming cascade for now.

    // Delete the product itself
    const { error: productDeleteError } = await supabase
      .from('Product')
      .delete()
      .eq('id', validatedData.id);

    if (productDeleteError) {
      console.error("Error deleting product (admin):", productDeleteError.message);
      // Handle potential FK constraint errors if cascade isn't set up properly
      throw new Error(`Failed to delete product: ${productDeleteError.message}`);
    }
    
    // Create notification for vendor
    const { error: notificationError } = await supabase
        .from('Notification')
        .insert({
            userId: existingProduct.vendorId, // Use vendorId from the fetched product
        title: 'Product Deleted',
            message: `Your product "${existingProduct.name}" (ID: ${existingProduct.id}) has been deleted by an administrator.`,
            type: 'PRODUCT_DELETED', // Ensure type matches Supabase enum/values
        });

    if (notificationError) {
        console.error("Error creating product deletion notification:", notificationError.message);
    }

    // Revalidate products page
    revalidatePath('/admin/products');
    // No specific product page to revalidate as it's deleted
    
    return { success: true };

  } catch (error) {
    console.error("Delete product action failed (admin):", error);
    if (error instanceof z.ZodError) {
      const flatErrors = error.flatten();
      return { success: false, error: "Validation failed", issues: flatErrors.fieldErrors };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred deleting product' };
  }
}

/**
 * Get product details (Admin version)
 */
export async function getProductDetails(productId: string) {
  await checkAdminPermission();
  
  try {
    // Use Supabase to fetch product and related data
    // Adjust table names and relationships ('Vendor', 'User', 'Category', 'Review') as needed
    const { data: product, error } = await supabase
      .from('Product')
      .select(`
        *,
        Vendor ( id, storeName, User ( id, name, email ) ),
        Category ( * ),
        Review ( *, Customer ( User ( id, name ) ) )
      `)
      .eq('id', productId)
      .single(); // Expect a single product

    if (error) {
        if (error.code === 'PGRST116') { throw new Error('Product not found'); }
        console.error("Error fetching product details (admin):", error.message);
        throw new Error(`Failed to fetch product details: ${error.message}`);
    }
     if (!product) { // Safety check
        throw new Error('Product not found (post-fetch check).');
     }

     // Note: Prisma included _count for reviews and orderItems.
     // Getting counts might require separate Supabase queries or database functions/views.
     // Example: Fetch review count separately
     const { count: reviewCount, error: reviewCountError } = await supabase
        .from('Review')
        .select('*', { count: 'exact', head: true })
        .eq('productId', productId);

     // Example: Fetch order item count separately
     const { count: orderItemCount, error: orderItemCountError } = await supabase
        .from('OrderItem')
        .select('*', { count: 'exact', head: true })
        .eq('productId', productId);

    // Attach counts to the product object (handle potential errors fetching counts)
    const productWithCounts = {
        ...product,
        _count: {
            reviews: reviewCountError ? -1 : (reviewCount ?? 0), // Indicate error with -1 or handle differently
            orderItems: orderItemCountError ? -1 : (orderItemCount ?? 0),
        }
    };


    // The structure of 'product' will depend heavily on the Supabase select query.
    // Adjust the return value or subsequent processing based on the actual shape.
    // For example, vendor info might be nested under 'Vendor', user under 'Vendor.User'.

    return { success: true, product: productWithCounts };

  } catch (error) {
    console.error("Get product details action failed (admin):", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred getting product details' };
  }
}

/**
 * Get products with filtering and pagination (Admin version)
 */
export async function getProducts({
  page = 1,
  limit = 10,
  search = '',
  category = '', // Expecting category NAME here based on original code
  status = '',
  vendor = '', // Expecting vendor ID here based on original code
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  vendor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  await checkAdminPermission();
  
  try {
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    // Start building the query
    let query = supabase
      .from('Product')
      .select(`
        *,
        Vendor ( id, storeName ),
        Category ( id, name ),
        Review ( count ),
        OrderItem ( count )
      `, { count: 'exact' }); // Get total count for pagination

    // Apply filters
    if (search) {
      // Use 'or' for searching across multiple fields
      // Note: Supabase textSearch might be more efficient but requires setup (tsvector column)
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      // Cannot directly filter by sku in the 'or' like Prisma unless also text
    }
    
    if (category) {
       // Filtering by related table name requires a join-like approach or subquery
       // Fetch category ID first, then filter products by that ID
       const { data: categoryData, error: catError } = await supabase
           .from('Category')
           .select('id')
           .ilike('name', `%${category}%`) // Use ilike for case-insensitive search
           .maybeSingle(); // Handle case where category might not be found

       if (catError) console.error("Error fetching category ID for filter:", catError.message);
       // If category found, add filter, otherwise, the filter might return no results if category is mandatory
       if (categoryData) {
            query = query.eq('categoryId', categoryData.id);
       } else if (category) {
           // If a category filter was specified but not found, force no results
           query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Filter by impossible UUID
       }
    }
    
    if (status) {
      // Ensure 'status' column exists and type matches Zod/Product type
      type ProductStatus = z.infer<typeof updateProductStatusSchema>['status'];
      query = query.eq('status', status as ProductStatus); 
    }
    
    if (vendor) {
      query = query.eq('vendorId', vendor); // Ensure 'vendorId' column exists
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'name', 'price', 'inventory', 'status']; // Map 'stock' to 'inventory'
    // Ensure the sortBy column exists in the Product table
    let sortColumn = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    // Map Zod schema field name to DB column name if different (e.g., stock -> inventory)
    if (sortBy === 'stock') sortColumn = 'inventory'; 
    
    const ascending = sortOrder === 'asc';
    // Handle sorting by related fields if necessary (e.g., Vendor(storeName)) - requires careful syntax
    query = query.order(sortColumn, { ascending });


    // Apply pagination
    query = query.range(rangeFrom, rangeTo);

    // Execute the query
    const { data: products, error, count } = await query;

    if (error) {
      console.error("Error fetching products (admin):", error.message);
      throw error;
    }

    // Format results similar to Prisma version (adapt based on actual Supabase result structure)
     const formattedProducts = products?.map(p => {
      // Map Supabase result structure to expected structure
      // Access related data directly (e.g., p.Vendor, p.Category)
      const vendorInfo = p.Vendor as { id: string; storeName: string } | null; // Type assertion
      const categoryInfo = p.Category as { id: string; name: string } | null; // Type assertion
      // Review and OrderItem counts might need refinement based on actual query result
      const reviewCount = (p.Review as any)?.[0]?.count ?? 0;
      const orderItemCount = (p.OrderItem as any)?.[0]?.count ?? 0;

      return {
        ...(p as Product), // Spread the base product fields
        store: vendorInfo ? { id: vendorInfo.id, name: vendorInfo.storeName } : null, // Map Vendor to store
        categories: categoryInfo ? [{ id: categoryInfo.id, name: categoryInfo.name }] : [], // Map Category to categories array
        _count: {
            reviews: reviewCount,
            orderItems: orderItemCount
        }
      }
    }) || [];

    
    return {
      success: true,
      products: formattedProducts,
      pagination: {
        totalItems: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    console.error("Get products action failed (admin):", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred getting products' };
  }
}

/**
 * Get all categories (for admin)
 */
export async function getCategories() {
  // Note: checkAdminPermission() might not be strictly necessary if categories are public,
  // but keeping it consistent with the original function.
  await checkAdminPermission();
  
  try {
    // Fetch all categories using Supabase, ordered by name
    const { data: categories, error } = await supabase
      .from('Category') // Ensure table name matches
      .select('*')
      .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching categories (admin):", error.message);
        throw error;
    }

    return { success: true, categories: categories || [] }; // Return empty array if data is null

  } catch (error) {
    console.error("Get categories action failed (admin):", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred getting categories' };
  }
}

/**
 * Get product analytics (Admin version)
 */
export async function getProductAnalytics(productId: string) {
  await checkAdminPermission();
  
  try {
    // Check if product exists using Supabase
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id, metadata') // Select needed fields, including metadata if viewCount is there
      .eq('id', productId)
      .single();

    if (productError) {
        if (productError.code === 'PGRST116') { throw new Error('Product not found'); }
        console.error("Error fetching product for analytics:", productError.message);
        throw new Error(`Failed to fetch product for analytics: ${productError.message}`);
    }
     if (!product) { // Safety check
        throw new Error('Product not found (post-fetch check).');
     }


    // Get number of orders (count OrderItems for this product)
    const { count: totalOrders, error: orderCountError } = await supabase
        .from('OrderItem')
        .select('*', { count: 'exact', head: true })
        .eq('productId', productId);

     if (orderCountError) {
        console.error("Error fetching order item count for analytics:", orderCountError.message);
        // Decide how to handle - return error or default count?
        // throw new Error(`Failed to fetch order count: ${orderCountError.message}`);
     }

    // Get total revenue from this product (Sum of quantity * price for completed orders)
    // This is harder without joins or a view/function. Fetching all items and summing is inefficient.
    // Option 1: Fetch necessary items and sum in code (less efficient for many orders)
    const { data: orderItems, error: revenueError } = await supabase
        .from('OrderItem')
        .select('quantity, price') // Need price at the time of order
        // .eq('status', 'DELIVERED') // Or based on Order paymentStatus = 'COMPLETED' - needs join/function
        .eq('productId', productId);

    let totalRevenue = 0;
    if (revenueError) {
         console.error("Error fetching order items for revenue calc:", revenueError.message);
         // Handle error - maybe return revenue as -1?
    } else if (orderItems) {
        totalRevenue = orderItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    }
    
    // Get review stats
    const { data: reviews, error: reviewError } = await supabase
        .from('Review')
        .select('rating')
        .eq('productId', productId);

    let totalReviews = 0;
    let averageRating = 0;
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (reviewError) {
         console.error("Error fetching reviews for analytics:", reviewError.message);
         // Handle error
    } else if (reviews) {
        totalReviews = reviews.length;
        if (totalReviews > 0) {
             const totalRatingSum = reviews.reduce((acc, review) => acc + review.rating, 0);
             averageRating = parseFloat((totalRatingSum / totalReviews).toFixed(1));
             // Calculate distribution
             reviews.forEach(r => {
                 if (r.rating >= 1 && r.rating <= 5) {
                    ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
                 }
             });
        }
    }

    // Get view count if available from product metadata
    const viewCount = (product.metadata as any)?.viewCount || 0; // Access metadata safely
    
    return {
      success: true,
      analytics: {
        totalOrders: totalOrders ?? 0, // Use nullish coalescing for count
        totalRevenue,
        totalReviews,
        averageRating,
        ratingDistribution,
        viewCount,
        // Calculate conversion rate carefully to avoid division by zero
        conversionRate: viewCount > 0 ? ((totalOrders ?? 0) / viewCount) * 100 : 0,
      }
    };
  } catch (error) {
    console.error("Get product analytics action failed (admin):", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred getting product analytics' };
  }
} 