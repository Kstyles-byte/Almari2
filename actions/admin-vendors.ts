'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createSupabaseServerActionClient,
  getActionSession,
} from '@/lib/supabase/action';

// ----------------------------------
// Vendor Types & Validation
// ----------------------------------
export const VendorStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export async function checkAdminPermission() {
  const session = await getActionSession();
  if (!session) throw new Error('Unauthorized – No session');
  const supabase = await createSupabaseServerActionClient(false);
  const { data, error } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (error) throw new Error(error.message);
  if (!data || data.role !== 'ADMIN') throw new Error('Admin access required');
  return session.user;
}

// ----------------------------------
// Fetch Vendors with pagination & optional filters
// ----------------------------------
export async function getVendors({
  page = 1,
  limit = 10,
  search = '',
  approvedFilter = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  approvedFilter?: 'approved' | 'pending' | '';
}) {
  await checkAdminPermission();
  const supabase = await createSupabaseServerActionClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('Vendor')
    .select('id, store_name, is_approved, created_at, User(email,name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (approvedFilter === 'approved') query = query.eq('is_approved', true);
  if (approvedFilter === 'pending') query = query.eq('is_approved', false);

  if (search) {
    // ilike on store_name or user email
    query = query.or(
      `store_name.ilike.%${search}%,User.email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return { success: false, error: error.message };

  return {
    success: true,
    vendors: data || [],
    pagination: {
      totalItems: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

// ----------------------------------
// Approve Vendor
// ----------------------------------
export async function approveVendor(vendorId: string) {
  await checkAdminPermission();
  const supabase = await createSupabaseServerActionClient();

  // Update Vendor row
  const { error } = await supabase
    .from('Vendor')
    .update({ is_approved: true })
    .eq('id', vendorId);
  if (error) return { success: false, error: error.message };

  // Update corresponding User role to VENDOR (if not already)
  const { error: roleErr } = await supabase
    .rpc('admin_set_user_role', { p_vendor_id: vendorId }); // Assuming helper function, fallback later
  if (roleErr) console.error('role update', roleErr.message);

  revalidatePath('/admin/vendors');
  return { success: true };
}

// ----------------------------------
// Reject Vendor (delete or mark rejected)
// ----------------------------------
export async function rejectVendor(vendorId: string) {
  await checkAdminPermission();
  const supabase = await createSupabaseServerActionClient();

  const { error } = await supabase
    .from('Vendor')
    .update({ is_approved: false })
    .eq('id', vendorId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/vendors');
  return { success: true };
} 