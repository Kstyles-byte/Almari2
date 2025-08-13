import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

type NotificationType = Database['public']['Enums']['NotificationType'];
type NotificationChannel = Database['public']['Enums']['NotificationChannel'];

async function createSupabaseServerClient() {
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

async function createSupabaseServiceClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

// GET - Fetch user notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to fetch preferences (bypassing RLS for this specific case)
    const supabaseService = await createSupabaseServiceClient();
    const { data: preferences, error } = await supabaseService
      .from('NotificationPreference')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: preferences || [] });
  } catch (error) {
    console.error('GET /api/notification-preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update notification preference
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, channel, enabled } = body;

    // Validate input
    if (!type || !channel || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Use service client to upsert preference (bypassing RLS)
    const supabaseService = await createSupabaseServiceClient();
    const { error } = await supabaseService
      .from('NotificationPreference')
      .upsert({
        user_id: user.id,
        type: type as NotificationType,
        channel: channel as NotificationChannel,
        enabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,type,channel'
      });

    if (error) {
      console.error('Error updating preference:', error);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/notification-preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Bulk update preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Use service client to bulk upsert preferences
    const supabaseService = await createSupabaseServiceClient();
    const preferencesToUpsert = preferences.map((pref: any) => ({
      user_id: user.id,
      type: pref.type as NotificationType,
      channel: pref.channel as NotificationChannel,
      enabled: pref.enabled,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseService
      .from('NotificationPreference')
      .upsert(preferencesToUpsert, {
        onConflict: 'user_id,type,channel'
      });

    if (error) {
      console.error('Error bulk updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/notification-preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
