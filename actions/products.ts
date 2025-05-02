"use server";

import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { getVendorByUserId } from "../lib/services/vendor";
import type { Database, Tables } from '../types/supabase';
import { notFound } from "next/navigation";

// IMPORTANT: Assumes types/supabase.ts reflects the snake_case schema.
// If not, regenerate types: npx supabase gen types typescript ... > types/supabase.ts
// OR manually adjust types below / inline (less ideal).

// Using the generated types which should now match the snake_case schema
type Product = Tables<'Product'>;
type ProductImage = Tables<'ProductImage'>;
type Category = Tables<'Category'>;
type Vendor = Tables<'Vendor'>;
type Review = Tables<'Review'>;
// Assuming UserProfile is derived from User table or a view/function if used
type UserProfile = Pick<Tables<'User'>, 'id' | 'name'>; // Example subset

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for product actions.");
  // Handle appropriately
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(limit = 8) {
  try {
    // Fetch products that are published and have inventory > 0
    // Sort by compare_at_price and created_at
     const { data: productsData, error } = await supabase
      .from('Product')
      .select(`
        *,
        ProductImage!inner (url, alt_text),
        Category!inner (name, slug),
        Vendor!inner (store_name),
        Review (rating)
      `) // Use snake_case
      .eq('is_published', true) // Use snake_case
      .gt('inventory', 0)
      .order('compare_at_price', { ascending: false, nullsFirst: false }) // Use snake_case
      .order('created_at', { ascending: false }) // Use snake_case
      .limit(limit);

    if (error) {
      console.error("Error fetching featured products:", error.message);
      throw error;
    }

    if (!productsData) {
        return [];
    }

    // Define the expected structure more precisely based on selection
     type ProductWithFeaturedRelations = Product & {
        ProductImage: Pick<ProductImage, 'url' | 'alt_text'>[];
        Category: Pick<Category, 'name' | 'slug'>;
        Vendor: Pick<Vendor, 'store_name'>;
        Review: Pick<Review, 'rating'>[] | null;
    };

    // Format the data, mapping DB snake_case to component camelCase if needed
    const formattedProducts = (productsData as ProductWithFeaturedRelations[]).map(product => {
      const reviews = product.Review || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review) => sum + (review.rating ?? 0), 0) // Handle potential null rating?
        : 0;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const createdAtTime = new Date(product.created_at).getTime(); // Use snake_case from DB

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        comparePrice: product.compare_at_price, // Map to camelCase
        slug: product.slug,
        image: product.ProductImage[0]?.url || '/placeholder-product.jpg',
        // alt: product.ProductImage[0]?.alt_text || product.name, // Optional alt text
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: reviews.length,
        isNew: !isNaN(createdAtTime) && createdAtTime > sevenDaysAgo,
        vendor: product.Vendor.store_name || 'Unknown', // Use snake_case from DB result
        category: product.Category.name
      };
    });
    return formattedProducts;

  } catch (error) {
    console.error("Error processing featured products:", error);
    return [];
  }
}

/**
 * Get trending products (based on recent review activity and rating)
 */
