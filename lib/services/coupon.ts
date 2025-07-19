import { createClient } from '@supabase/supabase-js';
import type { Tables } from '@/types/supabase';

// Local alias for Coupon type generated from Supabase
export type Coupon = Tables<'Coupon'>;

// Initialize Supabase admin client (service-role). NOTE: RLS is enforced for
// regular clients, but service-role is required for public coupon lookups that
// may occur before the user is authenticated.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Fetch a coupon row by its (case-insensitive) code.
 * This method uses a functional index on lower(code) if present. The index is
 * optional and should be created in the database for best performance.
 */
export async function getCouponByCode(code: string) {
  const { data, error } = await supabaseAdmin
    .from('Coupon')
    .select('*')
    .ilike('code', code)
    .maybeSingle();
  if (error) throw error;
  return data as Coupon | null;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  discount?: number;
  coupon?: Coupon;
}

/**
 * Validate whether the given coupon can be applied to a cart/order worth the
 * supplied subtotal. If the coupon is valid, returns { valid: true, discount }.
 *
 * This helper does NOT increment the usage count – that should only happen once
 * the order is successfully created & paid.
 */
export async function validateCouponForCart(
  code: string,
  cartSubtotal: number,
  userId?: string | null,
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, reason: 'Coupon not found' };
  }

  if (!coupon.is_active) {
    return { valid: false, reason: 'Coupon is not active', coupon };
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { valid: false, reason: 'Coupon has expired', coupon };
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, reason: 'Coupon usage limit reached', coupon };
  }

  const minPurchase = coupon.min_purchase_amount ?? 0;
  if (cartSubtotal < minPurchase) {
    return { valid: false, reason: `Minimum purchase of ₦${minPurchase.toFixed(2)} required`, coupon };
  }

  // Guard: single-use-per-user – ensure the current user (if provided) has not
  // already redeemed this coupon in a previous order.  We check the Order
  // table against the `coupon_id` column.  If your schema stores redemptions
  // elsewhere, update this query accordingly.
  if (userId) {
    const { data: existingRedeemErr } = await supabaseAdmin
      .from('Order')
      .select('id')
      .eq('customer_id', userId)
      .eq('coupon_id', coupon.id)
      .maybeSingle();

    if (existingRedeemErr) {
      return {
        valid: false,
        reason: 'You have already used this coupon',
        coupon,
      };
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === 'PERCENTAGE') {
    discount = (Number(coupon.discount_value) / 100) * cartSubtotal;
  } else if (coupon.discount_type === 'FIXED_AMOUNT') {
    discount = Number(coupon.discount_value);
  }
  discount = Math.min(discount, cartSubtotal);

  return { valid: true, discount, coupon };
}

/**
 * Increment the `usage_count` of a coupon atomically. Ideally this is handled
 * via a Postgres trigger (see TASKS.md). This helper exists as a fall-back in
 * case the trigger is not yet deployed.
 */
export async function incrementCouponUsage(couponId: string) {
  const { error } = await supabaseAdmin.rpc('increment_coupon_usage', { p_coupon_id: couponId });
  if (error) {
    // Fallback: try simple update (non-atomic). This should be replaced once
    // the RPC is available.
    console.warn('[incrementCouponUsage] RPC failed – falling back to direct update:', error.message);
    const { error: updateErr } = await supabaseAdmin
      .from('Coupon')
      .update({ usage_count: (supabaseAdmin as any).sql`usage_count + 1` })
      .eq('id', couponId);
    if (updateErr) throw updateErr;
  }
} 