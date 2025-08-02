"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { auth } from '../auth';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key missing in environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getPayoutRequests(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    const { data, error } = await supabase
      .from('Payout')
      .select(`
        *,
        Vendor (
          store_name,
          User (
            name,
            email
          )
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payout requests:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getPayoutRequests:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function approvePayout(id: string, approvedAmount?: number): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    // Get the payout request to determine approved amount
    const { data: payout } = await supabase
      .from('Payout')
      .select('request_amount, amount')
      .eq('id', id)
      .single();

    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    const finalApprovedAmount = approvedAmount || payout.request_amount || payout.amount;

    const { error } = await supabase
      .from('Payout')
      .update({
        status: 'COMPLETED',
        approved_amount: finalApprovedAmount,
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        amount: finalApprovedAmount // Update the final amount
      })
      .eq('id', id);

    if (error) {
      console.error('Error approving payout:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/payouts');
    return { success: true };
  } catch (error) {
    console.error('Error in approvePayout:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function rejectPayout(id: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    const { error } = await supabase
      .from('Payout')
      .update({
        status: 'FAILED',
        rejection_reason: reason || 'Rejected by admin',
        approved_by: session.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error rejecting payout:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/payouts');
    return { success: true };
  } catch (error) {
    console.error('Error in rejectPayout:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
