import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { savePushSubscription, removePushSubscription } from '../../../lib/services/pushNotificationBackend';

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

async function getAuthenticatedUser() {
  const supabase = await createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('[Push Subscriptions API] Authentication error:', error?.message);
    return null;
  }
  
  return user;
}

/**
 * POST /api/push-subscriptions
 * Save a push notification subscription
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.subscription || !body.subscription.endpoint || !body.subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Convert browser PushSubscription to our format
    const subscription = {
      endpoint: body.subscription.endpoint,
      getKey: (name: string) => {
        if (name === 'p256dh') {
          return new Uint8Array(Buffer.from(body.subscription.keys.p256dh, 'base64'));
        }
        if (name === 'auth') {
          return new Uint8Array(Buffer.from(body.subscription.keys.auth, 'base64'));
        }
        return null;
      }
    } as PushSubscription;

    const result = await savePushSubscription(
      user.id, 
      subscription,
      request.headers.get('user-agent') || undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Push Subscriptions API] Error saving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push-subscriptions
 * Remove a push notification subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    const result = await removePushSubscription(user.id, body.endpoint);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Push Subscriptions API] Error removing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push-subscriptions
 * Get user's push subscriptions (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createSupabaseClient();
    
    const { data: subscriptions, error } = await supabase
      .from('PushSubscription')
      .select('id, endpoint, created_at, last_used_at, is_active')
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriptions });
    
  } catch (error) {
    console.error('[Push Subscriptions API] Error getting subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    );
  }
}
