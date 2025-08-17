import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendPushNotification } from '../../../lib/services/pushNotificationBackend';

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

async function getAuthenticatedUser() {
  const supabase = await createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('[Test Push API] Authentication error:', error?.message);
    return null;
  }
  
  return user;
}

/**
 * POST /api/test-push
 * Send a test push notification to the current user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Test Push API] Sending test push notification to user: ${user.id}`);

    const result = await sendPushNotification(user.id, {
      title: '🎉 Test Push Notification',
      body: 'Your push notifications are working perfectly! This is a test from Almari.',
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      tag: 'test-notification',
      data: {
        type: 'ORDER_STATUS_CHANGE',
        url: '/notifications',
        notificationId: 'test-' + Date.now()
      },
      actions: [
        { action: 'view', title: 'View Notifications', icon: '/icons/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: false
    });

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to send test push notification',
        details: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test push notification sent to ${result.sent} device(s)`,
      sent: result.sent
    });
    
  } catch (error) {
    console.error('[Test Push API] Error sending test push:', error);
    return NextResponse.json(
      { error: 'Failed to send test push notification' },
      { status: 500 }
    );
  }
}
