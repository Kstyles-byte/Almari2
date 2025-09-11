'use server';

import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import slugify from "slugify"; // Import slugify
import type {
    Product, 
    Category, 
    Vendor, 
    Review, 
    ProductImage, 
    UserProfile
} from '../types/index';
import type { User } from '@supabase/supabase-js'; // Import User type from supabase-js
// Or import from base Supabase types if needed: import type { Tables } from '../types/supabase';

// Initialize Supabase client ONCE at the top level
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in product actions.");
  // Throw an error or handle appropriately in a real app
  // For now, this will prevent the client from being created properly.
}
// Use the service role client for all actions in this file
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Add a new product (Restoring the function definition)
 */
export async function addProduct(formData: FormData) {
  try { // Add the beginning of the try block
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Fetch user data including vendor_id (using service role client)
    // Use User type from supabase-js, roles might be in app_metadata or a separate table
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(session.user.id);

    if (authUserError || !authUser?.user) {
        console.error("Error fetching auth user data:", authUserError?.message);
        return { error: "Could not verify user." };
    }

    // Assuming role is stored in app_metadata or user_metadata
    const userRole = authUser.user.app_metadata?.role || authUser.user.user_metadata?.role || 'CUSTOMER'; // Default to CUSTOMER if no role
    
    // If using a separate User/Profile table linked to auth.users.id, fetch that instead
    // For now, assume role is in metadata and fetch potential linked vendor_id from User table
    const { data: userData, error: userError } = await supabase
        .from('User') // Your public.User table linked to auth.users
        .select('vendor_id') 
        .eq('id', session.user.id)
        .maybeSingle();

    if (userError) {
        console.error("Error fetching linked user data:", userError?.message);
        // Non-fatal? Maybe proceed without vendor_id if admin?
    }
    
    let vendorId: string;
    if (userRole === 'ADMIN') {
        const formVendorId = formData.get("vendorId") as string;
        if (!formVendorId) {
             return { error: "Admin must specify a Vendor ID to add a product." };
        }
        // TODO: Add check to ensure formVendorId exists in Vendor table
        vendorId = formVendorId;
    } else if (userRole === 'VENDOR' && userData?.vendor_id) {
        vendorId = userData.vendor_id; 
    } else {
        return { error: "User must be an authorized Vendor or Admin to add products." };
    }

    // Extract and validate form data (Must be done INSIDE the function)
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const compareAtPriceStr = formData.get("compare_at_price") as string;
    const categoryId = formData.get("categoryId") as string;
    const inventoryStr = formData.get("inventory") as string;
    const isPublishedStr = formData.get("is_published") as string;
    const imagesJson = formData.get("images") as string;

    // --- Basic Validation ---
    if (!name || !priceStr || !categoryId || !inventoryStr) {
      return { error: "Missing required fields: Name, Price, Category, Inventory." };
    }

    const price = parseFloat(priceStr);
    const inventory = parseInt(inventoryStr, 10);
    const compareAtPrice = compareAtPriceStr ? parseFloat(compareAtPriceStr) : null;
    const isPublished = isPublishedStr === "true";

    if (isNaN(price) || price <= 0) {
      return { error: "Invalid Price." };
    }
    if (isNaN(inventory) || inventory < 0) {
      return { error: "Invalid Inventory count." };
    }
     if (compareAtPrice !== null && (isNaN(compareAtPrice) || compareAtPrice <= 0)) {
      return { error: "Invalid Compare At Price. Must be positive if provided." };
    }

    // --- Advanced Validation ---
    // Check if Category exists
     const { data: categoryData, error: categoryError } = await supabase
      .from('Category').select('id', { count: 'exact', head: true }).eq('id', categoryId);

     if (categoryError || categoryData === null) {
       console.error("Category check failed:", categoryError?.message);
       return { error: "Category not found or error checking category." };
     }

    // Parse and validate images JSON
    let images: { url: string; alt_text?: string }[] = []; // Default to empty array
    try {
      if (imagesJson) {
          const parsedImages = JSON.parse(imagesJson);
          if (Array.isArray(parsedImages)) {
               // Validate basic structure (presence of url)
               images = parsedImages.filter(img => typeof img.url === 'string').map(img => ({
                   url: img.url,
                   alt_text: img.alt || img.alt_text || name // Default alt text to product name
               }));
          } else { throw new Error("Images data is not an array"); }
      }
    } catch (e: any) {
        console.error("Error parsing images JSON:", e.message);
        return { error: "Invalid images JSON format." };
    }

    const slug = slugify(`${name}-${Date.now()}`, { lower: true, strict: true });

    // Insert using snake_case matching DB schema
    const { data: newProductData, error: insertProductError } = await supabase
      .from('Product')
      .insert({
        vendor_id: vendorId,
        category_id: categoryId,
        name,
        slug,
        description,
        price,
        compare_at_price: compareAtPrice, // Use snake_case
        inventory,
        is_published: isPublished, // Use snake_case
      })
      .select('id, name')
      .single();

    if (insertProductError || !newProductData) {
      console.error("Error creating product:", insertProductError?.message);
      return { error: `Failed to create product: ${insertProductError?.message}` };
    }

    // Insert images using snake_case
    if (images.length > 0) {
       const imageInserts = images.map((image, index) => ({
          product_id: newProductData.id,
          url: image.url,
          alt_text: image.alt_text || newProductData.name,
          display_order: index,
        }));

       const { error: imageInsertError } = await supabase
            .from('ProductImage')
            .insert(imageInserts);

       if (imageInsertError) {
           console.error("Error adding product images:", imageInsertError.message);
           // Consider transaction or cleanup logic
       }
    }

    revalidatePath("/vendor/products");
    revalidatePath(`/products/${slug}`);
    return { success: true, productId: newProductData.id };

  } catch (error: any) {
    console.error("Unexpected error adding product:", error);
    return { error: error.message || "Failed to add product due to an unexpected error" };
  }
}