export async function getTrendingProducts(limit = 3) {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    const { data: productsData, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        slug,
        price,
        created_at,
        ProductImage!inner ( url ),
        Category!inner ( name ),
        Vendor!inner ( store_name ), 
        Review ( rating )
      `)
      .eq('is_published', true) // Use snake_case
      .gt('inventory', 0)
      .order('created_at', { ascending: false }) // Use snake_case
      .limit(limit * 5);

    if (error) {
      console.error("Error fetching initial trending products:", error.message);
      throw error;
    }

    if (!productsData) {
        return [];
    }

    // Define expected structure matching the query and snake_case
    type TrendingProductQueryResult = Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'created_at'> & {
        ProductImage: { url: string }[];
        Category: { name: string }[];
        Vendor: { store_name: string }[]; // Use snake_case
        Review: { rating: number }[] | null;
    };

    const formattedProducts = (productsData as unknown as TrendingProductQueryResult[]).map(product => {
      const reviews = product.Review || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review) => sum + (review.rating ?? 0), 0) / reviews.length
        : 0;

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.ProductImage[0]?.url || '/placeholder-product.jpg',
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: reviews.length,
        vendor: product.Vendor[0]?.store_name || 'Unknown', // Use snake_case from result
        slug: product.slug,
        category: product.Category[0]?.name || 'Uncategorized'
      };
    });

    formattedProducts.sort((a, b) => {
        if (a.rating !== b.rating) {
            return b.rating - a.rating;
        }
        return b.reviews - a.reviews;
    });

    return formattedProducts.slice(0, limit);

  } catch (error) {
    console.error("Error processing trending products:", error);
    return [];
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
        Review (*, UserProfile:User(id, name)) -- Changed alias, assumes RLS setup allows user read
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
        UserProfile: UserProfile | null; // Use defined UserProfile type
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
          id, name, slug, price, compare_at_price, created_at,
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

    type RelatedProductQueryResult = Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'compare_at_price' | 'created_at'> & {
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
            image: typedProd.ProductImage[0]?.url || '/placeholder-product.jpg',
            rating: parseFloat(relatedAvgRating.toFixed(1)),
            reviewCount: relatedReviews.length,
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
        user: r.UserProfile?.name || 'Anonymous', // Access name from UserProfile alias
        rating: r.rating,
        date: r.created_at, // Use snake_case
        comment: r.comment,
        avatar: '/images/avatars/default-avatar.png' // Assuming no avatarURL in UserProfile selection
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
      relatedProducts: formattedRelatedProducts,
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


/**
 * Add a new product (Vendor or Admin)
 */
export async function addProduct(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) { // Check user ID existence
      return { error: "Unauthorized" };
    }

    // Fetch user role from your public.User table for reliability
    const { data: userData, error: userError } = await supabase
        .from('User')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (userError || !userData) {
        console.error("Error fetching user role or user not found in public.User:", userError?.message);
        return { error: "User role not found or could not be verified." };
    }
    const userRole = userData.role;

    if (userRole !== "VENDOR" && userRole !== "ADMIN") {
      return { error: "Only vendors or admins can add products" };
    }

    let vendorId: string; // UUID string
    if (userRole === "VENDOR") {
        const { data: vendorData, error: vendorError } = await supabase
            .from('Vendor')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

        if (vendorError || !vendorData) {
            console.error("Error fetching vendor ID for user:", session.user.id, vendorError?.message);
            return { error: "Vendor profile not found for current user." };
        }
        vendorId = vendorData.id;
    } else { // Admin case
      const vendorIdFromForm = formData.get("vendorId") as string;
      if (!vendorIdFromForm) return { error: "Admin must specify Vendor ID" };
      // TODO: Optionally verify vendorIdFromForm exists in Vendor table
      vendorId = vendorIdFromForm;
    }

    // Use snake_case for form field names if possible, otherwise map here
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    // Assume form sends 'compare_at_price' or map from 'comparePrice'/'compareAtPrice'
    const compareAtPrice = formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null;
    const categoryId = formData.get("categoryId") as string; // Expecting UUID string
    const inventory = parseInt(formData.get("inventory") as string || "0", 10);
    // Assume form sends 'is_published' or map from 'isPublished'
    const isPublished = formData.get("is_published") === "true";
    const imagesJson = formData.get("images") as string;

    // Validation... (keep existing logic)
    if (!name || !price || !categoryId || isNaN(price) || price <= 0 || isNaN(inventory) || inventory < 0) {
      return { error: "Invalid product data. Name, valid Price, Category, and non-negative Inventory required." };
    }
     if (compareAtPrice !== null && (isNaN(compareAtPrice) || compareAtPrice <= 0)) {
      return { error: "Compare price must be a positive number if provided." };
    }

    // Check category exists... (keep existing logic)
     const { data: categoryData, error: categoryError } = await supabase
      .from('Category')
      .select('id', { count: 'exact', head: true }) // More efficient check
      .eq('id', categoryId);
     if (categoryError || categoryData === null) {
       console.error("Error checking category or category not found:", categoryError?.message);
       return { error: "Failed to verify category or category not found" };
     }

    // Parse images (adjust property name if form sends 'alt')
    let images: { url: string; alt_text?: string }[] = [];
    try {
      if (imagesJson) {
          const parsedImages = JSON.parse(imagesJson);
          if (Array.isArray(parsedImages)) {
               images = parsedImages.map(img => ({
                   url: img.url,
                   alt_text: img.alt || img.alt_text // Accept 'alt' or 'alt_text' from form
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
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const offset = (page - 1) * limit;

  try {
    let queryBuilder = supabase
      .from('Product')
      .select(`
        *,
        ProductImage ( url ),
        Category!inner ( id, name, slug ),
        Vendor!inner ( store_name ), -- Use snake_case
        Review ( rating )
      `, { count: 'exact' })
      .eq('is_published', true) // Use snake_case
      .gt('inventory', 0);

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

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: productsData, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching products:", error.message);
      throw error;
    }

    if (!productsData) {
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
         image: product.ProductImage?.[0]?.url || '/placeholder-product.jpg',
         rating: parseFloat(avgRating.toFixed(1)),
         reviews: reviews.length,
         isNew: !isNaN(createdAtTime) && createdAtTime > sevenDaysAgo,
         vendor: product.Vendor?.store_name || 'Unknown', // Use snake_case from DB
         category: product.Category?.name || 'Uncategorized',
       };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return { products: formattedProducts, count: count || 0, totalPages };

  } catch (error) {
    console.error("Error processing products query:", error);
    return { products: [], count: 0, totalPages: 0 };
  }
}