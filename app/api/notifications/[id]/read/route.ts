import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { markNotificationAsRead } from '../../../../../lib/services/notificationService';

/**
 * Create a Supabase client for user session management
 */
async function createSupabaseServerClient() {
  try {
    const cookieStore = await cookies();
    
    return createServerClient(
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
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
  } catch (error) {
    console.error("[Notifications Read API] Error creating Supabase client:", error);
    throw error;
  }
}

/**
 * Get the authenticated user from Supabase
 */
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("[Notifications Read API] Auth error:", error.message);
    return null;
  }
  
  return user;
}

/**
 * API handler for marking a specific notification as read
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notificationId = params.id;
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }
    
    // Validate that the notification belongs to the authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: notification, error: fetchError } = await supabase
      .from('Notification')
      .select('id, user_id, is_read')
      .eq('id', notificationId)
      .single();
    
    if (fetchError) {
      console.error('[Notifications Read API] Error fetching notification:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 });
    }
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized - notification does not belong to user' }, { status: 403 });
    }
    
    // Check if already read
    if (notification.is_read) {
      return NextResponse.json({ 
        success: true, 
        message: 'Notification already marked as read',
        notification: { id: notificationId, is_read: true }
      });
    }
    
    // Mark as read using the service
    const result = await markNotificationAsRead(notificationId);
    
    if (!result.success) {
      console.error('[Notifications Read API] Error marking notification as read:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      notification: result.notification
    });
    
  } catch (error) {
    console.error('[Notifications Read API] Error processing POST request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for checking if a notification is read (GET request)
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notificationId = params.id;
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }
    
    // Get notification read status
    const supabase = await createSupabaseServerClient();
    const { data: notification, error } = await supabase
      .from('Notification')
      .select('id, is_read, created_at')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('[Notifications Read API] Error fetching notification status:', error.message);
      return NextResponse.json({ error: 'Failed to fetch notification status' }, { status: 500 });
    }
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      id: notification.id,
      is_read: notification.is_read,
      created_at: notification.created_at
    });
    
  } catch (error) {
    console.error('[Notifications Read API] Error processing GET request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for marking a notification as unread (DELETE request)
 */
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notificationId = params.id;
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }
    
    // Validate that the notification belongs to the authenticated user and mark as unread
    const supabase = await createSupabaseServerClient();
    const { data: notification, error: updateError } = await supabase
      .from('Notification')
      .update({ is_read: false })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('[Notifications Read API] Error marking notification as unread:', updateError.message);
      return NextResponse.json({ error: 'Failed to mark notification as unread' }, { status: 500 });
    }
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Notification marked as unread',
      notification: { id: notificationId, is_read: false }
    });
    
  } catch (error) {
    console.error('[Notifications Read API] Error processing DELETE request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}