/**
 * Update an existing product
 */
export async function updateProduct(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const productId = formData.get("id") as string;
    if (!productId) return { error: "Product ID is required" };

    // Fetch current product using snake_case
    const { data: currentProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, name, vendor_id, slug')
      .eq('id', productId)
      .single();

    if (fetchError) {
        console.error("Error fetching product for update:", fetchError.message);
        return { error: "Failed to fetch product for update." };
    }
    if (!currentProduct) {
      return { error: "Product not found" };
    }

    // Check authorization using public.User role
    const { data: userData, error: userFetchError } = await supabase
        .from('User')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (userFetchError || !userData) {
        return { error: "Could not verify user role." };
    }
    const userRole = userData.role;

    if (userRole !== "ADMIN") {
        const { data: vendorData, error: vendorError } = await supabase
            .from('Vendor')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

        if (vendorError || !vendorData || currentProduct.vendor_id !== vendorData.id) {
            return { error: "Not authorized to update this product" };
        }
    }

    // Get form data, assuming snake_case names or mapping
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const compareAtPrice = formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null;
    const categoryId = formData.get("categoryId") as string;
    const inventory = parseInt(formData.get("inventory") as string || "0", 10);
    const isPublished = formData.get("is_published") === "true";
    const imagesJson = formData.get("images") as string;

    // Validation... (keep existing)
     if (!name || !price || !categoryId || isNaN(price) || price <= 0 || isNaN(inventory) || inventory < 0) {
      return { error: "Invalid product data..." };
    }
     if (compareAtPrice !== null && (isNaN(compareAtPrice) || compareAtPrice <= 0)) {
      return { error: "Compare price must be positive..." };
    }

    // Check Category Exists... (keep existing)
     const { data: categoryData, error: categoryError } = await supabase
      .from('Category').select('id', { head: true }).eq('id', categoryId);
     if (categoryError || categoryData === null) {
       return { error: "Category not found or error checking category." };
     }

    // Parse images... (keep existing, ensure alt_text mapping)
    let images: { url: string; alt_text?: string }[] | null = null;
    if (imagesJson) {
        try {
            const parsedImages = JSON.parse(imagesJson);
            if (Array.isArray(parsedImages)) {
                 images = parsedImages.map(img => ({
                     url: img.url,
                     alt_text: img.alt || img.alt_text
                 }));
            } else { throw new Error("Images data is not an array"); }
        } catch (e: any) { return { error: "Invalid images JSON format." }; }
    }

    const slug = name !== currentProduct.name
      ? slugify(`${name}-${Date.now()}`, { lower: true, strict: true })
      : currentProduct.slug;

    // Prepare update data using snake_case
    const updateData: Partial<Product> = {
      name,
      slug,
      description,
      price,
      compare_at_price: compareAtPrice,
      category_id: categoryId,
      inventory,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    // Update Product... (keep existing)
    const { error: updateError } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error("Error updating product:", updateError.message);
      return { error: `Failed to update product: ${updateError?.message}` };
    }

    // Handle images update using snake_case
    if (images !== null) {
      const { error: deleteImagesError } = await supabase
        .from('ProductImage')
        .delete()
        .eq('product_id', productId);

      if (deleteImagesError) {
          console.error("Error deleting existing product images:", deleteImagesError.message);
          return { error: `Failed to update product images (delete step): ${deleteImagesError?.message}` };
      }

      if (images.length > 0) {
        const imageInserts = images.map((image, index) => ({
          product_id: productId,
          url: image.url,
          alt_text: image.alt_text || name,
          display_order: index,
        }));

        const { error: imageInsertError } = await supabase
            .from('ProductImage')
            .insert(imageInserts);

        if (imageInsertError) {
           console.error("Error adding new product images:", imageInsertError.message);
           return { error: `Failed to update product images (insert step): ${imageInsertError?.message}` };
        }
      }
    }

    revalidatePath(`/vendor/products/${productId}`);
    revalidatePath(`/vendor/products`);
    revalidatePath(`/products/${slug}`);

    return { success: true, productId };

  } catch (error: any) {
    console.error("Unexpected error updating product:", error);
    return { error: error.message || "Failed to update product due to an unexpected error" };
  }
}


