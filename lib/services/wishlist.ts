import { createClient } from '@supabase/supabase-js';
import { getCustomerByUserId } from './customer';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in wishlist service.");
}

// Initialize the service role client for actions requiring elevated privileges
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Gets or creates a wishlist for a customer
 */
export async function getCustomerWishlist(customerId: string) {
  try {
    // First, try to find existing wishlist using maybeSingle()
    const { data: wishlist, error: selectError } = await supabase
      .from('Wishlist')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle(); // Use maybeSingle() to avoid error if no row exists

    // If there was an error during select (and it wasn't just that no row was found, which maybeSingle handles gracefully)
    if (selectError) {
      console.error("Error finding wishlist:", selectError);
      throw new Error(selectError.message);
    }

    // If wishlist exists, return it
    if (wishlist) {
      return { wishlist };
    }

    // If no wishlist found, create a new one
    console.log(`Creating new wishlist for customer ${customerId}`);
    const { data: newWishlist, error: createError } = await supabase
      .from('Wishlist')
      .insert({ customer_id: customerId })
      .select()
      .single(); // .single() is okay here as we expect one row after insert

    if (createError) {
      console.error("Error creating wishlist:", createError);
      throw new Error(createError.message);
    }

    return { wishlist: newWishlist };
  } catch (error) {
    console.error("getCustomerWishlist failed:", error);
    return null;
  }
}

// Type definitions for Supabase response
interface ProductImage {
  url: string;
  alt_text: string | null;
  display_order: number;
}

interface VendorInfo {
  id: string;
  store_name: string;
}

interface ReviewInfo {
  rating: number;
}

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  price: number;
  inventory: number;
  is_published: boolean;
  Vendor: VendorInfo | null;
  ProductImage: ProductImage[] | null;
  Review: ReviewInfo[] | null;
}

interface WishlistItemResponse {
  id: string;
  product_id: string;
  Product: ProductInfo | null;
}

/**
 * Fetches a customer's wishlist items with product details
 */
export async function getWishlistItemsWithProducts(wishlistId: string) {
  try {
    const { data, error } = await supabase
      .from('WishlistItem')
      .select(`
        id,
        product_id,
        Product (
          id,
          name,
          slug,
          price,
          inventory,
          is_published,
          Vendor (
            id,
            store_name
          ),
          ProductImage (
            url,
            alt_text,
            display_order
          ),
          Review (
            rating
          )
        )
      `)
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching wishlist items:", error);
      throw new Error(error.message);
    }

    // Process and transform data - using any[] to bypass TypeScript's type checking temporarily
    const wishlistItems = (data as any[]).map(item => {
      // Access Product, handling both scenarios where it might be an array or a single object
      const product = Array.isArray(item.Product) ? item.Product[0] : item.Product;
      
      if (!product) {
        return null; // Skip items with no product data
      }
      
      // Handle Vendor - might be an array or a single object
      const vendor = Array.isArray(product.Vendor) ? product.Vendor[0] : product.Vendor;
      
      // Handle Reviews - normalize to array
      const reviews = Array.isArray(product.Review) ? product.Review : (product.Review ? [product.Review] : []);
      const ratingSum = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      const avgRating = reviews.length > 0 ? ratingSum / reviews.length : 0;
      const reviewCount = reviews.length;

      // Handle ProductImages - normalize to array
      const images = Array.isArray(product.ProductImage) ? product.ProductImage : (product.ProductImage ? [product.ProductImage] : []);
      const primaryImage = images.length > 0 
        ? images.sort((a: any, b: any) => a.display_order - b.display_order)[0]
        : null;
      const imageUrl = primaryImage?.url || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';

      return {
        id: item.id,
        productId: item.product_id,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: imageUrl,
          vendor: vendor?.store_name || 'Unknown Vendor',
          vendorId: vendor?.id,
          rating: avgRating,
          reviews: reviewCount,
          inStock: (product.inventory || 0) > 0 && product.is_published
        }
      };
    })
    .filter(Boolean); // Remove any null items

    return wishlistItems;
  } catch (error) {
    console.error("getWishlistItemsWithProducts failed:", error);
    return [];
  }
}

/**
 * Checks if a product is in the user's wishlist
 */
export async function isProductInWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const customer = await getCustomerByUserId(userId);
    if (!customer) return false;

    const wishlistResult = await getCustomerWishlist(customer.id);
    if (!wishlistResult) return false;

    const { data, error } = await supabase
      .from('WishlistItem')
      .select('id')
      .eq('wishlist_id', wishlistResult.wishlist.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      console.error("Error checking wishlist:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("isProductInWishlist failed:", error);
    return false;
  }
} 