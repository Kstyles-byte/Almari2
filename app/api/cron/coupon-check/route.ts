import { NextRequest, NextResponse } from 'next/server';
import { 
  runCouponCheck,
  checkAndSendExpiryWarnings,
  checkAndSendUsageThresholdAlerts
} from '@/lib/notifications/couponNotifications';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create Supabase SSR client for authentication
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Cron job to check coupon expiry and usage thresholds
 * This should be called periodically (e.g., daily) by a cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Coupon Cron] Starting coupon check job');

    // Run comprehensive coupon check
    const result = await runCouponCheck();

    if (result.success) {
      console.log(`[Coupon Cron] Coupon check completed successfully. Total alerts sent: ${result.totalAlerts}`);
      return NextResponse.json({
        success: true,
        message: 'Coupon check completed successfully',
        alertsSent: result.totalAlerts
      });
    } else {
      console.error(`[Coupon Cron] Coupon check failed: ${result.error}`);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Coupon Cron] Error in coupon check cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for coupon checks (for testing)
 * POST with specific check type
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin session
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'all';

    console.log(`[Coupon Cron] Manual coupon check triggered by admin ${user.id}, type: ${checkType}`);

    let result;
    switch (checkType) {
      case 'expiry':
        result = await checkAndSendExpiryWarnings();
        break;
      case 'usage':
        result = await checkAndSendUsageThresholdAlerts();
        break;
      case 'all':
      default:
        result = await runCouponCheck();
        break;
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Coupon ${checkType} check completed successfully`,
        alertsSent: result.totalAlerts || result.warningsSent || result.alertsSent || 0
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Coupon Cron] Error in manual coupon check:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