/**
 * Delete a product
 */
export async function deleteProduct(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const productId = formData.get("id") as string;
    if (!productId) return { error: "Product ID is required" };

    // Fetch product using snake_case
    const { data: productData, error: fetchError } = await supabase
      .from('Product')
      .select('id, vendor_id')
      .eq('id', productId)
      .single();

    if (fetchError) { /* ... error handling ... */ }
    if (!productData) { return { error: "Product not found" }; }

    // Check authorization using public.User role... (keep existing logic, ensure vendor check uses productData.vendor_id)
    const { data: userData, error: userFetchError } = await supabase
        .from('User')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (userFetchError || !userData) { console.error("User role check error:", userFetchError?.message); return { error: "User role check failed." }; }
    const userRole = userData.role;

     if (userRole !== "ADMIN") {
        const { data: vendorData, error: vendorError } = await supabase
            .from('Vendor')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
        // Use snake_case for comparison
        if (vendorError || !vendorData || productData.vendor_id !== vendorData.id) {
            return { error: "Not authorized to delete this product" };
        }
     }

    // Check cart items using snake_case
    const { count: cartItemCount, error: cartCheckError } = await supabase
      .from('CartItem')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (cartCheckError) { /* ... error handling ... */ }
    if (cartItemCount !== null && cartItemCount > 0) {
      return { error: "Cannot delete product as it exists in a customer's cart" };
    }

    // Check order items using snake_case
     const { count: orderItemCount, error: orderCheckError } = await supabase
      .from('OrderItem')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (orderCheckError) { /* ... error handling ... */ }
    if (orderItemCount !== null && orderItemCount > 0) {
      return { error: "Cannot delete product as it exists in an order" };
    }

    // Deletion (rely on CASCADE constraints defined in schema-fix.sql)
    const { error: productDeleteError } = await supabase
      .from('Product')
      .delete()
      .eq('id', productId);

    if (productDeleteError) {
      console.error("Error deleting product:", productDeleteError.message);
      if (productDeleteError.code === '23503') { /* ... FK error handling ... */ }
      return { error: `Failed to delete product: ${productDeleteError.message}` };
    }

    revalidatePath("/vendor/products");
    // Revalidate other paths...

    return { success: true };

  } catch (error: any) {
    console.error("Unexpected error deleting product:", error);
    return { error: error.message || "Failed to delete product due to an unexpected error" };
  }
}


