// Overhaul: migrate from Prisma & NextAuth to Supabase MCP for all user management actions
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  createSupabaseServerActionClient,
  getActionSession,
} from '@/lib/supabase/action';

// ---------------------------
// Validation Schemas
// ---------------------------
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'VENDOR', 'CUSTOMER', 'AGENT']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'VENDOR', 'CUSTOMER', 'AGENT']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ---------------------------
// Helpers
// ---------------------------
async function checkAdminPermission() {
  const session = await getActionSession();

  if (!session) {
    throw new Error('Unauthorized – No active session');
  }

  const supabase = await createSupabaseServerActionClient(false);
  const { data: roleData, error: roleError } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (roleError) throw new Error(`Role check error: ${roleError.message}`);
  if (!roleData || roleData.role !== 'ADMIN') {
    throw new Error('Unauthorized – Admin access required');
  }

  return session.user;
}

// ---------------------------
// Actions
// ---------------------------
export async function createUser(data: CreateUserInput) {
  await checkAdminPermission();

  // Validate input
  const validatedData = createUserSchema.parse(data);

  const supabase = await createSupabaseServerActionClient();

  // 1. Create auth user via Admin API
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: validatedData.email,
    password: validatedData.password,
    email_confirm: true,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const newUserId = authUser.user?.id;
  if (!newUserId) {
    return { success: false, error: 'Failed to create auth user' };
  }

  // 2. Insert into public."User" profile table
  const { error: insertError } = await supabase.from('User').insert({
    id: newUserId,
    name: validatedData.name,
    email: validatedData.email,
    role: validatedData.role,
  });

  if (insertError) {
    // Rollback auth user creation to avoid orphaned record
    await supabase.auth.admin.deleteUser(newUserId);
    return { success: false, error: insertError.message };
  }

  revalidatePath('/admin/users');
  return { success: true, userId: newUserId };
}

export async function updateUser(data: UpdateUserInput) {
  await checkAdminPermission();
  const validatedData = updateUserSchema.parse(data);

  const supabase = await createSupabaseServerActionClient();

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('User')
    .select('id, email')
    .eq('id', validatedData.id)
    .single();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!existingUser) return { success: false, error: 'User not found' };

  // If email update: ensure not duplicate
  if (
    validatedData.email &&
    validatedData.email !== existingUser.email
  ) {
    const { count, error: emailError } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('email', validatedData.email);

    if (emailError) return { success: false, error: emailError.message };
    if (count && count > 0) {
      return { success: false, error: 'A user with this email already exists' };
    }
  }

  const { error: updateError, data: updatedUser } = await supabase
    .from('User')
    .update({
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
    })
    .eq('id', validatedData.id)
    .select()
    .single();

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/admin/users');

  return { success: true, user: updatedUser };
}

export async function deleteUser(userId: string) {
  await checkAdminPermission();
  const supabase = await createSupabaseServerActionClient();

  // Delete from auth
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
    userId
  );
  if (authDeleteError)
    return { success: false, error: authDeleteError.message };

  // Delete profile row (RLS bypass via service role)
  const { error: deleteError } = await supabase
    .from('User')
    .delete()
    .eq('id', userId);

  if (deleteError) return { success: false, error: deleteError.message };

  revalidatePath('/admin/users');
  return { success: true };
}

export async function getUsers({
  page = 1,
  limit = 10,
  search = '',
  role = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  await checkAdminPermission();
  const supabase = await createSupabaseServerActionClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('User')
    .select(
      'id, name, email, role, created_at',
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);

  if (search) {
    query = query.ilike('name', `%${search}%`).ilike('email', `%${search}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data: users, error, count } = await query;

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    users: users ?? [],
    pagination: {
      totalItems: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
} 