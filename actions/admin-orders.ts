"use server";

import { z } from 'zod';
import { createSupabaseServerActionClient, getActionSession } from '@/lib/supabase/action';
import type { Database } from '@/types/supabase';

// ---------------------------
// Helper to ensure only admins can access admin actions
// ---------------------------
async function checkAdminPermission() {
  const session = await getActionSession();

  if (!session?.user) {
    throw new Error('Unauthorized – No active session');
  }

  // NOTE: We use service-role key in createSupabaseServerActionClient which bypasses RLS, but
  // we still perform an explicit role check to avoid accidental privilege escalation.
  const supabase = await createSupabaseServerActionClient(false);
  const { data: roleRow, error } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) throw new Error(`Failed to fetch user role: ${error.message}`);
  if (!roleRow || roleRow.role !== 'ADMIN') {
    throw new Error('Unauthorized – Admin access required');
  }

  return session.user;
}

// ---------------------------
// Zod Schemas
// ---------------------------
const updateStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum([
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'READY_FOR_PICKUP',
  ] as const),
});

type OrderStatus = Database['public']['Enums']['OrderStatus'];

// ---------------------------
// Actions
// ---------------------------
export async function getOrders({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  paymentStatus = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
}) {
  await checkAdminPermission();
  const supabase = await createSupabaseServerActionClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('Order')
    .select(
      'id, total_amount, status, payment_status, created_at, customer_id',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }

  if (paymentStatus) {
    query = query.eq('payment_status', paymentStatus);
  }

  if (search) {
    // Simple search by order ID or customer ID (extend as needed)
    query = query.or(`id.ilike.%${search}%,customer_id.ilike.%${search}%`);
  }

  const { data: orders, error, count } = await query;

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    orders: orders ?? [],
    pagination: {
      totalItems: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await checkAdminPermission();
  const parsed = updateStatusSchema.safeParse({ orderId, status });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerActionClient();
  const { data, error } = await supabase
    .from('Order')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, order: data };
} 