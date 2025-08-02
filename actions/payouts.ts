"use server";

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { decodeSupabaseCookie } from '@/lib/supabase/cookie-utils';

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

async function getServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const raw = cookieStore.get(name)?.value;
          return decodeSupabaseCookie(raw);
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

interface PayoutFilters {
  status?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: 'created_at' | 'amount' | 'store_name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function getPayoutRequests(filters?: PayoutFilters): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  try {
    // Use Supabase server client to get session
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin using admin client
    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    let query = supabase
      .from('Payout')
      .select(`
        *,
        Vendor (
          store_name,
          bank_name,
          account_number,
          account_name,
          User (
            name,
            email
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'PENDING'); // Default to pending
    }

    if (filters?.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.amountMin) {
      query = query.gte('amount', filters.amountMin);
    }

    if (filters?.amountMax) {
      query = query.lte('amount', filters.amountMax);
    }

    // Apply sorting
    const sortField = filters?.sortBy || 'created_at';
    const isAscending = filters?.sortOrder === 'asc';
    
    if (sortField === 'store_name') {
      query = query.order('Vendor.store_name', { ascending: isAscending });
    } else {
      query = query.order(sortField, { ascending: isAscending });
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Use admin client for the actual query to ensure we have full access
    let adminQuery = adminClient
      .from('Payout')
      .select(`
        *,
        Vendor (
          store_name,
          bank_name,
          account_number,
          account_name,
          User (
            name,
            email
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      adminQuery = adminQuery.eq('status', filters.status);
    } else {
      adminQuery = adminQuery.eq('status', 'PENDING'); // Default to pending
    }

    if (filters?.vendorId) {
      adminQuery = adminQuery.eq('vendor_id', filters.vendorId);
    }

    if (filters?.dateFrom) {
      adminQuery = adminQuery.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      adminQuery = adminQuery.lte('created_at', filters.dateTo);
    }

    if (filters?.amountMin) {
      adminQuery = adminQuery.gte('amount', filters.amountMin);
    }

    if (filters?.amountMax) {
      adminQuery = adminQuery.lte('amount', filters.amountMax);
    }

    // Apply sorting
    if (sortField === 'store_name') {
      adminQuery = adminQuery.order('Vendor.store_name', { ascending: isAscending });
    } else {
      adminQuery = adminQuery.order(sortField, { ascending: isAscending });
    }

    // Apply pagination
    if (filters?.limit) {
      adminQuery = adminQuery.limit(filters.limit);
    }
    
    if (filters?.offset) {
      adminQuery = adminQuery.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await adminQuery;

    if (error) {
      console.error('Error fetching payout requests:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [], total: count || 0 };
  } catch (error) {
    console.error('Error in getPayoutRequests:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function approvePayout(id: string, approvedAmount?: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Supabase server client to get session
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin using admin client
    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    // Get the payout request to determine approved amount
    const { data: payout } = await adminClient
      .from('Payout')
      .select('request_amount, amount')
      .eq('id', id)
      .single();

    if (!payout) {
      return { success: false, error: 'Payout not found' };
    }

    const finalApprovedAmount = approvedAmount || payout.request_amount || payout.amount;

    const { error } = await adminClient
      .from('Payout')
      .update({
        status: 'COMPLETED',
        approved_amount: finalApprovedAmount,
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
        amount: finalApprovedAmount
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
    // Use Supabase server client to get session
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin using admin client
    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    const { error } = await adminClient
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

export async function getFinancialStats(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    // Get pending payout amount
    const { data: pendingPayouts } = await adminClient
      .from('Payout')
      .select('amount')
      .eq('status', 'PENDING');

    const pendingPayoutAmount = pendingPayouts?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;

    // Get payouts this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyPayouts } = await adminClient
      .from('Payout')
      .select('amount')
      .eq('status', 'COMPLETED')
      .gte('approved_at', startOfMonth.toISOString());

    const totalPayoutsThisMonth = monthlyPayouts?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;

    // Get total commission earned from all delivered orders
    const { data: orderItems } = await adminClient
      .from('OrderItem')
      .select('commission_amount')
      .eq('status', 'DELIVERED');

    const totalCommissionEarned = orderItems?.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0) || 0;

    // Get active vendors count
    const { data: vendors } = await adminClient
      .from('Vendor')
      .select('id')
      .eq('is_approved', true);

    const activeVendors = vendors?.length || 0;

    return {
      success: true,
      data: {
        pendingPayoutAmount,
        totalPayoutsThisMonth,
        totalCommissionEarned,
        activeVendors
      }
    };
  } catch (error) {
    console.error('Error in getFinancialStats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get vendor available balance for payouts
export async function getVendorAvailableBalance(vendorId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    // Get vendor's commission from delivered order items
    const { data: orderItems } = await adminClient
      .from('OrderItem')
      .select('price_at_purchase, quantity, commission_rate, commission_amount')
      .eq('vendor_id', vendorId)
      .eq('status', 'DELIVERED');

    if (!orderItems) {
      return { success: true, balance: 0 };
    }

    // Calculate total earnings (including commission amount if available, or calculate from price)
    let totalEarnings = 0;
    for (const item of orderItems) {
      if (item.commission_amount) {
        totalEarnings += Number(item.commission_amount);
      } else {
        // Fallback calculation if commission_amount is not set
        const itemTotal = Number(item.price_at_purchase) * Number(item.quantity);
        const commission = itemTotal * (Number(item.commission_rate) / 100);
        const vendorEarning = itemTotal - commission;
        totalEarnings += vendorEarning;
      }
    }

    // Get total payouts already made to this vendor
    const { data: completedPayouts } = await adminClient
      .from('Payout')
      .select('amount')
      .eq('vendor_id', vendorId)
      .eq('status', 'COMPLETED');

    const totalPayouts = completedPayouts?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;

    // Get pending payouts to subtract from available balance
    const { data: pendingPayouts } = await adminClient
      .from('Payout')
      .select('amount')
      .eq('vendor_id', vendorId)
      .eq('status', 'PENDING');

    const totalPendingPayouts = pendingPayouts?.reduce((sum, payout) => sum + Number(payout.amount), 0) || 0;

    const availableBalance = totalEarnings - totalPayouts - totalPendingPayouts;

    return { success: true, balance: Math.max(0, availableBalance) };
  } catch (error) {
    console.error('Error in getVendorAvailableBalance:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get payout settings
export async function getPayoutSettings(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    const { data, error } = await adminClient
      .from('PayoutSettings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching payout settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error in getPayoutSettings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update payout settings
export async function updatePayoutSettings(settings: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    // Check if settings exist
    const { data: existingSettings } = await adminClient
      .from('PayoutSettings')
      .select('id')
      .limit(1)
      .single();

    const updatedData = {
      ...settings,
      updated_at: new Date().toISOString()
    };

    let error: any;
    if (existingSettings) {
      // Update existing settings
      ({ error } = await adminClient
        .from('PayoutSettings')
        .update(updatedData)
        .eq('id', existingSettings.id));
    } else {
      // Create new settings
      ({ error } = await supabase
        .from('PayoutSettings')
        .insert(updatedData));
    }

    if (error) {
      console.error('Error updating payout settings:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/payouts');
    return { success: true };
  } catch (error) {
    console.error('Error in updatePayoutSettings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Bulk approve payouts
export async function bulkApprovePayout(payoutIds: string[]): Promise<{ success: boolean; results?: any[]; error?: string }> {
  try {
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    const results = [];
    for (const payoutId of payoutIds) {
      const result = await approvePayout(payoutId);
      results.push({ payoutId, ...result });
    }

    revalidatePath('/admin/payouts');
    return { success: true, results };
  } catch (error) {
    console.error('Error in bulkApprovePayout:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get payout history with detailed information
export async function getPayoutHistory(filters?: PayoutFilters): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  const modifiedFilters = { 
    ...filters, 
    status: undefined // Remove status filter to get all statuses
  };
  return getPayoutRequests(modifiedFilters);
}

// Generate payout report
export async function generatePayoutReport(startDate: string, endDate: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { success: false, error: 'Unauthorized' };
    }
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'ADMIN') {
      return { success: false, error: 'Access denied' };
    }

    // Get payouts within date range
    const { data: payouts } = await adminClient
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
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (!payouts) {
      return { success: true, data: { payouts: [], summary: {} } };
    }

    // Calculate summary statistics
    const summary = {
      totalPayouts: payouts.length,
      completedPayouts: payouts.filter((p: any) => p.status === 'COMPLETED').length,
      pendingPayouts: payouts.filter((p: any) => p.status === 'PENDING').length,
      failedPayouts: payouts.filter((p: any) => p.status === 'FAILED').length,
      totalAmount: payouts.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      completedAmount: payouts.filter((p: any) => p.status === 'COMPLETED').reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      pendingAmount: payouts.filter((p: any) => p.status === 'PENDING').reduce((sum: number, p: any) => sum + Number(p.amount), 0),
    };

    return {
      success: true,
      data: {
        payouts,
        summary,
        dateRange: { startDate, endDate }
      }
    };
  } catch (error) {
    console.error('Error in generatePayoutReport:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
