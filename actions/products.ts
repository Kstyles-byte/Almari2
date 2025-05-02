"use server";

import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { getVendorByUserId } from "../lib/services/vendor";
import type { Database, Tables } from '../types/supabase';
import { notFound } from "next/navigation";

// Define local type aliases using the Tables helper
type Product = Tables<'Product'>;
type ProductImage = Tables<'ProductImage'>;
type Category = Tables<'Category'>;
type Vendor = Tables<'Vendor'>;
type Review = Tables<'Review'>;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure keys are available
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for product actions.");
  // Handle appropriately - maybe throw an error or return an error state in functions
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(limit = 8) {
  try {
    // Fetch products that are published and have inventory > 0
    // Sort by comparePrice (for products on sale) and createdAt (for new products)
     const { data: productsData, error } = await supabase
      .from('Product') // Ensure table name matches Supabase
      .select(`
        *,
        ProductImage!inner(*),
        Category!inner(*),
        Vendor!inner(*),
        Review(rating)
      `) // Fetch required fields and relations
      .eq('isPublished', true)
      .gt('inventory', 0)
      .order('comparePrice', { ascending: false, nullsFirst: false })
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching featured products:", error.message);
      throw error; // Let the outer catch handle it
    }

    if (!productsData) {
        return [];
    }

    // Define the expected structure from the Supabase query
     type ProductWithRelations = Product & {
        ProductImage: ProductImage[]; // Assuming ProductImage relation is always present due to !inner
        Category: Category;          // Assuming Category relation is always present due to !inner
        Vendor: Vendor;            // Assuming Vendor relation is always present due to !inner
        Review: Pick<Review, 'rating'>[] | null; // Reviews might be null or empty array
    };

    // Format the data
    const formattedProducts = (productsData as ProductWithRelations[]).map(product => {
      const reviews = product.Review || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: Pick<Review, 'rating'>) => sum + review.rating, 0) / reviews.length
        : 0;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const createdAtTime = new Date(product.createdAt).getTime();

      return {
        id: product.id,
        name: product.name,
        price: product.price, // Assuming price is already a number
        comparePrice: product.comparePrice, // Assuming comparePrice is number | null
        slug: product.slug,
        // Use '!' inner join guarantee so ProductImage should exist if product exists
        image: product.ProductImage[0]?.url || '/placeholder-product.jpg',
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: reviews.length,
        isNew: !isNaN(createdAtTime) && createdAtTime > sevenDaysAgo,
         // Use '!' inner join guarantee so Vendor should exist
        vendor: product.Vendor.storeName || 'Unknown',
         // Use '!' inner join guarantee so Category should exist
        category: product.Category.name
      };
    });
    return formattedProducts;

  } catch (error) {
    console.error("Error processing featured products:", error);
    return []; // Return empty array on error
  }
}

/**
 * Get trending products (based on recent review activity and rating)
 */
