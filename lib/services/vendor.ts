import { db } from "../db";
import { createClient } from '@supabase/supabase-js';
import type { Vendor, Product } from '../../types/index'; // Import Vendor and Product types

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure keys are available
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for vendor service.");
  // Handle missing keys appropriately
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define an interface for the structure of sales data grouped by status
interface SalesByStatusData {
  status: string; // Or the specific enum type if available
  _sum: {
    price: number | null; // Sum can be null if no items match
  };
  _count: number;
}

/**
 * Get a vendor by user ID
 * @param userId - The ID of the user (should match Supabase Auth user ID)
 * @returns The vendor profile or null if not found
 */
export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  try {
    // Query the public 'Vendor' table
    const { data, error } = await supabase
      .from('Vendor') // Ensure this table name matches your Supabase table
      .select('*') // Select all columns from Vendor table
      .eq('user_id', userId) // Filter by the user_id column
      .single(); // Expect at most one result

    if (error) {
      // Log error but don't throw if it's just 'PGRST116' (resource not found)
      if (error.code !== 'PGRST116') {
        console.error("Error fetching vendor by user ID:", error.message);
        throw error; // Rethrow other errors
      }
      // If not found (PGRST116), data will be null, which is handled below
    }

    return data; // Returns the Vendor object or null

  } catch (error) {
    // Catch rethrown errors or unexpected issues
    console.error("Unexpected error in getVendorByUserId:", error);
    // Decide whether to throw or return null based on desired error handling
    // For consistency with the original Prisma version, we rethrow
    throw error;
  }
}

/**
 * Get a vendor by ID
 * @param id - The ID of the vendor
 * @returns The vendor profile or null if not found
 */
export async function getVendorById(id: string): Promise<Vendor | null> {
  try {
    // Fetch vendor by primary key 'id'
    const { data, error } = await supabase
      .from('Vendor')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle as it might not exist

    if (error && error.code !== 'PGRST116') { // Ignore 'resource not found' error
      console.error("Error fetching vendor by ID:", error.message);
      throw error;
    }
    return data; // Returns Vendor object or null
  } catch (error) {
    console.error("Unexpected error in getVendorById:", error);
    throw error;
  }
}

/**
 * Create a vendor profile for a user
 * @param userId - The ID of the user (should match Supabase Auth user ID)
 * @param data - The vendor profile data
 * @returns The created vendor profile
 */
export async function createVendorProfile(
  userId: string,
  data: {
    storeName: string;
    description?: string;
    logo?: string;
    banner?: string;
    bankName?: string;
    accountNumber?: string;
  }
): Promise<Vendor | null> { // Return type adjusted for potential errors
  try {
    // 1. Check if vendor profile already exists for this userId
    const { data: existingVendor, error: checkError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking for existing vendor:", checkError.message);
      throw checkError;
    }

    if (existingVendor) {
      throw new Error("Vendor profile already exists for this user");
    }

    // 2. Check if the user exists in the custom 'User' table (optional but good practice)
    //    Assuming Supabase Auth handles user existence before this function is called
    //    If you store additional user info in the 'User' table, you might check here.
    /*
    const { data: userExists, error: userCheckError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userCheckError || !userExists) {
       throw new Error("User not found in custom User table");
    }
    */

    // 3. Create vendor profile in the 'Vendor' table
    const { data: newVendor, error: insertError } = await supabase
      .from('Vendor')
      .insert({
        user_id: userId,
        store_name: data.storeName,
        description: data.description,
        logo_url: data.logo,
        banner_url: data.banner,
        bank_name: data.bankName,
        account_number: data.accountNumber,
        is_approved: false, // Default requires admin approval
        commission_rate: 5, // Default commission rate (adjust as needed) - check schema
        // createdAt/updatedAt are handled by DB defaults/triggers
      })
      .select('*') // Select the newly created vendor data
      .single(); // Expecting a single row insertion

    if (insertError) {
      console.error("Error creating vendor profile:", insertError.message);
      throw insertError;
    }

    return newVendor;

  } catch (error) {
    console.error("Error in createVendorProfile:", error);
    // Re-throw the error to be handled by the calling action/component
    // Consider more specific error handling if needed
    throw error;
  }
}

