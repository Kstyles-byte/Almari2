import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    console.error('[Debug Push API] Authentication error:', error?.message);
    return null;
  }
  
  return user;
}

/**
 * GET /api/debug-push
 * Debug push notification setup for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseClient();
    
    // Check push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('PushSubscription')
      .select('*')
      .eq('user_id', user.id);

    // Check notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('NotificationPreference')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'PUSH');

    // Check recent notifications
    const { data: notifications, error: notifError } = await supabase
      .from('Notification')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      environment: {
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'configured' : 'missing',
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? 'configured' : 'missing'
      },
      subscriptions: {
        count: subscriptions?.length || 0,
        data: subscriptions,
        error: subError?.message
      },
      preferences: {
        count: preferences?.length || 0,
        data: preferences,
        error: prefError?.message
      },
      recentNotifications: {
        count: notifications?.length || 0,
        data: notifications?.map(n => ({
          id: n.id,
          title: n.title,
          type: n.type,
          created_at: n.created_at
        })),
        error: notifError?.message
      }
    });
    
  } catch (error) {
    console.error('[Debug Push API] Error:', error);
    return NextResponse.json(
      { error: 'Debug failed' },
      { status: 500 }
    );
  }
}

