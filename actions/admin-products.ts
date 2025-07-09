'use server';

import { revalidatePath } from 'next/cache';
import {
  createSupabaseServerActionClient,
  getActionSession,
} from '@/lib/supabase/action';
import { z } from 'zod';

async function checkAdmin() {
  const session = await getActionSession();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createSupabaseServerActionClient(false);
  const { data, error } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (error) throw new Error(error.message);
  if (!data || data.role !== 'ADMIN') throw new Error('Admin role required');
  return supabase;
}

export async function getProducts({
  page = 1,
  limit = 10,
  search = '',
  publishedFilter = '', // 'published' | 'unpublished' | ''
}: {
  page?: number;
  limit?: number;
  search?: string;
  publishedFilter?: string;
}) {
  // First, verify admin permissions (throws if unauthorized)
  await checkAdmin();

  // Use a fresh Supabase client for the actual data query (mirrors pattern used in admin-users)
  const supabase = await createSupabaseServerActionClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('Product')
    .select('id,name,is_published,created_at,vendor_id', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (publishedFilter === 'published') query = query.eq('is_published', true);
  if (publishedFilter === 'unpublished') query = query.eq('is_published', false);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return { success: false, error: error.message };

  return {
    success: true,
    products: data || [],
    pagination: {
      totalItems: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

export async function togglePublish(productId: string, publish: boolean) {
  await checkAdmin();
  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase
    .from('Product')
    .update({ is_published: publish })
    .eq('id', productId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/products');
  return { success: true };
}

// Featured flag no longer exists in schema – function deprecated 