/**
 * Update a vendor profile
 * @param vendorId - The ID of the vendor record in the Vendor table
 * @param data - The vendor profile data to update
 * @returns The updated vendor profile
 */
export async function updateVendorProfile(
  vendorId: string,
  data: {
    storeName?: string;
    description?: string;
    logo?: string;
    banner?: string;
    bankName?: string;
    accountNumber?: string;
  }
): Promise<Vendor | null> { // Return type adjusted
  try {
    // Construct the update object, removing undefined fields
    const updateData: Partial<Vendor> = {};
    if (data.storeName !== undefined) updateData.store_name = data.storeName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logo !== undefined) updateData.logo_url = data.logo;
    if (data.banner !== undefined) updateData.banner_url = data.banner;
    if (data.bankName !== undefined) updateData.bank_name = data.bankName;
    if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
    // Add updatedAt timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length <= 1) { // Only contains updatedAt
      // No actual data to update, maybe fetch and return current data or throw error?
      // For now, just return null or fetch existing data
      return getVendorById(vendorId);
    }

    const { data: updatedVendor, error } = await supabase
      .from('Vendor')
      .update(updateData)
      .eq('id', vendorId)
      .select('*') // Select the updated vendor data
      .single(); // Expecting a single row update

    if (error) {
      console.error("Error updating vendor profile:", error.message);
      throw error;
    }

    return updatedVendor;

  } catch (error) {
    console.error("Error in updateVendorProfile:", error);
    throw error;
  }
}

/**
 * Get sales dashboard data for a vendor
 * @param vendorId - The ID of the vendor
 * @returns The sales dashboard data
 */
export async function getVendorDashboard(vendorId: string) {
  try {
    // 1. Get recent order items for this vendor (fetch necessary related data)
    const { data: recentOrderItems, error: recentOrdersError } = await supabase
      .from('OrderItem')
      .select(`
        *,
        order:Order ( id, status, paymentStatus, createdAt, customer:Customer ( user:User ( name ) ) ),
        product:Product ( name, price )
      `)
      .eq('vendorId', vendorId)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (recentOrdersError) throw recentOrdersError;

    // 2. Get total sales (sum of prices for completed order items)
    // Supabase aggregation can be tricky. Using RPC or client-side calculation might be needed for complex sums.
    // Simple approach: Fetch relevant items and sum client-side, or create a DB function.
    // Fetching items approach:
    const { data: completedItems, error: completedItemsError } = await supabase
      .from('OrderItem')
      .select('price, order:Order!inner(paymentStatus)') // Join Order table, filter only rows where join succeeds
      .eq('vendorId', vendorId)
      .eq('order.paymentStatus', 'COMPLETED'); // Filter by paymentStatus in joined Order table

    if (completedItemsError) throw completedItemsError;

    const totalSales = completedItems?.reduce((sum, item) => sum + Number(item.price || 0), 0) || 0;

    // 3. Get total order items (count)
    // Use Supabase count feature
    const { count: totalOrderItemsCount, error: totalItemsError } = await supabase
        .from('OrderItem')
        .select('*', { count: 'exact', head: true }) // head: true prevents fetching data
        .eq('vendorId', vendorId);

    if (totalItemsError) throw totalItemsError;

    // 4. Get total products (count)
    const { count: totalProductsCount, error: totalProductsError } = await supabase
        .from('Product')
        .select('*', { count: 'exact', head: true })
        .eq('vendorId', vendorId);

    if (totalProductsError) throw totalProductsError;

    // 5. Get sales by status (requires grouping - potentially complex in Supabase JS client)
    // Using RPC (Database Function) is the most robust way for grouping/aggregation.
    // Alternative: Fetch all items and group/sum client-side (less efficient for large datasets).
    // Placeholder: Return empty array for now, recommend creating a DB function.
    const salesByStatus: SalesByStatusData[] = []; // TODO: Implement with Supabase RPC or client-side grouping

    // Fetching and grouping client-side example (less performant):
    /*
    const { data: allItemsForStatus, error: allItemsErrorStatus } = await supabase
      .from('OrderItem')
      .select('status, price')
      .eq('vendorId', vendorId);

    if (allItemsErrorStatus) throw allItemsErrorStatus;

    const salesByStatusMap = allItemsForStatus?.reduce((acc, item) => {
        const status = item.status;
        const price = Number(item.price || 0);
        if (!acc[status]) {
            acc[status] = { status: status, _sum: { price: 0 }, _count: 0 };
        }
        acc[status]._sum.price += price;
        acc[status]._count += 1;
        return acc;
    }, {} as Record<string, { status: string, _sum: { price: number }, _count: number }>);

    const salesByStatus: SalesByStatusData[] = Object.values(salesByStatusMap || {});
    */


    return {
      recentOrderItems: recentOrderItems || [],
      totalSales: totalSales,
      totalOrderItems: totalOrderItemsCount ?? 0,
      totalProducts: totalProductsCount ?? 0,
      salesByStatus, // Placeholder or client-side grouped data
    };
  } catch (error) {
    console.error("Error fetching vendor dashboard:", error);
    throw error;
  }
}