export async function getTrendingProducts(limit = 3) {
  // Provide URL and Key for server-side client initialization in actions
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); 
  try {
    // Fetch recently created, published products with inventory
    // Select necessary fields and relations
    const { data: productsData, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        slug,
        price,
        createdAt,
        ProductImage!inner ( url ), 
        Category!inner ( name ), 
        Vendor!inner ( storeName ),
        Review ( rating )
      `)
      .eq('isPublished', true)
      .gt('inventory', 0)
      .order('createdAt', { ascending: false })
      .limit(limit * 5); // Fetch more to filter/sort later

    if (error) {
      console.error("Error fetching initial trending products:", error.message);
      throw error;
    }

    if (!productsData) {
        return [];
    }

    // Define expected structure after Supabase query
    type ProductWithRelations = {
        id: string;
        name: string;
        slug: string;
        price: number;
        createdAt: string;
        ProductImage: { url: string }[];
        Category: { name: string }[];
        Vendor: { storeName: string }[];
        Review: { rating: number }[] | null;
    };

    // Calculate average rating and format
    const formattedProducts = (productsData as ProductWithRelations[]).map(product => {
      const reviews = product.Review || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
        : 0;
      
      // Format into the structure needed by the component
      return {
        id: product.id,
        name: product.name,
        price: product.price, 
        image: product.ProductImage[0]?.url || '/placeholder-product.jpg', // Use first image or placeholder
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: reviews.length,
        vendor: product.Vendor[0]?.storeName || 'Unknown', // Use first vendor name
        slug: product.slug,
        category: product.Category[0]?.name || 'Uncategorized' // Use first category name
      };
    });
    
    // Sort by rating (desc) and review count (desc) as a proxy for trending
    formattedProducts.sort((a, b) => {
        if (a.rating !== b.rating) {
            return b.rating - a.rating; // Higher rating first
        }
        return b.reviews - a.reviews; // More reviews first if ratings are equal
    });

    // Return the top 'limit' products
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
  // Provide URL and Key for server-side client initialization in actions
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    // Fetch the main product data
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select(`
        *,
        Category!inner(*),
        Vendor!inner(*),
        ProductImage(*),
        Review(*, UserProfile(fullName, avatarUrl)) 
      `)
      .eq('slug', slug)
      .eq('isPublished', true)
      .maybeSingle(); // Use maybeSingle as slug should be unique or non-existent

    if (productError) {
      console.error(`Error fetching product by slug '${slug}':`, productError.message);
      throw productError; // Let the outer catch handle it
    }

    if (!productData) {
      console.log(`Product with slug '${slug}' not found.`);
      return null; // Indicate product not found
    }
    
    // Define expected structure after Supabase query
    // Using types generated by Supabase CLI (`types/supabase.ts`) is recommended
    // For brevity, defining inline structure:
     type ReviewWithUser = Review & {
        UserProfile: { fullName: string | null, avatarUrl: string | null } | null;
     };
     type ProductDetailData = Product & {
        Category: Category; // Required due to !inner
        Vendor: Vendor; // Required due to !inner
        ProductImage: ProductImage[] | null;
        Review: ReviewWithUser[] | null;
     };

    const typedProductData = productData as ProductDetailData;

    // Calculate average rating and review count
    const reviews = typedProductData.Review || [];
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;

    // Fetch related products (e.g., from the same category, excluding current product)
    const categoryId = typedProductData.categoryId;
    let relatedProductsData: any[] = []; // Use 'any' for simplicity here, prefer specific type
    if (categoryId) {
      const { data: relatedData, error: relatedError } = await supabase
        .from('Product')
        .select(`
          id, name, slug, price, comparePrice, createdAt,
          ProductImage!inner(url),
          Review(rating)
        `)
        .eq('categoryId', categoryId)
        .neq('id', typedProductData.id) // Exclude the current product
        .eq('isPublished', true)
        .gt('inventory', 0)
        .limit(4); // Limit related products

      if (relatedError) {
        console.error(`Error fetching related products for category '${categoryId}':`, relatedError.message);
        // Don't throw, just proceed without related products
      } else {
        relatedProductsData = relatedData || [];
      }
    }
    
    // Define structure for related products
    type RelatedProductQueryResult = {
        id: string;
        name: string;
        slug: string;
        price: number;
        comparePrice: number | null;
        createdAt: string;
        ProductImage: { url: string }[]; // Should exist due to !inner
        Review: { rating: number }[] | null;
    };

    // Format related products
    const formattedRelatedProducts = relatedProductsData.map(prod => {
        const relatedReviews = (prod as RelatedProductQueryResult).Review || [];
        const relatedAvgRating = relatedReviews.length > 0
            ? relatedReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / relatedReviews.length
            : 0;
        return {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            price: prod.price,
            comparePrice: prod.comparePrice,
            image: (prod as RelatedProductQueryResult).ProductImage[0]?.url || '/placeholder-product.jpg',
            rating: parseFloat(relatedAvgRating.toFixed(1)),
            reviewCount: relatedReviews.length,
        };
    });
    
    // Format the final product data
    const formattedProduct = {
      ...typedProductData,
      images: typedProductData.ProductImage?.map(img => ({ id: img.id, url: img.url, alt: typedProductData.name })) || [],
      categoryName: typedProductData.Category.name,
      categorySlug: typedProductData.Category.slug, // Assuming Category table has slug
      vendorName: typedProductData.Vendor.storeName,
      vendorId: typedProductData.Vendor.id,
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviewCount,
      reviews: reviews.map(r => ({
          id: r.id,
          user: r.UserProfile?.fullName || 'Anonymous',
          rating: r.rating,
          date: r.createdAt, // Or a specific review date field if available
          comment: r.comment,
          avatar: r.UserProfile?.avatarUrl || '/images/avatars/default-avatar.png' // Provide a default avatar
      })),
      relatedProducts: formattedRelatedProducts,
      // Assuming variants are not directly handled here yet, add later if needed
      // Example: colors: typedProductData.ProductVariant?.filter(v => v.type === 'COLOR').map(v => v.value) || [],
      // Example: sizes: typedProductData.ProductVariant?.filter(v => v.type === 'SIZE').map(v => v.value) || [],
      // For now, using mock-like structure if needed by UI, but data isn't fetched
       colors: typedProductData.colors || ["Default"], // Placeholder if 'colors' column exists directly on Product
       sizes: typedProductData.sizes || ["One Size"], // Placeholder if 'sizes' column exists directly on Product
    };
    
    // Remove potentially large raw relational data before returning if not needed
    delete (formattedProduct as any).ProductImage;
    delete (formattedProduct as any).Review;
    // Keep Category and Vendor objects if needed (e.g., for slugs/IDs)
    // delete (formattedProduct as any).Category; 
    // delete (formattedProduct as any).Vendor;

    return formattedProduct;

  } catch (error) {
    console.error("Unexpected error in getProductBySlug:", error);
    // Depending on where this is called, you might want to return null or re-throw
    return null; 
  }
}

/**
 * Add a new product (Vendor or Admin)
 */
export async function addProduct(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Verify user is a vendor or admin
    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      return { error: "Only vendors or admins can add products" };
    }
    
    let vendorId: string;
    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor) return { error: "Vendor profile not found" };
      vendorId = vendor.id;
    } else {
      const vendorIdFromForm = formData.get("vendorId") as string;
      if (!vendorIdFromForm) return { error: "Admin must specify Vendor ID" };
      // TODO: Optionally verify vendorIdFromForm exists using getVendorById (once migrated)
      vendorId = vendorIdFromForm;
    }
    
    // Get and validate form data (simplified validation for brevity)
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const comparePrice = formData.get("comparePrice") ? parseFloat(formData.get("comparePrice") as string) : null;
    const categoryId = formData.get("categoryId") as string;
    const inventory = parseInt(formData.get("inventory") as string || "0", 10);
    const isPublished = formData.get("isPublished") === "true";
    const imagesJson = formData.get("images") as string;

    if (!name || !price || !categoryId || isNaN(price) || price <= 0 || isNaN(inventory) || inventory < 0) {
      return { error: "Invalid product data. Name, valid Price, Category, and non-negative Inventory required." };
    }
     if (comparePrice !== null && (isNaN(comparePrice) || comparePrice <= 0)) {
      return { error: "Compare price must be greater than 0" };
    }

    // Check if category exists (using Supabase)
    const { data: categoryData, error: categoryError } = await supabase
      .from('Category')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle(); // Use maybeSingle in case category doesn't exist

    if (categoryError) {
       console.error("Error checking category:", categoryError.message);
       return { error: "Failed to verify category" };
    }
    if (!categoryData) {
      return { error: "Category not found" };
    }
    
    // Parse images
    let images: { url: string; alt?: string }[] = [];
    try {
      if (imagesJson) images = JSON.parse(imagesJson);
    } catch (e) {
      return { error: "Invalid images JSON format" };
    }
    
    // Generate slug
    const slug = slugify(`${name}-${Date.now()}`, { lower: true, strict: true });
    
    // Create product in Supabase
    const { data: newProductData, error: insertProductError } = await supabase
      .from('Product')
      .insert({
        name,
        slug,
        description,
        price,
        comparePrice, // Supabase handles null
        categoryId,
        inventory,
        isPublished,
        vendorId,
        // createdAt and updatedAt are handled by Supabase defaults
      })
      .select('id, name') // Select only needed fields from the result
      .single(); // Expecting a single inserted row object back

    if (insertProductError || !newProductData) {
      console.error("Error creating product:", insertProductError?.message);
      return { error: `Failed to create product: ${insertProductError?.message}` };
    }

    // Add images if provided
    if (images.length > 0) {
       const imageInserts = images.map((image, index) => ({
          productId: newProductData.id,
          url: image.url,
          alt: image.alt || newProductData.name,
          order: index,
        }));

       const { error: imageInsertError } = await supabase
            .from('ProductImage')
            .insert(imageInserts);
       
       if (imageInsertError) {
           // Log the error, but maybe don't fail the whole operation?
           // Or potentially implement a transaction if possible/needed
           console.error("Error adding product images:", imageInsertError.message);
           // Decide if this is a critical error
           // return { error: `Failed to add product images: ${imageInsertError?.message}` }; 
       }
    }
    
    revalidatePath("/vendor/products");
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
    if (!session?.user) return { error: "Unauthorized" };

    const productId = formData.get("id") as string;
    if (!productId) return { error: "Product ID is required" };

    // Get the product to check ownership and current name for slug generation
    const { data: currentProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, name, vendorId, slug')
      .eq('id', productId)
      .single();

    if (fetchError) {
        console.error("Error fetching product for update:", fetchError.message);
        return { error: "Failed to fetch product for update." };
    }
    if (!currentProduct) {
      return { error: "Product not found" };
    }

    // Check authorization
    if (session.user.role !== "ADMIN") {
        const vendor = await getVendorByUserId(session.user.id);
        if (!vendor || currentProduct.vendorId !== vendor.id) {
            return { error: "Not authorized to update this product" };
        }
    }
    
    // Get and validate form data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const comparePrice = formData.get("comparePrice") ? parseFloat(formData.get("comparePrice") as string) : null;
    const categoryId = formData.get("categoryId") as string;
    const inventory = parseInt(formData.get("inventory") as string || "0", 10);
    const isPublished = formData.get("isPublished") === "true";
    const imagesJson = formData.get("images") as string;

    if (!name || !price || !categoryId || isNaN(price) || price <= 0 || isNaN(inventory) || inventory < 0) {
      return { error: "Invalid product data. Name, valid Price, Category, and non-negative Inventory required." };
    }
     if (comparePrice !== null && (isNaN(comparePrice) || comparePrice <= 0)) {
      return { error: "Compare price must be greater than 0" };
    }

    // Check if category exists (optional, could rely on FK constraint)
    const { data: categoryData, error: categoryError } = await supabase
      .from('Category').select('id').eq('id', categoryId).maybeSingle();
     if (categoryError) {
       console.error("Error checking category:", categoryError.message);
       return { error: "Failed to verify category" };
     }    
    if (!categoryData) return { error: "Category not found" };
    
    // Parse images
    let images: { url: string; alt?: string }[] | null = null; // Use null to track if images were provided
    if (imagesJson) {
        try {
            images = JSON.parse(imagesJson);
        } catch (e) {
            return { error: "Invalid images JSON format" };
        }
    }

    // Generate new slug if name changed
    const slug = name !== currentProduct.name 
      ? slugify(`${name}-${Date.now()}`, { lower: true, strict: true }) 
      : currentProduct.slug;
    
    // Prepare update data object
    const updateData: Partial<Product> = {
      name,
      slug,
      description,
      price,
      comparePrice,
      categoryId,
      inventory,
      isPublished,
      updatedAt: new Date().toISOString(), // Manually set update timestamp
    };

    // Update product in Supabase
    const { error: updateError } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error("Error updating product:", updateError.message);
      return { error: `Failed to update product: ${updateError?.message}` };
    }

    // Handle images update *if* images were provided in the form data
    if (images !== null) {
      // Delete existing images first
      const { error: deleteImagesError } = await supabase
        .from('ProductImage')
        .delete()
        .eq('productId', productId);

      if (deleteImagesError) {
          console.error("Error deleting existing product images:", deleteImagesError.message);
          // Decide if this is critical
          return { error: `Failed to update product images (delete step): ${deleteImagesError?.message}` };
      }

      // Add new images if there are any
      if (images.length > 0) {
        const imageInserts = images.map((image, index) => ({
          productId: productId,
          url: image.url,
          alt: image.alt || name, // Use the new name
          order: index,
        }));

        const { error: imageInsertError } = await supabase
            .from('ProductImage')
            .insert(imageInserts);
        
        if (imageInsertError) {
           console.error("Error adding new product images:", imageInsertError.message);
           // Decide if this is critical
           return { error: `Failed to update product images (insert step): ${imageInsertError?.message}` };
        }
      }
    }
    
    revalidatePath(`/vendor/products/${productId}`);
    revalidatePath(`/vendor/products`);
    revalidatePath(`/products/${slug}`); // Revalidate public product page too
    
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
    if (!session?.user) return { error: "Unauthorized" };

    const productId = formData.get("id") as string;
    if (!productId) return { error: "Product ID is required" };

    // Get the product to check ownership
    const { data: productData, error: fetchError } = await supabase
      .from('Product')
      .select('id, vendorId') // Only select needed fields
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error("Error fetching product for delete check:", fetchError.message);
      return { error: "Failed to fetch product for deletion." };
    }
    if (!productData) {
      return { error: "Product not found" };
    }

    // Check authorization
     if (session.user.role !== "ADMIN") {
        const vendor = await getVendorByUserId(session.user.id);
        if (!vendor || productData.vendorId !== vendor.id) {
            return { error: "Not authorized to delete this product" };
        }
     }
    
    // Check if product is in any cart item
    const { data: cartItemData, error: cartCheckError } = await supabase
      .from('CartItem')
      .select('id', { head: true }) // Check if at least one exists
      .eq('productId', productId)
      .limit(1);

    if (cartCheckError) {
       console.error("Error checking cart items:", cartCheckError.message);
       return { error: "Error checking product usage in carts." };
    }
    // If data is not null, it means a matching item exists
    if (cartItemData !== null) {
      return { error: "Cannot delete product as it exists in a customer's cart" };
    }
    
    // Check if product is in any order item
     const { data: orderItemData, error: orderCheckError } = await supabase
      .from('OrderItem')
      .select('id', { head: true }) // Check if at least one exists
      .eq('productId', productId)
      .limit(1);
      
    if (orderCheckError) {
       console.error("Error checking order items:", orderCheckError.message);
       return { error: "Error checking product usage in orders." };
    }
    // If data is not null, it means a matching item exists
    if (orderItemData !== null) {
      return { error: "Cannot delete product as it exists in an order" };
    }
    
    // --- Deletion Process (Consider running in a transaction if possible/needed) ---

    // 1. Delete product images
    const { error: imageDeleteError } = await supabase
      .from('ProductImage')
      .delete()
      .eq('productId', productId);
    if (imageDeleteError) {
      console.error("Error deleting product images:", imageDeleteError.message);
      return { error: `Failed to delete product images: ${imageDeleteError.message}` };
    }
    
    // 2. Delete product reviews
     const { error: reviewDeleteError } = await supabase
      .from('Review')
      .delete()
      .eq('productId', productId);
    if (reviewDeleteError) {
      console.error("Error deleting product reviews:", reviewDeleteError.message);
      return { error: `Failed to delete product reviews: ${reviewDeleteError.message}` };
    }

    // 3. Delete the product itself
    const { error: productDeleteError } = await supabase
      .from('Product')
      .delete()
      .eq('id', productId);

    if (productDeleteError) {
      console.error("Error deleting product:", productDeleteError.message);
      return { error: `Failed to delete product: ${productDeleteError.message}` };
    }
    
    revalidatePath("/vendor/products");
    // Consider revalidating other related paths if necessary
    
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
  filters?: { // Define expected filter structure
    brands?: string[];
    colors?: string[]; // Add color/size if schema supports
    sizes?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  sortBy?: string; // e.g., 'price-asc', 'newest', 'rating'
  page?: number;
  limit?: number;
}

export async function getProducts({ 
  categorySlug,
  query,
  filters = {},
  sortBy = 'featured',
  page = 1,
  limit = 12 
}: GetProductsParams) {
  // Provide URL and Key for server-side client initialization in actions
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const offset = (page - 1) * limit;

  try {
    let queryBuilder = supabase
      .from('Product')
      .select(`
        *,
        ProductImage ( url ),
        Category!inner ( id, name, slug ),
        Vendor!inner ( storeName ), 
        Review ( rating )
      `, { count: 'exact' }) 
      .eq('isPublished', true)
      .gt('inventory', 0);
      // Note: Range is applied *after* filtering and sorting for correct pagination

    // Filter by Category Slug
    if (categorySlug) {
      queryBuilder = queryBuilder.eq('Category.slug', categorySlug);
    }

    // Filter by Search Query (name or description)
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Apply Dynamic Filters
    if (filters.brands && filters.brands.length > 0) {
      // Filter by Vendor storeName using the joined Vendor table
      queryBuilder = queryBuilder.in('Vendor.storeName', filters.brands);
    }
    if (filters.priceMin !== undefined) {
      queryBuilder = queryBuilder.gte('price', filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      queryBuilder = queryBuilder.lte('price', filters.priceMax);
    }
    // TODO: Implement color/size filtering here if schema is updated
    // Example: if (filters.colors && filters.colors.length > 0) { ... }

    // Apply Sorting
    switch (sortBy) {
      case 'price-asc':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      case 'price-desc':
        queryBuilder = queryBuilder.order('price', { ascending: false });
        break;
      case 'newest':
        queryBuilder = queryBuilder.order('createdAt', { ascending: false });
        break;
      case 'rating': 
        // TODO: Implement proper sorting by average rating.
        // This likely requires a database function (RPC) or complex post-processing.
        // Falling back to sorting by newest for now.
        console.warn("Sorting by rating is not fully implemented, falling back to newest.");
        queryBuilder = queryBuilder.order('createdAt', { ascending: false });
        break;
      case 'featured':
      default:
        // Default sort (newest)
        queryBuilder = queryBuilder.order('createdAt', { ascending: false });
        break;
    }

    // Apply range *after* filtering and sorting
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    // Execute the query
    const { data: productsData, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching products:", error.message);
      throw error;
    }

    if (!productsData) {
      return { products: [], count: 0, totalPages: 0 };
    }

    // Define structure for processing
    type ProductQueryResult = Product & {
        ProductImage: { url: string }[] | null;
        Category: { id: string; name: string; slug: string } | null; // Category should be object
        Vendor: { storeName: string } | null; // Vendor should be object
        Review: { rating: number }[] | null;
    };

    // Format data for the listing page
    const formattedProducts = (productsData as ProductQueryResult[]).map(product => {
       const reviews = product.Review || [];
       const avgRating = reviews.length > 0
         ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
         : 0;
         
       const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
       const createdAtTime = new Date(product.createdAt).getTime();

       return {
         id: product.id,
         name: product.name,
         slug: product.slug,
         price: product.price,
         comparePrice: product.comparePrice, 
         image: product.ProductImage?.[0]?.url || '/placeholder-product.jpg',
         rating: parseFloat(avgRating.toFixed(1)),
         reviews: reviews.length,
         isNew: !isNaN(createdAtTime) && createdAtTime > sevenDaysAgo,
         vendor: product.Vendor?.storeName || 'Unknown',
         category: product.Category?.name || 'Uncategorized', // For display
       };
    });
    
    const totalPages = Math.ceil((count || 0) / limit);

    return { products: formattedProducts, count: count || 0, totalPages };

  } catch (error) {
    console.error("Error processing products query:", error);
    return { products: [], count: 0, totalPages: 0 }; // Return empty state on error
  }
} 