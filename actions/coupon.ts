"use server";

import { z } from "zod";
import { auth } from "../auth";
import { createClient } from '@supabase/supabase-js';
import type { Tables } from '../types/supabase';
import { revalidatePath } from "next/cache";

// Define local type alias for Coupon using generated types
type Coupon = Tables<'Coupon'>;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in coupon actions.");
  // Consider throwing an error or ensuring functions return error states
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define the state structure returned by the action
export interface ApplyCouponState {
  success: boolean;
  message: string;
  discount?: number;
  couponCode?: string;
  error?: string; // General error message
  fieldErrors?: {
      couponCode?: string[];
  };
}

// Zod schema for validation
const ApplyCouponSchema = z.object({
  couponCode: z.string().min(3, { message: "Coupon code must be at least 3 characters." }).max(50),
  cartSubtotal: z.number().positive({ message: "Cart subtotal must be positive." })
});

export async function applyCoupon(
  prevState: ApplyCouponState | null,
  formData: FormData
): Promise<ApplyCouponState> {
  console.log("applyCoupon action initiated");

  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Authentication required.", error: "Unauthorized" };
  }

  const rawFormData = {
    couponCode: formData.get("couponCode"),
    // Ensure subtotal is passed correctly, potentially as a hidden input
    cartSubtotal: Number(formData.get("cartSubtotal")), 
  };

  // Validate form data
  const validatedFields = ApplyCouponSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Invalid input.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
      error: "Invalid input provided."
    };
  }

  const { couponCode, cartSubtotal } = validatedFields.data;

  try {
    // Fetch the coupon from the database
    const { data: coupon, error: fetchError } = await supabase
      .from('Coupon')
      .select('*')
      .eq('code', couponCode)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching coupon:", fetchError.message);
      return { success: false, message: "Database error.", error: "Failed to check coupon." };
    }

    // Validate coupon existence and conditions
    if (!coupon) {
      return { success: false, message: `Coupon "${couponCode}" not found.`, error: "Invalid coupon code." };
    }

    if (!coupon.is_active) {
      return { success: false, message: "This coupon is not active.", error: "Coupon inactive." };
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { success: false, message: "This coupon has expired.", error: "Coupon expired." };
    }

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return { success: false, message: "This coupon has reached its usage limit.", error: "Usage limit reached." };
    }
    
    const minPurchaseAmount = coupon.min_purchase_amount ?? 0;
    if (cartSubtotal < minPurchaseAmount) {
      return { 
        success: false, 
        message: `Minimum purchase of $${minPurchaseAmount.toFixed(2)} required for this coupon.`,
        error: "Minimum purchase not met."
       };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (Number(coupon.discount_value) / 100) * cartSubtotal;
    } else if (coupon.discount_type === 'FIXED_AMOUNT') {
      discount = Number(coupon.discount_value);
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, cartSubtotal);
    
    // Optionally, you might want to associate the applied coupon with the cart or user session here
    // For simplicity, we're just returning the discount amount now.

    // TODO: Increment usage count if needed (might be better done when order is placed)
    // const { error: updateError } = await supabase
    //   .from('Coupon')
    //   .update({ usage_count: coupon.usage_count + 1 })
    //   .eq('id', coupon.id);
    // Handle updateError if implemented here

    // Revalidate cart path if coupon application modifies server-side cart state (it doesn't currently)
    // revalidatePath("/cart");

    return {
      success: true,
      message: `Coupon "${couponCode}" applied successfully!`, 
      discount: parseFloat(discount.toFixed(2)), // Ensure 2 decimal places
      couponCode: coupon.code
    };

  } catch (error: any) {
    console.error("Unexpected error applying coupon:", error);
    return { success: false, message: "An unexpected error occurred.", error: error.message || "Failed to apply coupon." };
  }
} 