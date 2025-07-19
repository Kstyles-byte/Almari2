"use server";

import { createSupabaseServerActionClient } from '@/lib/supabase/action';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tables } from '@/types/supabase';

export type Coupon = Tables<'Coupon'>;

const VendorCouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().optional(),
  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discount_value: z.number().positive(),
  starts_at: z.string().optional(),
  expiry_date: z.string().optional(),
  usage_limit: z.number().int().positive().nullable(),
  min_purchase_amount: z.number().nonnegative().nullable(),
  is_active: z.boolean().default(true),
  // If set, coupon applies only to a specific product owned by the vendor
  product_id: z.string().uuid().nullable().optional(),
});

async function getVendorId(userId: string, supabase: any) {
  const { data, error } = await supabase.from('Vendor').select('id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function createVendorCoupon(data: unknown) {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const vendorId = await getVendorId(user.id, supabase);
  if (!vendorId) return { success: false, error: 'Vendor profile not found' };

  const payload = VendorCouponSchema.safeParse(data);
  if (!payload.success) return { success: false, error: 'Invalid payload', fieldErrors: payload.error.flatten() };

  // If a product_id is provided, ensure the product belongs to the vendor
  if (payload.success && payload.data.product_id) {
    const { data: productCheck, error: productErr } = await supabase
      .from('Product')
      .select('id')
      .eq('id', payload.data.product_id)
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (productErr) return { success: false, error: productErr.message };
    if (!productCheck) return { success: false, error: 'Selected product not found for this vendor' };
  }

  const insert = { id: randomUUID(), vendor_id: vendorId, ...payload.data } as Partial<Coupon>;
  const { error } = await supabase.from('Coupon').insert(insert);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listVendorCoupons() {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const vendorId = await getVendorId(user.id, supabase);
  if (!vendorId) return { success: false, error: 'Vendor profile not found' };
  const { data, error } = await supabase.from('Coupon').select('*, product:Product(id,name)').eq('vendor_id', vendorId);
  if (error) return { success: false, error: error.message };
  return { success: true, coupons: data };
} 