/**
 * Get products for the listing page with filtering, sorting, and pagination
 */
interface GetProductsParams {
  categorySlug?: string;
  query?: string;
  filters?: {
    brands?: string[]; // Corresponds to Vendor store_name
    // Add color/size if implementing variants
    priceMin?: number;
    priceMax?: number;
  };
  sortBy?: string; // e.g., 'price-asc', 'newest' (created_at-desc)
  page?: number;
  limit?: number;
}

export async function getProducts({
  categorySlug,
  query,
  filters = {},
  sortBy = 'newest', // Default to newest
  page = 1,
  limit = 12
}: GetProductsParams) {
  try {
    // Setup Supabase client using service role key for full query capabilities
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Start building the query
    let queryBuilder = supabase
      .from('Product')
      .select(`
        id, name, slug, description, price, compare_at_price, inventory, is_published, created_at, updated_at,
        ProductImage(*),
        Category!inner(*),
        Vendor(id, store_name),
        Review(*)
      `)
      .eq('is_published', true)
      .gt('inventory', 0); // Only show available products

    if (categorySlug) {
      queryBuilder = queryBuilder.eq('Category.slug', categorySlug);
    }

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (filters.brands && filters.brands.length > 0) {
      queryBuilder = queryBuilder.in('Vendor.store_name', filters.brands); // Use snake_case
    }
    if (filters.priceMin !== undefined) {
      queryBuilder = queryBuilder.gte('price', filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      queryBuilder = queryBuilder.lte('price', filters.priceMax);
    }

    // Apply Sorting using snake_case column names
    switch (sortBy) {
      case 'price-asc':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      case 'price-desc':
        queryBuilder = queryBuilder.order('price', { ascending: false });
        break;
      case 'newest':
      default: // Default to newest
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        break;
      // Add 'rating' case here if implemented later
    }

    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

const { data: productsData, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching products:", error.message);
      throw error;
    }

    if (!productsData) {
      console.log("No products data returned");
      return { products: [], count: 0, totalPages: 0 };
    }

    // Define structure for processing using snake_case from DB
    type ProductQueryResult = Product & {
        ProductImage: { url: string }[] | null;
        Category: Pick<Category, 'id' | 'name' | 'slug'> | null;
        Vendor: Pick<Vendor, 'store_name'> | null;
        Review: { rating: number }[] | null;
    };

    // Map to component structure (using camelCase where needed)
    // Use double assertion as suggested by linter when type inference struggles with !inner joins
    const formattedProducts = (productsData as unknown as ProductQueryResult[]).map(product => {
       const reviews = product.Review || [];
       const avgRating = reviews.length > 0
         ? reviews.reduce((sum: number, review) => sum + (review.rating ?? 0), 0) / reviews.length
         : 0;

       const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
       const createdAtTime = new Date(product.created_at).getTime(); // Use snake_case

       return {
         id: product.id,
         name: product.name,
         slug: product.slug,
         price: product.price,
         comparePrice: product.compare_at_price, // Map to camelCase
         image: product.ProductImage?.[0]?.url || '/assets/placeholder-product.svg',
         rating: parseFloat(avgRating.toFixed(1)),
         reviews: reviews.length,
         isNew: !isNaN(createdAtTime) && createdAtTime > sevenDaysAgo,
         vendor: product.Vendor?.store_name || 'Unknown', // Use snake_case from DB
         category: product.Category?.name || 'Uncategorized',
         inventory: product.inventory
       };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return { products: formattedProducts, count: count || 0, totalPages };

  } catch (error) {
    console.error("Error processing products query:", error);
    // Always return a valid structure even when errors occur
    return { 
      products: [], 
      count: 0, 
      totalPages: 0 
    };
  }
}


/**
 * Get detailed product information by slug, including relations.
 */
export async function getProductBySlug(slug: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    // Select specific columns using snake_case
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select(`
        id, name, slug, description, price, compare_at_price, inventory, is_published, created_at, updated_at,
        Category!inner (id, name, slug),
        Vendor!inner (id, store_name),
        ProductImage (id, url, alt_text, display_order),
        Review (*, Customer(id, User(id, name)))
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (productError) {
      console.error(`Error fetching product by slug '${slug}':`, productError.message);
      throw productError;
    }

    if (!productData) {
      console.log(`Product with slug '${slug}' not found.`);
      return null;
    }

     // Define expected structure based on query (snake_case)
     type ReviewWithUserProfile = Review & {
        Customer: {
            User: UserProfile | null;
        } | null;
     };
     type ProductImageSubset = Pick<ProductImage, 'id' | 'url' | 'alt_text' | 'display_order'>;
     type VendorSubset = Pick<Vendor, 'id' | 'store_name'>;
     type CategorySubset = Pick<Category, 'id' | 'name' | 'slug'>; // Added id

     // Combine Product base type with nested relation types
     type ProductDetailQueryResult = Omit<Product, 'category_id' | 'vendor_id'> & { // Omit FK IDs
        Category: CategorySubset;
        Vendor: VendorSubset;
        ProductImage: ProductImageSubset[] | null;
        Review: ReviewWithUserProfile[] | null;
     };

    // Use double assertion as suggested by linter when type inference struggles
    const typedProductData = productData as unknown as ProductDetailQueryResult;

    const reviews = typedProductData.Review || [];
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviewCount
      : 0;

    const categoryId = typedProductData.Category.id; // Now ID is included
    let relatedProductsData: any[] = [];
    if (categoryId) {
      const { data: relatedData, error: relatedError } = await supabase
        .from('Product')
        .select(`
          id, name, slug, price, compare_at_price, created_at, inventory,
          ProductImage!inner(url),
          Review(rating)
        `)
        .eq('category_id', categoryId)
        .neq('id', typedProductData.id)
        .eq('is_published', true)
        .gt('inventory', 0)
        .limit(4);

      if (relatedError) {
        console.error(`Error fetching related products for category '${categoryId}':`, relatedError.message);
      } else {
        relatedProductsData = relatedData || [];
      }
    }

    // Updated type to include inventory
    type RelatedProductQueryResult = Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'compare_at_price' | 'created_at' | 'inventory'> & {
        ProductImage: { url: string }[];
        Review: { rating: number }[] | null;
    };

    const formattedRelatedProducts = relatedProductsData.map(prod => {
        const typedProd = prod as RelatedProductQueryResult;
        const relatedReviews = typedProd.Review || [];
        const relatedAvgRating = relatedReviews.length > 0
            ? relatedReviews.reduce((sum: number, review) => sum + (review.rating ?? 0), 0) / relatedReviews.length
            : 0;
        return {
            id: typedProd.id,
            name: typedProd.name,
            slug: typedProd.slug,
            price: typedProd.price,
            comparePrice: typedProd.compare_at_price, // Map to camelCase
            image: typedProd.ProductImage[0]?.url || '/assets/placeholder-product.svg',
            rating: parseFloat(relatedAvgRating.toFixed(1)),
            reviewCount: relatedReviews.length,
            inventory: typedProd.inventory // Added inventory to the result object
        };
    });

    const formattedImages = typedProductData.ProductImage
        ?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) // Sort images, handle null order
        .map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt_text || typedProductData.name
        })) || [];

    const formattedReviews = reviews.map(r => ({
        id: r.id,
        user: r.Customer?.User?.name || 'Anonymous', // Access name via Customer->User path
        rating: r.rating,
        date: r.created_at, // Use snake_case
        comment: r.comment,
        avatar: '/images/avatars/default-avatar.svg' // Using SVG format instead of PNG
    }));

    // Format the final product data for the component (using camelCase where expected)
    const finalProductData = {
      id: typedProductData.id,
      name: typedProductData.name,
      slug: typedProductData.slug,
      description: typedProductData.description,
      price: typedProductData.price,
      comparePrice: typedProductData.compare_at_price, // Map to camelCase
      inventory: typedProductData.inventory,
      isPublished: typedProductData.is_published, // Map to camelCase
      createdAt: typedProductData.created_at, // Map to camelCase
      updatedAt: typedProductData.updated_at, // Map to camelCase
      categoryName: typedProductData.Category.name,
      categorySlug: typedProductData.Category.slug,
      vendorName: typedProductData.Vendor.store_name, // Map to camelCase expected by component?
      vendorId: typedProductData.Vendor.id,
      images: formattedImages,
      reviews: formattedReviews,
      relatedProducts: formattedRelatedProducts, // Pass the updated related products
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviewCount,
      // Add other potential fields if needed by component, e.g., SKU if it existed
    };

    // Return the formatted data ready for the component
    return finalProductData;

  } catch (error) {
    console.error("Unexpected error in getProductBySlug:", error);
    return null;
  }
}

export async function getTrendingProducts({ limit = 3 }: { limit?: number } = {}) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Aggregates are disabled in PostgREST by default. Fetch delivered OrderItems and sum in JS.
    const { data: orderItems, error: salesError } = await supabase
      .from('OrderItem')
      .select('product_id,quantity,status')
      .not('status', 'eq', 'CANCELLED'); // count all fulfilled or in-progress sales

    if (salesError) {
      console.error('Error fetching order items for trending products:', salesError.message);
      throw salesError;
    }

    if (!orderItems || orderItems.length === 0) {
      return { products: [], count: 0 };
    }

    // Compute total sales per product in JS
    const salesMap = new Map<string, number>();
    for (const item of orderItems as any[]) {
      const current = salesMap.get(item.product_id) || 0;
      salesMap.set(item.product_id, current + (item.quantity ?? 0));
    }

    const sortedProductIds = [...salesMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);

    if (sortedProductIds.length === 0) {
      return { products: [], count: 0 };
    }
 
    // 2. Fetch corresponding product details
    const { data: productsData, error: productError } = await supabase
      .from('Product')
      .select(`
        id, name, slug, description, price, compare_at_price, inventory, is_published, created_at,
        ProductImage(*),
        Category(id, name, slug),
        Vendor(store_name),
        Review(rating)
      `)
      .in('id', sortedProductIds)
      .eq('is_published', true);

    if (productError) {
      console.error('Error fetching product details for trending products:', productError.message);
      throw productError;
    }

    if (!productsData) {
      return { products: [], count: 0 };
    }

    // Ensure correct typing for mapping
    type ProductQueryResult = Product & {
      ProductImage: { url: string }[] | null;
      Category: Pick<Category, 'id' | 'name' | 'slug'> | null;
      Vendor: Pick<Vendor, 'store_name'> | null;
      Review: { rating: number }[] | null;
    };

    const formattedProducts = (productsData as unknown as ProductQueryResult[]).map((product) => {
      const reviews = product.Review || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length
        : 0;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const createdAtTime = new Date(product.created_at).getTime();

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.compare_at_price,
        image: product.ProductImage?.[0]?.url || '/assets/placeholder-product.svg',
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: reviews.length,
        isNew: !isNaN(createdAtTime) && createdAtTime > sevenDaysAgo,
        vendor: product.Vendor?.store_name || 'Unknown',
        category: product.Category?.name || 'Uncategorized',
        inventory: product.inventory,
      };
    });

    // Preserve best-selling order using productIds ranking
    const productMap = new Map(formattedProducts.map((p) => [p.id, p]));
    const orderedProducts = sortedProductIds.map((id) => productMap.get(id)).filter(Boolean) as typeof formattedProducts;

    return { products: orderedProducts, count: orderedProducts.length };
  } catch (error) {
    console.error('Unexpected error fetching trending products:', error);
    return { products: [], count: 0 };
  }
}