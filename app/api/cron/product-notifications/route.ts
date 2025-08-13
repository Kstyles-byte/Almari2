import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  sendWeeklyWishlistReminders,
  checkWishlistedProductUpdates 
} from '@/lib/notifications/productNotifications';

/**
 * Create Supabase SSR client for cron jobs
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
 * Verify cron request authenticity
 */
function verifyCronRequest(request: NextRequest): boolean {
  // Check for cron secret or authorization header
  const cronSecret = request.headers.get('x-cron-secret');
  const authHeader = request.headers.get('authorization');
  
  const validSecret = process.env.CRON_SECRET;
  const validAuth = process.env.CRON_AUTH_TOKEN;
  
  if (validSecret && cronSecret === validSecret) {
    return true;
  }
  
  if (validAuth && authHeader === `Bearer ${validAuth}`) {
    return true;
  }
  
  // For development, allow requests from localhost
  if (process.env.NODE_ENV === 'development') {
    const userAgent = request.headers.get('user-agent');
    if (userAgent?.includes('localhost') || userAgent?.includes('127.0.0.1')) {
      return true;
    }
  }
  
  return false;
}

/**
 * POST /api/cron/product-notifications
 * Automated product notifications cron job endpoint
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Product Notifications Cron] Starting product notifications cron job');
    
    // Verify cron request
    if (!verifyCronRequest(request)) {
      console.error('[Product Notifications Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user session exists for RLS
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[Product Notifications Cron] No user session for RLS, proceeding with service role');
    }

    // Parse request body to determine job type
    const body = await request.json().catch(() => ({}));
    const jobType = body.type || 'all';

    let totalNotificationsSent = 0;
    const results: any = {};

    // Run different types of product notification checks
    if (jobType === 'all' || jobType === 'wishlist-reminders') {
      console.log('[Product Notifications Cron] Running wishlist reminders...');
      const wishlistResult = await sendWeeklyWishlistReminders();
      results.wishlistReminders = wishlistResult;
      if (wishlistResult.success && wishlistResult.remindersSent) {
        totalNotificationsSent += wishlistResult.remindersSent;
      }
    }

    if (jobType === 'all' || jobType === 'product-updates') {
      console.log('[Product Notifications Cron] Checking wishlist product updates...');
      const productUpdatesResult = await checkWishlistedProductUpdates();
      results.productUpdates = productUpdatesResult;
      if (productUpdatesResult.success && productUpdatesResult.notificationsSent) {
        totalNotificationsSent += productUpdatesResult.notificationsSent;
      }
    }

    // Check if any job failed
    const anyFailed = Object.values(results).some((result: any) => !result.success);
    
    if (anyFailed) {
      console.error('[Product Notifications Cron] Some product notification jobs failed:', results);
      return NextResponse.json(
        { 
          error: 'Some product notification jobs failed',
          results,
          totalNotificationsSent
        },
        { status: 207 } // Multi-status
      );
    }
    
    console.log(`[Product Notifications Cron] Product notifications cron completed successfully. Total notifications sent: ${totalNotificationsSent}`);
    
    return NextResponse.json({
      success: true,
      message: 'Product notifications cron completed successfully',
      totalNotificationsSent,
      jobType,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Product Notifications Cron] Error in product notifications cron job:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/product-notifications
 * Health check endpoint for the product notifications cron job
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron request
    if (!verifyCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      endpoint: 'product-notifications',
      description: 'Automated product and wishlist notification system',
      features: [
        'Weekly wishlist reminders',
        'Back in stock alerts',
        'Price drop notifications',
        'Product update monitoring'
      ],
      supportedJobTypes: [
        'all',
        'wishlist-reminders',
        'product-updates'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Product Notifications Cron] Error in health check:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
