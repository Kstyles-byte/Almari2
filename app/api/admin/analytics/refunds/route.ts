import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET /api/admin/analytics/refunds - Get comprehensive refund analytics
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { searchParams } = new URL(request.url);
    
    // Check for active session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Parse query parameters
    const period = searchParams.get('period') || '30d';
    const vendorId = searchParams.get('vendor_id');

    // Calculate date range
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    // Base query filters
    let baseQuery = supabase
      .from('RefundRequest')
      .select('*');
    
    if (vendorId && vendorId !== 'all') {
      baseQuery = baseQuery.eq('vendor_id', vendorId);
    }

    // Get current period refunds
    const { data: currentRefunds, error: currentError } = await baseQuery
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (currentError) {
      console.error('Error fetching current refunds:', currentError);
      return NextResponse.json({ error: 'Failed to fetch refund data' }, { status: 500 });
    }

    // Get previous period refunds for comparison
    const { data: previousRefunds, error: previousError } = await baseQuery
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousError) {
      console.error('Error fetching previous refunds:', previousError);
      return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
    }

    // Get all refunds with related data for detailed analysis
    const { data: allRefunds, error: allRefundsError } = await supabase
      .from('RefundRequest')
      .select(`
        *,
        customer:Customer(
          *,
          user:User(name, email)
        ),
        vendor:Vendor(
          *
        ),
        order:Order(*),
        orderItem:OrderItem(
          *,
          product:Product(name)
        ),
        return:Return(*)
      `)
      .gte('created_at', startDate.toISOString());

    if (allRefundsError) {
      console.error('Error fetching detailed refunds:', allRefundsError);
      return NextResponse.json({ error: 'Failed to fetch detailed refund data' }, { status: 500 });
    }

    // Calculate summary metrics
    const totalRefunds = currentRefunds?.length || 0;
    const totalRefundAmount = currentRefunds?.reduce((sum, refund) => sum + Number(refund.refund_amount), 0) || 0;
    const approvedRefunds = currentRefunds?.filter(r => r.status === 'APPROVED').length || 0;
    const approvalRate = totalRefunds > 0 ? (approvedRefunds / totalRefunds) * 100 : 0;

    // Calculate average processing time (in hours)
    const processedRefunds = currentRefunds?.filter(r => r.status !== 'PENDING') || [];
    const totalProcessingTime = processedRefunds.reduce((sum, refund) => {
      const created = new Date(refund.created_at || '');
      const updated = new Date(refund.updated_at || '');
      return sum + (updated.getTime() - created.getTime());
    }, 0);
    const averageProcessingTime = processedRefunds.length > 0 
      ? totalProcessingTime / (processedRefunds.length * 60 * 60 * 1000) 
      : 0;

    // Period comparison
    const previousRefundCount = previousRefunds?.length || 0;
    const changePercentage = previousRefundCount > 0 
      ? ((totalRefunds - previousRefundCount) / previousRefundCount) * 100 
      : 0;

    // Generate refund trends (daily breakdown)
    const refundTrends = [];
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRefunds = currentRefunds?.filter(refund => {
        const refundDate = new Date(refund.created_at || '').toISOString().split('T')[0];
        return refundDate === dateStr;
      }) || [];

      refundTrends.push({
        date: dateStr,
        count: dayRefunds.length,
        amount: dayRefunds.reduce((sum, refund) => sum + Number(refund.refund_amount), 0)
      });
    }

    // Calculate vendor performance
    const vendorPerformanceMap = new Map();
    
    // Get all orders for vendors to calculate refund rates
    const { data: vendorOrders, error: ordersError } = await supabase
      .from('OrderItem')
      .select(`
        vendor_id,
        id,
        Order(status, created_at)
      `)
      .gte('Order.created_at', startDate.toISOString());

    if (!ordersError && vendorOrders) {
      // Group orders by vendor
      const vendorOrderCounts = new Map();
      vendorOrders.forEach(orderItem => {
        const count = vendorOrderCounts.get(orderItem.vendor_id) || 0;
        vendorOrderCounts.set(orderItem.vendor_id, count + 1);
      });

      // Calculate vendor performance metrics
      allRefunds?.forEach(refund => {
        const vendorId = refund.vendor_id;
        if (!vendorPerformanceMap.has(vendorId)) {
          vendorPerformanceMap.set(vendorId, {
            vendor_id: vendorId,
            vendor_name: refund.vendor?.store_name || 'Unknown Vendor',
            total_orders: vendorOrderCounts.get(vendorId) || 0,
            refund_count: 0,
            refund_amount: 0,
            response_times: [],
            risk_factors: []
          });
        }

        const vendorData = vendorPerformanceMap.get(vendorId);
        vendorData.refund_count++;
        vendorData.refund_amount += Number(refund.refund_amount);

        // Calculate response time if vendor has responded
        if (refund.vendor_response && refund.updated_at) {
          const created = new Date(refund.created_at || '');
          const updated = new Date(refund.updated_at);
          const responseTime = (updated.getTime() - created.getTime()) / (60 * 60 * 1000); // hours
          vendorData.response_times.push(responseTime);
        }

        // Risk factors: frequent refunds, high refund amounts, slow responses
        if (refund.status === 'REJECTED') vendorData.risk_factors.push('frequent_rejections');
        if (Number(refund.refund_amount) > 10000) vendorData.risk_factors.push('high_value_refunds');
      });
    }

    const vendorPerformance = Array.from(vendorPerformanceMap.values()).map(vendor => {
      const refundRate = vendor.total_orders > 0 ? (vendor.refund_count / vendor.total_orders) * 100 : 0;
      const avgResponseTime = vendor.response_times.length > 0
        ? vendor.response_times.reduce((sum: number, time: number) => sum + time, 0) / vendor.response_times.length
        : 0;
      
      // Calculate risk score (0-1)
      let riskScore = 0;
      if (refundRate > 10) riskScore += 0.3;
      if (refundRate > 20) riskScore += 0.3;
      if (avgResponseTime > 48) riskScore += 0.2;
      if (vendor.risk_factors.length > 3) riskScore += 0.2;

      return {
        ...vendor,
        refund_rate: refundRate,
        avg_response_time: avgResponseTime,
        risk_score: Math.min(riskScore, 1)
      };
    });

    // Calculate refund reasons distribution
    const reasonCounts = new Map();
    currentRefunds?.forEach(refund => {
      const reason = refund.reason || 'Other';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    const refundReasons = Array.from(reasonCounts.entries()).map(([reason, count]) => ({
      reason,
      count,
      percentage: totalRefunds > 0 ? (count / totalRefunds) * 100 : 0
    }));

    // Status distribution
    const statusCounts = new Map();
    currentRefunds?.forEach(refund => {
      const status = refund.status || 'PENDING';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      amount: currentRefunds?.filter(r => r.status === status)
        .reduce((sum, refund) => sum + Number(refund.refund_amount), 0) || 0
    }));

    // Financial impact calculation (mock data - replace with actual revenue calculations)
    const grossRevenue = totalRefundAmount * 10; // Approximate based on refund amount
    const financialImpact = {
      gross_revenue: grossRevenue,
      refunded_amount: totalRefundAmount,
      net_revenue: grossRevenue - totalRefundAmount,
      refund_percentage: grossRevenue > 0 ? (totalRefundAmount / grossRevenue) * 100 : 0,
      commission_impact: totalRefundAmount * 0.05 // Assuming 5% commission
    };

    // Processing metrics
    const adminOverrides = currentRefunds?.filter(r => r.admin_notes).length || 0;
    const vendorResponses = currentRefunds?.filter(r => r.vendor_response).length || 0;
    const autoApprovals = currentRefunds?.filter(r => !r.vendor_response && !r.admin_notes && r.status === 'APPROVED').length || 0;
    
    const processingMetrics = {
      avg_admin_response_time: averageProcessingTime,
      avg_vendor_response_time: vendorPerformance.reduce((sum, v) => sum + v.avg_response_time, 0) / Math.max(vendorPerformance.length, 1),
      auto_approval_rate: totalRefunds > 0 ? (autoApprovals / totalRefunds) * 100 : 0,
      dispute_rate: totalRefunds > 0 ? (adminOverrides / totalRefunds) * 100 : 0
    };

    const analyticsData = {
      summary: {
        total_refunds: totalRefunds,
        total_refund_amount: totalRefundAmount,
        approval_rate: approvalRate,
        average_processing_time: averageProcessingTime,
        refund_trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
        period_comparison: {
          current_period: totalRefunds,
          previous_period: previousRefundCount,
          change_percentage: changePercentage
        }
      },
      refund_trends: refundTrends,
      vendor_performance: vendorPerformance,
      refund_reasons: refundReasons,
      status_distribution: statusDistribution,
      financial_impact: financialImpact,
      processing_metrics: processingMetrics
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Unexpected error in refund analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}