/**
 * Get products for a vendor with pagination, search, and filtering
 * @param vendorId - The ID of the vendor
 * @param params - Query parameters
 * @returns Products with pagination metadata
 */
export async function getVendorProducts(
  vendorId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean | string; // Allow string for form data
  } = {}
): Promise<{ products: Product[], totalCount: number, totalPages: number }> {
  try {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('Product')
      .select(`
        *,
        category:Category ( name ),
        images:ProductImage ( url, alt, order )
      `, { count: 'exact' }) // Get total count for pagination
      .eq('vendorId', vendorId);

    // Apply search filter (using ilike for case-insensitive search)
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
      // Could also search description: .or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    // Apply isPublished filter
    if (params.isPublished !== undefined && params.isPublished !== null && params.isPublished !== '') {
        // Convert string "true"/"false" from FormData if necessary
        const publishedBool = typeof params.isPublished === 'string'
            ? params.isPublished.toLowerCase() === 'true'
            : Boolean(params.isPublished);
        query = query.eq('isPublished', publishedBool);
    }

    // Apply ordering and pagination
    query = query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: products, error, count } = await query;

    if (error) {
      console.error("Error fetching vendor products:", error.message);
      throw error;
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: products || [],
      totalCount,
      totalPages,
    };

  } catch (error) {
    console.error("Error in getVendorProducts:", error);
    throw error;
  }
}

/**
 * Approve a vendor and optionally set commission rate
 * @param vendorId - The ID of the vendor to approve
 * @param commissionRate - Optional commission rate to set
 * @returns The updated vendor profile
 */
export async function approveVendor(vendorId: string, commissionRate?: number): Promise<Vendor | null> {
  try {
    const updateData: Partial<Vendor> & { updated_at: string } = {
      is_approved: true,
      updated_at: new Date().toISOString(),
    };

    if (commissionRate !== undefined && commissionRate >= 0) {
      updateData.commission_rate = commissionRate;
    }

    const { data: updatedVendor, error } = await supabase
      .from('Vendor')
      .update(updateData)
      .eq('id', vendorId)
      .select('*') // Select the updated vendor data
      .single(); // Expecting a single row update

    if (error) {
        if (error.code === 'PGRST116') { // Vendor not found
            throw new Error(`Vendor with ID ${vendorId} not found.`);
        }
        console.error("Error approving vendor:", error.message);
        throw error;
    }

    // TODO: Send notification to the vendor user?
    // Requires fetching the vendor's userId first.
    // Example: await createVendorApprovedNotification(updatedVendor.userId);

    return updatedVendor;

  } catch (error) {
    console.error("Error in approveVendor:", error);
    throw error;
  }
}

// TODO: Add other vendor service functions as needed (e.g., rejectVendor, getVendorPayouts) 