import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { markAllNotificationsAsRead, getUnreadNotificationCount } from '../../../../lib/services/notificationService';

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
    console.error("[Mark All Read API] Error creating Supabase client:", error);
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
    console.error("[Mark All Read API] Auth error:", error.message);
    return null;
  }
  
  return user;
}

/**
 * API handler for marking all notifications as read for a user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse optional request body for filtering
    let filterType: string | null = null;
    let maxAge: number | null = null;
    
    try {
      const body = await request.json();
      filterType = body.type || null;
      maxAge = body.maxAge || null; // Maximum age in days
    } catch (error) {
      // Body is optional, ignore parsing errors
    }
    
    // Get current unread count before marking as read
    const beforeCount = await getUnreadNotificationCount(user.id);
    const initialUnreadCount = beforeCount.success ? (beforeCount.count || 0) : 0;
    
    if (initialUnreadCount === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No unread notifications to mark as read',
        markedCount: 0,
        totalUnread: 0
      });
    }
    
    // Create supabase client for custom queries with filtering
    const supabase = await createSupabaseServerClient();
    
    // If filtering is required, use custom query
    if (filterType || maxAge) {
      let query = supabase
        .from('Notification')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      // Apply type filter
      if (filterType) {
        query = query.eq('type', filterType);
      }
      
      // Apply age filter (only mark notifications older than X days as read)
      if (maxAge) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAge);
        query = query.lte('created_at', cutoffDate.toISOString());
      }
      
      const { data, error } = await query.select('id');
      
      if (error) {
        console.error('[Mark All Read API] Error marking filtered notifications as read:', error.message);
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
      }
      
      const markedCount = data?.length || 0;
      
      return NextResponse.json({ 
        success: true,
        message: `Marked ${markedCount} notifications as read`,
        markedCount,
        filtered: true,
        filterType,
        maxAge
      });
    }
    
    // Use service for marking all notifications as read (no filtering)
    const result = await markAllNotificationsAsRead(user.id);
    
    if (!result.success) {
      console.error('[Mark All Read API] Error marking all notifications as read:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    // Get updated unread count
    const afterCount = await getUnreadNotificationCount(user.id);
    const finalUnreadCount = afterCount.success ? (afterCount.count || 0) : 0;
    
    return NextResponse.json({ 
      success: true,
      message: 'All notifications marked as read',
      markedCount: initialUnreadCount,
      totalUnreadBefore: initialUnreadCount,
      totalUnreadAfter: finalUnreadCount
    });
    
  } catch (error) {
    console.error('[Mark All Read API] Error processing POST request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for getting count of unread notifications (GET request)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const maxAge = searchParams.get('maxAge');
    
    // Get unread count with potential filtering
    if (type || maxAge) {
      const supabase = await createSupabaseServerClient();
      
      let query = supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }
      
      if (maxAge) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(maxAge, 10));
        query = query.lte('created_at', cutoffDate.toISOString());
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('[Mark All Read API] Error getting filtered unread count:', error.message);
        return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        count: count || 0,
        filtered: true,
        filterType: type,
        maxAge: maxAge ? parseInt(maxAge, 10) : null
      });
    }
    
    // Get total unread count using service
    const result = await getUnreadNotificationCount(user.id);
    
    if (!result.success) {
      console.error('[Mark All Read API] Error getting unread count:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      count: result.count || 0,
      filtered: false
    });
    
  } catch (error) {
    console.error('[Mark All Read API] Error processing GET request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for marking all notifications as unread (for testing/admin purposes)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse optional request body for admin confirmation
    try {
      const body = await request.json();
      
      // Require explicit confirmation for this destructive action
      if (!body.confirm || body.confirm !== 'mark-all-unread') {
        return NextResponse.json({ 
          error: 'This action requires confirmation. Send { "confirm": "mark-all-unread" } in request body.' 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'This action requires confirmation. Send { "confirm": "mark-all-unread" } in request body.' 
      }, { status: 400 });
    }
    
    // Mark all notifications as unread
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('Notification')
      .update({ is_read: false })
      .eq('user_id', user.id)
      .eq('is_read', true)
      .select('id');
    
    if (error) {
      console.error('[Mark All Read API] Error marking all notifications as unread:', error.message);
      return NextResponse.json({ error: 'Failed to mark notifications as unread' }, { status: 500 });
    }
    
    const markedCount = data?.length || 0;
    
    return NextResponse.json({ 
      success: true,
      message: `Marked ${markedCount} notifications as unread`,
      markedCount
    });
    
  } catch (error) {
    console.error('[Mark All Read API] Error processing DELETE request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}
