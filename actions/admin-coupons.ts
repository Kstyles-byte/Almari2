"use server";

import { createSupabaseServerActionClient } from '@/lib/supabase/action';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { Tables } from '@/types/supabase';

export type Coupon = Tables<'Coupon'>;

const CouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().optional(),
  discount_type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discount_value: z.number().positive(),
  starts_at: z.string().optional(),
  expiry_date: z.string().optional(),
  usage_limit: z.number().int().positive().nullable(),
  min_purchase_amount: z.number().nonnegative().nullable(),
  vendor_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export async function createCoupon(data: unknown, skipAuth = false) {
  const supabase = await createSupabaseServerActionClient();
  if (!skipAuth) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
  }

  const payload = CouponSchema.safeParse(data);
  if (!payload.success) return { success: false, error: 'Invalid payload', fieldErrors: payload.error.flatten() };

  const insert = { id: randomUUID(), ...payload.data } as Partial<Coupon>;
  const { error } = await supabase.from('Coupon').insert(insert);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleCoupon(id: string, active: boolean) {
  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from('Coupon').update({ is_active: active }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listCoupons() {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Admin-only for now – enhance with vendor filter when needed
  const { data, error } = await supabase.from('Coupon').select('*').order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, coupons: data };
}

export async function deleteCoupon(id: string) {
  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from('Coupon').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
} 