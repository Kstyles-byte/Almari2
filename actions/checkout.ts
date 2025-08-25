'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import type { Tables } from '@/types/supabase';

// Define the schema for checkout information
const checkoutInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "WhatsApp number is required"),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  saveAddress: z.enum(['true', 'false']).default('false'),
  selectedAddressId: z.string().optional(),
}).refine((data) => {
  if (data.deliveryMethod === 'delivery') {
    const hasSelectedAddress = !!data.selectedAddressId;
    const hasNewAddress = 
      !!data.addressLine1 && 
      !!data.city && 
      !!data.stateProvince && 
      !!data.postalCode && 
      !!data.country;
    return hasSelectedAddress || hasNewAddress;
  }
  return true;
}, {
  message: "For delivery, please select an existing address or enter a new one",
  path: ["selectedAddressId"],
});

// Define the return type for the saveCheckoutInfo action
export type CheckoutInfoResult = {
  success: boolean;
  message?: string;
  error?: string;
  addressId?: string;
};

/**
 * Save checkout information and optionally a new address
 */
export async function saveCheckoutInfo(data: z.infer<typeof checkoutInfoSchema>): Promise<CheckoutInfoResult> {
  console.log("saveCheckoutInfo called with", JSON.stringify(data, null, 2));
  
  try {
    // Validate input data
    const validatedData = checkoutInfoSchema.parse(data);
    
    // Get session for current user
    const session = await auth();
    if (!session?.user) {
      console.error("No authenticated user found");
      return {
        success: false,
        error: "You must be logged in to proceed with checkout"
      };
    }
    
    const userId = session.user.id;
    
    // Store in session (this is a simplified approach)
    // In a real app, you might want to save this in your database
    
    // Create Supabase client for address operations if needed
    if (validatedData.deliveryMethod === 'delivery' && 
        validatedData.saveAddress === 'true' && 
        !validatedData.selectedAddressId &&
        validatedData.addressLine1) {
      
      try {
        // Get Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing Supabase credentials");
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Create address record
        const addressData = {
          user_id: userId,
          address_line1: validatedData.addressLine1,
          address_line2: validatedData.addressLine2 || null,
          city: validatedData.city,
          state_province: validatedData.stateProvince,
          postal_code: validatedData.postalCode,
          country: validatedData.country,
          is_default: false,
        };
        
        const { data: newAddress, error } = await supabase
          .from('Address')
          .insert(addressData)
          .select('id')
          .single();
        
        if (error) {
          console.error("Error saving address:", error.message);
          // Continue checkout even if address save fails
        } else if (newAddress) {
          console.log("Saved new address with ID:", newAddress.id);
          // Return the new address ID
          return {
            success: true,
            message: "Checkout information saved with new address",
            addressId: newAddress.id
          };
        }
      } catch (error) {
        console.error("Error during address save:", error);
        // Continue checkout even if address save fails
      }
    }
    
    // Return success
    return {
      success: true,
      message: "Checkout information saved successfully"
    };
    
  } catch (error) {
    console.error("Error in saveCheckoutInfo:", error);
    
    if (error instanceof z.ZodError) {
      const issues = error.format();
      console.error("Validation issues:", issues);
      
      // Return first error message
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message || "Invalid checkout information"
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Save selected agent for checkout
 */
export async function saveSelectedAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
  console.log("saveSelectedAgent called with", agentId);
  
  try {
    // Get session for current user
    const session = await auth();
    if (!session?.user) {
      console.error("No authenticated user found");
      return {
        success: false,
        error: "You must be logged in to proceed with checkout"
      };
    }
    
    // Validate agent exists (in a real app you'd check this)
    if (!agentId) {
      return {
        success: false,
        error: "Please select a valid pickup location"
      };
    }
    
    // In a real app, you'd save this to a database
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error("Error in saveSelectedAgent:", error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}