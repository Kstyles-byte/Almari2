"use server";

import { auth } from "../auth";
import { createServerActionClient } from '../lib/supabase/server';
import { revalidatePath } from "next/cache";
import { createCustomerProfile, updateCustomerProfile } from "../lib/services/customer";
import { createVendorProfile, updateVendorProfile } from "../lib/services/vendor";
import type { Database, Tables } from '../types/supabase'; // Import Supabase types
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerActionClient } from '../lib/supabase/action';

// Initialize Supabase client (if not already done at top level)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in profile actions.");
  // Handle appropriately
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// REMINDER: Regenerate Supabase types after adding the 'Address' table to the DB!
// npx supabase gen types typescript xunxymxbjqrbsgwqauxx --schema public > types/supabase.ts

// Define Address type alias
type Address = Tables<'Address'>; // Assuming 'Address' is the correct table name in generated types

/**
 * Create or update a customer profile
 */
export async function saveCustomerProfile(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const hostel = formData.get("hostel") as string;
    const room = formData.get("room") as string;
    const college = formData.get("college") as string;
    
    // Check if customer profile already exists
    const supabase = await createServerActionClient();
    const { data: customer } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    if (customer) {
      // Update existing profile
      await updateCustomerProfile(customer.id, {
        phone: phone || undefined,
        address: address || undefined,
        hostel: hostel || undefined,
        room: room || undefined,
        college: college || undefined,
      });
    } else {
      // Create new profile
      await createCustomerProfile(session.user.id, {
        phone: phone || undefined,
        address: address || undefined,
        hostel: hostel || undefined,
        room: room || undefined,
        college: college || undefined,
      });
      
      // Update user role if not already a customer
      if (session.user.role !== "CUSTOMER") {
        await supabase
          .from('User')
          .update({ role: "CUSTOMER" })
          .eq('id', session.user.id);
      }
    }
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error saving customer profile:", error);
    return { error: "Failed to save profile" };
  }
}

/**
 * Create or update a vendor profile
 */
export async function saveVendorProfile(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const storeName = formData.get("storeName") as string;
    const description = formData.get("description") as string;
    const logo = formData.get("logo") as string;
    const banner = formData.get("banner") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    
    if (!storeName) {
      return { error: "Store name is required" };
    }
    
    // Check if vendor profile already exists
    const supabase = await createServerActionClient();
    const { data: vendor } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    if (vendor) {
      // Update existing profile
      await updateVendorProfile(vendor.id, {
        storeName,
        description: description || undefined,
        logo: logo || undefined,
        banner: banner || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
      });
    } else {
      // Create new profile
      await createVendorProfile(session.user.id, {
        storeName,
        description: description || undefined,
        logo: logo || undefined,
        banner: banner || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
      });
      
      // Update user role if not already a vendor
      if (session.user.role !== "VENDOR") {
        await supabase
          .from('User')
          .update({ role: "VENDOR" })
          .eq('id', session.user.id);
      }
    }
    
    revalidatePath("/vendor/profile");
    return { success: true };
  } catch (error) {
    console.error("Error saving vendor profile:", error);
    return { error: "Failed to save profile" };
  }
}

/**
 * Update user's basic information
 */
export async function updateUserInfo(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    
    if (!name || !email) {
      return { error: "Name and email are required" };
    }
    
    const supabase = await createServerActionClient();
    
    // Check if email is already in use by another user
    if (email !== session.user.email) {
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', email)
        .single();
      
      if (existingUser && existingUser.id !== session.user.id) {
        return { error: "Email already in use" };
      }
    }
    
    // Update user
    await supabase
      .from('User')
      .update({ name, email })
      .eq('id', session.user.id);
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating user info:", error);
    return { error: "Failed to update user information" };
  }
}

/**
 * Get all addresses for the logged-in user.
 */
export async function getUserAddresses() {
  try {
    // Use Supabase client for auth instead of auth()
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();
    
    if (authError || !user) {
      console.error("getUserAddresses: Unauthorized - No session found.");
      return { success: false, error: "Unauthorized", addresses: [] };
    }

    // Find the customer profile linked to the user
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      console.error("getUserAddresses: Customer profile not found or error:", customerError?.message);
      // It might be okay if a user doesn't have a customer profile yet
      return { success: true, addresses: [] }; 
    }

    // Fetch addresses linked to the customer ID
    const { data: addresses, error: addressError } = await supabase
      .from('Address')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false }); // Order by most recent

    if (addressError) {
      console.error("getUserAddresses: Error fetching addresses:", addressError.message);
      return { success: false, error: "Failed to fetch addresses.", addresses: [] };
    }

    return { success: true, addresses: (addresses as Address[]) || [] };

  } catch (error: any) {
    console.error("getUserAddresses: Unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred.", addresses: [] };
  }
}

