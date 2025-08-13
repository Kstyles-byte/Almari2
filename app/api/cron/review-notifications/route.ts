import { NextRequest, NextResponse } from "next/server";
import { runReviewNotificationChecks } from "../../../../lib/notifications/reviewNotifications";

export async function GET(req: NextRequest) {
  try {
    // Verify the request is from a trusted source (Vercel Cron or authorized service)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[Review Cron] Starting review notification checks...');
    
    const result = await runReviewNotificationChecks();
    
    if (!result.success) {
      console.error('[Review Cron] Review notification checks failed:', result.error);
      return NextResponse.json(
        { 
          error: "Review notification checks failed", 
          details: result.error 
        },
        { status: 500 }
      );
    }

    console.log(`[Review Cron] Review notification checks completed successfully. Total notifications sent: ${result.totalNotifications || 0}`);
    
    return NextResponse.json({
      success: true,
      message: "Review notification checks completed successfully",
      totalNotifications: result.totalNotifications || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Review Cron] Unexpected error in review notification checks:', error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Allow POST requests as well for manual triggers
  return GET(req);
}
