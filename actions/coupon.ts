"use server";

import { z } from "zod";
import type { Tables } from '../types/supabase';
import { validateCouponForCart } from "@/lib/services/coupon";
import { createSupabaseServerActionClient } from "@/lib/supabase/action";
import { revalidatePath } from "next/cache";

// Define local type alias for Coupon using generated types
type Coupon = Tables<'Coupon'>;

// Simple in-memory rate-limit map (resets on serverless cold-start). Allows 3
// coupon attempts per user per minute. If the map grows too large it should be
// pruned – acceptable for current scale.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 3;
interface RateEntry { count: number; timestamp: number }
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore attach to global to persist across hot-reloads
const rateMap: Map<string, RateEntry> = (globalThis as any).__couponRateMap ?? new Map();
// @ts-ignore
(globalThis as any).__couponRateMap = rateMap;

// No Supabase client required here – the coupon service handles it.

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

  // Fetch current user (may be null for guests)
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ----- RATE LIMIT CHECK -----
  const rateKey = user?.id ?? 'guest';
  const now = Date.now();
  const entry = rateMap.get(rateKey);
  if (entry && now - entry.timestamp < RATE_LIMIT_WINDOW_MS && entry.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return {
      success: false,
      message: 'Too many coupon attempts – please wait a minute and try again.',
      error: 'Rate limit exceeded',
    };
  }

  // Normalise coupon code (trim & uppercase) before validation
  const rawCode = (formData.get("couponCode") ?? "").toString().trim();

  const rawFormData = {
    couponCode: rawCode,
    // Ensure subtotal is passed correctly, potentially as a hidden input
    cartSubtotal: Number(formData.get("cartSubtotal")),
  };

  // Update rate entry post-input validation regardless of success to discourage brute-force
  if (entry && now - entry.timestamp < RATE_LIMIT_WINDOW_MS) {
    entry.count += 1;
    rateMap.set(rateKey, entry);
  } else {
    rateMap.set(rateKey, { count: 1, timestamp: now });
  }

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
    // Use the coupon service to validate and apply the coupon
    const result = await validateCouponForCart(couponCode, cartSubtotal, user?.id ?? null);

    if (result.valid) {
      // Revalidate cart path if coupon application modifies server-side cart state (it doesn't currently)
      // revalidatePath("/cart");
      return {
        success: true,
        message: `Coupon "${couponCode}" applied successfully!`,
        discount: result.discount !== undefined ? parseFloat(result.discount.toFixed(2)) : 0,
        couponCode,
      };
    } else {
      return {
        success: false,
        message: result.reason || "Failed to apply coupon.",
        error: "Invalid coupon code or conditions not met."
      };
    }

  } catch (error: any) {
    console.error("Unexpected error applying coupon:", error);
    return {
      success: false,
      message: "An unexpected error occurred.",
      error: error?.message || "Failed to apply coupon."
    };
  }
}