/**
 * Add a new address for the logged-in user.
 * TODO: Add Zod validation for address fields.
 */
export async function addAddress(formData: FormData) {
   try {
    // Use Supabase client for auth instead of auth()
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get customer ID
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError || !customer) {
       return { error: "Customer profile not found. Please complete your profile." };
    }
    const customerId = customer.id;

    // Extract address data from formData - Explicitly typed
    const addressData: {
        address_line1: string;
        address_line2: string | null;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
        phone_number: string | null;
        is_default: boolean;
    } = {
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string || null,
      city: formData.get('city') as string,
      state_province: formData.get('state_province') as string,
      postal_code: formData.get('postal_code') as string,
      country: formData.get('country') as string,
      phone_number: formData.get('phone_number') as string || null,
      is_default: formData.get('is_default') === 'true', // Handle checkbox
    };

    // Basic validation (replace with Zod later)
    if (!addressData.address_line1 || !addressData.city || !addressData.state_province || !addressData.postal_code || !addressData.country) {
        return { success: false, error: "Missing required address fields." };
    }

    // If setting this as default, unset other defaults first
    if (addressData.is_default) {
      const { error: unsetError } = await supabase
        .from('Address')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .eq('is_default', true);
       if (unsetError) {
           console.error("addAddress: Failed to unset previous default address:", unsetError.message);
           // Decide if this is a critical failure or just a warning
           // return { success: false, error: "Failed to update default status." };
       }
    }

    // Insert the new address
    const { data: newAddress, error: insertError } = await supabase
      .from('Address')
      .insert({ ...addressData, customer_id: customerId })
      .select()
      .single();

    if (insertError || !newAddress) {
      console.error("addAddress: Error inserting address:", insertError?.message);
      return { success: false, error: "Failed to add address." };
    }

    revalidatePath('/profile/addresses'); // Or wherever addresses are displayed
    revalidatePath('/checkout'); // Revalidate checkout page too
    return { success: true, address: newAddress as Address };

  } catch (error: any) {
    console.error("addAddress: Unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Update an existing address.
 * TODO: Add Zod validation.
 */
export async function updateAddress(formData: FormData) {
   try {
    // Use Supabase client for auth instead of auth()
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }
    
    const addressId = formData.get('addressId') as string;
    if (!addressId) {
        return { success: false, error: "Address ID is required for update." };
    }

    // Extract address data - Explicitly typed as Partial for update
    const addressUpdateData: {
        address_line1?: string;
        address_line2?: string | null;
        city?: string;
        state_province?: string;
        postal_code?: string;
        country?: string;
        phone_number?: string | null;
        is_default?: boolean;
    } = {};

    // Populate only the fields that are present in the form data
    if (formData.has('address_line1')) addressUpdateData.address_line1 = formData.get('address_line1') as string;
    if (formData.has('address_line2')) addressUpdateData.address_line2 = formData.get('address_line2') as string || null;
    if (formData.has('city')) addressUpdateData.city = formData.get('city') as string;
    if (formData.has('state_province')) addressUpdateData.state_province = formData.get('state_province') as string;
    if (formData.has('postal_code')) addressUpdateData.postal_code = formData.get('postal_code') as string;
    if (formData.has('country')) addressUpdateData.country = formData.get('country') as string;
    if (formData.has('phone_number')) addressUpdateData.phone_number = formData.get('phone_number') as string || null;
    if (formData.has('is_default')) addressUpdateData.is_default = formData.get('is_default') === 'true';

    // Basic validation (check required fields if they are being updated)
    if (addressUpdateData.address_line1 === '' || addressUpdateData.city === '' || addressUpdateData.state_province === '' || addressUpdateData.postal_code === '' || addressUpdateData.country === '') {
        return { success: false, error: "Cannot set required address fields to empty." };
    }

    // Get customer ID to verify ownership
     const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError || !customer) {
       return { error: "Customer profile not found." };
    }
    const customerId = customer.id;

    // If setting this as default, unset other defaults first
    if (addressUpdateData.is_default === true) {
      const { error: unsetError } = await supabase
        .from('Address')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .eq('is_default', true)
        .neq('id', addressId); // Don't unset the one we're about to set
       if (unsetError) {
           console.error("updateAddress: Failed to unset previous default address:", unsetError.message);
           // Decide if this is critical or just a warning
       }
    }

    // Update the address, ensuring it belongs to the customer
    const { data: updatedAddress, error: updateError } = await supabase
      .from('Address')
      .update({...addressUpdateData, updated_at: new Date().toISOString()})
      .eq('id', addressId)
      .eq('customer_id', customerId) // Verify ownership
      .select()
      .single();

    if (updateError || !updatedAddress) {
      console.error("updateAddress: Error updating address:", updateError?.message);
       if (updateError?.code === 'PGRST116') { // PostgREST code for 0 rows updated/returned
           return { success: false, error: "Address not found or you don\'t have permission to update it." };
       }
      return { success: false, error: "Failed to update address." };
    }

    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');
    return { success: true, address: updatedAddress as Address };

  } catch (error: any) {
    console.error("updateAddress: Unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Delete an address.
 */
export async function deleteAddress(formData: FormData) {
  try {
    // Use Supabase client for auth instead of auth()
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }
    
    const addressId = formData.get('addressId') as string;
    if (!addressId) {
        return { success: false, error: "Address ID is required for deletion." };
    }

    // Get customer ID to verify ownership
     const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError || !customer) {
       return { error: "Customer profile not found." };
    }
    const customerId = customer.id;

    // Delete the address, ensuring it belongs to the customer
    const { error: deleteError, count } = await supabase
      .from('Address')
      .delete({ count: 'exact' })
      .eq('id', addressId)
      .eq('customer_id', customerId); // Verify ownership

    if (deleteError) {
      console.error("deleteAddress: Error deleting address:", deleteError.message);
      return { success: false, error: "Failed to delete address." };
    }
    
    if (count === 0) {
        console.warn("deleteAddress: Address not found or user lacked permission.");
        return { success: false, error: "Address not found or you don't have permission to delete it." };
    }

    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');
    return { success: true };

  } catch (error: any) {
    console.error("deleteAddress: Unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Set an address as the default for the user.
 */
export async function setDefaultAddress(formData: FormData) {
    try {
    // Use Supabase client for auth instead of auth()
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }
    
    const addressId = formData.get('addressId') as string;
    if (!addressId) {
        return { success: false, error: "Address ID is required." };
    }

    // Get customer ID
     const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError || !customer) {
       return { error: "Customer profile not found." };
    }
    const customerId = customer.id;
    
    // Use a transaction (RPC function recommended) or sequential updates
    // 1. Unset current default
    const { error: unsetError } = await supabase
      .from('Address')
      .update({ is_default: false })
      .eq('customer_id', customerId)
      .eq('is_default', true);
      
    if (unsetError) {
        console.error("setDefaultAddress: Failed to unset previous default:", unsetError.message);
        return { success: false, error: "Failed to update default address (step 1)." };
    }
    
    // 2. Set new default (verify ownership again)
     const { error: setError } = await supabase
      .from('Address')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('customer_id', customerId); // Verify ownership
      
     if (setError) {
        console.error("setDefaultAddress: Failed to set new default:", setError.message);
        // Attempt to revert the unset operation? Complex without transactions.
        return { success: false, error: "Failed to update default address (step 2)." };
    }

    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');
    return { success: true };

  } catch (error: any) {
    console.error("setDefaultAddress: Unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Get the user's profile data
 */
export async function getUserProfile() {
  try {
    const supabaseActionClient = await createSupabaseServerActionClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabaseActionClient.auth.getUser();
    
    if (authError || !user) {
      return { error: "Unauthorized" };
    }
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('id, name, email, role, avatar_url, created_at')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error("Error fetching user profile:", profileError.message);
      return { error: "Failed to fetch user profile" };
    }
    
    // Get customer profile data if available
    const { data: customerProfile, error: customerError } = await supabase
      .from('Customer')
      .select('id, phone_number, address, hostel, room, college, created_at')
      .eq('user_id', user.id)
      .single();
    
    // Not finding a customer profile is not an error - user might not have one yet
    if (customerError && customerError.code !== 'PGRST116') { // PGRST116 is "no rows returned" in PostgREST
      console.error("Error fetching customer profile:", customerError.message);
    }
    
    return { 
      profile, 
      customerProfile: customerError ? null : customerProfile 
    };
  } catch (error: any) {
    console.error("Error in getUserProfile:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
} 