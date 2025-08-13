import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { runInventoryCheck } from '@/lib/notifications/inventoryNotifications';

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
 * POST /api/cron/inventory-check
 * Automated inventory checking cron job endpoint
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Inventory Cron] Starting inventory check cron job');
    
    // Verify cron request
    if (!verifyCronRequest(request)) {
      console.error('[Inventory Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user session exists for RLS
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[Inventory Cron] No user session for RLS, proceeding with service role');
    }

    // Run comprehensive inventory check
    const result = await runInventoryCheck();
    
    if (!result.success) {
      console.error('[Inventory Cron] Inventory check failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Inventory check failed',
          details: result.error
        },
        { status: 500 }
      );
    }
    
    console.log(`[Inventory Cron] Inventory check completed successfully. Total alerts sent: ${result.totalAlerts}`);
    
    return NextResponse.json({
      success: true,
      message: 'Inventory check completed successfully',
      totalAlerts: result.totalAlerts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Inventory Cron] Error in inventory check cron job:', error);
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
 * GET /api/cron/inventory-check
 * Health check endpoint for the inventory cron job
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
      endpoint: 'inventory-check',
      description: 'Automated inventory monitoring and notification system',
      features: [
        'Low stock alerts',
        'Out of stock alerts', 
        'Popular product alerts',
        'Inventory update notifications'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Inventory Cron] Error in health check:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
