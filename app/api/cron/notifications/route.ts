import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
 * Call internal cron endpoint
 */
async function callCronEndpoint(endpoint: string, body?: any): Promise<any> {
  try {
    // Get the base URL from multiple possible sources
    const baseUrl = process.env.VERCEL_URL 
      || process.env.NEXTAUTH_URL 
      || process.env.NEXT_PUBLIC_SITE_URL
      || 'http://localhost:3000';
    
    // Ensure URL has protocol
    const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const url = `${fullBaseUrl}/api/cron/${endpoint}`;
    
    console.log(`[Notifications Cron] Calling internal endpoint: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'dev-secret',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Cron endpoint ${endpoint} failed: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Notifications Cron] Error calling ${endpoint}:`, error);
    throw error;
  }
}

/**
 * POST /api/cron/notifications
 * Master cron job that coordinates all notification-related cron jobs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Notifications Cron] Starting master notifications cron job');
    
    // Verify cron request
    if (!verifyCronRequest(request)) {
      console.error('[Notifications Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body to determine which jobs to run
    const body = await request.json().catch(() => ({}));
    const jobsToRun = body.jobs || ['inventory-check', 'product-notifications'];
    const parallel = body.parallel !== false; // Default to parallel execution

    console.log(`[Notifications Cron] Running jobs: ${jobsToRun.join(', ')} (parallel: ${parallel})`);

    const results: Record<string, any> = {};
    const errors: string[] = [];
    let totalNotificationsSent = 0;

    if (parallel) {
      // Run jobs in parallel
      const jobPromises = jobsToRun.map(async (job: string) => {
        try {
          console.log(`[Notifications Cron] Starting ${job}...`);
          const result = await callCronEndpoint(job, body[job] || {});
          results[job] = result;
          
          // Count notifications sent
          if (result.totalAlerts) {
            totalNotificationsSent += result.totalAlerts;
          }
          if (result.totalNotificationsSent) {
            totalNotificationsSent += result.totalNotificationsSent;
          }
          if (result.remindersSent) {
            totalNotificationsSent += result.remindersSent;
          }
          
          console.log(`[Notifications Cron] Completed ${job} successfully`);
        } catch (error) {
          const errorMessage = `Job ${job} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[Notifications Cron] ${errorMessage}`);
          errors.push(errorMessage);
          results[job] = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      await Promise.all(jobPromises);
    } else {
      // Run jobs sequentially
      for (const job of jobsToRun) {
        try {
          console.log(`[Notifications Cron] Starting ${job}...`);
          const result = await callCronEndpoint(job, body[job] || {});
          results[job] = result;
          
          // Count notifications sent
          if (result.totalAlerts) {
            totalNotificationsSent += result.totalAlerts;
          }
          if (result.totalNotificationsSent) {
            totalNotificationsSent += result.totalNotificationsSent;
          }
          if (result.remindersSent) {
            totalNotificationsSent += result.remindersSent;
          }
          
          console.log(`[Notifications Cron] Completed ${job} successfully`);
        } catch (error) {
          const errorMessage = `Job ${job} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[Notifications Cron] ${errorMessage}`);
          errors.push(errorMessage);
          results[job] = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      }
    }

    const hasErrors = errors.length > 0;
    const successfulJobs = Object.values(results).filter((result: any) => result.success).length;
    
    console.log(`[Notifications Cron] Master cron completed. Successful jobs: ${successfulJobs}/${jobsToRun.length}, Total notifications: ${totalNotificationsSent}, Errors: ${errors.length}`);
    
    const responseStatus = hasErrors ? (successfulJobs > 0 ? 207 : 500) : 200;
    
    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors 
        ? `Completed with ${errors.length} errors` 
        : 'All notification jobs completed successfully',
      totalNotificationsSent,
      jobsRun: jobsToRun,
      successfulJobs,
      results,
      errors: errors.length > 0 ? errors : undefined,
      executionMode: parallel ? 'parallel' : 'sequential',
      timestamp: new Date().toISOString()
    }, { status: responseStatus });
    
  } catch (error) {
    console.error('[Notifications Cron] Error in master notifications cron job:', error);
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
 * GET /api/cron/notifications
 * Health check and configuration endpoint for the master notifications cron job
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
      endpoint: 'notifications',
      description: 'Master cron job coordinator for all notification systems',
      availableJobs: [
        {
          name: 'inventory-check',
          description: 'Monitor inventory levels and send alerts',
          features: ['Low stock alerts', 'Out of stock alerts', 'Popular product alerts']
        },
        {
          name: 'product-notifications',
          description: 'Handle wishlist and product update notifications',
          features: ['Wishlist reminders', 'Back in stock alerts', 'Price drop notifications']
        }
      ],
      defaultJobs: ['inventory-check', 'product-notifications'],
      executionModes: ['parallel', 'sequential'],
      configuration: {
        cronSecret: process.env.CRON_SECRET ? 'configured' : 'not configured',
        cronAuthToken: process.env.CRON_AUTH_TOKEN ? 'configured' : 'not configured',
        environment: process.env.NODE_ENV || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Notifications Cron] Error in health check:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
