import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { 
  createNotificationFromTemplate, 
  createBatchNotifications,
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead 
} from '../../../lib/services/notificationService';

// Create a Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    console.error("[Notifications API] Error creating Supabase client:", error);
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
    console.error("[Notifications API] Auth error:", error.message);
    return null;
  }
  
  return user;
}

/**
 * API handler for creating notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key in headers (for external/system calls)
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.NOTIFICATIONS_API_KEY) {
      console.error('[Notifications API] Unauthorized notification creation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate request payload
    if (!body || !body.type) {
      console.error('[Notifications API] Invalid notification request payload:', body);
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    // Handle batch notification creation
    if (body.batch && Array.isArray(body.notifications)) {
      const result = await createBatchNotifications(body.notifications);
      
      if (!result.success) {
        console.error('[Notifications API] Error creating batch notifications:', result.errors);
        return NextResponse.json({ 
          error: 'Failed to create batch notifications', 
          details: result.errors 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        created: result.created 
      });
    }

    // Handle template-based notification creation
    if (body.template) {
      if (!body.userId || !body.template) {
        return NextResponse.json(
          { error: 'Missing required fields for template: userId, template' }, 
          { status: 400 }
        );
      }
      
      const result = await createNotificationFromTemplate(
        body.template,
        body.userId,
        body.data || {},
        {
          orderId: body.orderId,
          returnId: body.returnId,
          referenceUrl: body.referenceUrl
        }
      );
      
      if (!result.success) {
        console.error('[Notifications API] Error creating template notification:', result.error);
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, notification: result.notification });
    }
    
    // Legacy notification type handlers for backward compatibility
    switch (body.type) {
      case 'ORDER_STATUS_CHANGE': {
        if (!body.orderId || !body.status) {
          return NextResponse.json(
            { error: 'Missing required fields: orderId, status' }, 
            { status: 400 }
          );
        }
        
        // Use template system for order status changes
        const templateKey = `ORDER_${body.status.toUpperCase()}`;
        const result = await createNotificationFromTemplate(
          templateKey,
          body.userId,
          { orderId: body.orderId, status: body.status },
          { orderId: body.orderId }
        );
        
        if (!result.success) {
          console.error('[Notifications API] Error creating order status notification:', result.error);
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported notification type: ${body.type}. Use template-based creation instead.` }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Notifications API] Error processing POST request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for getting notifications with enhanced pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100); // Max 100 per page
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type'); // Filter by notification type
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    
    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json({ 
        error: 'Invalid pagination parameters. Page and limit must be positive integers.' 
      }, { status: 400 });
    }
    
    // Handle special endpoints
    if (searchParams.get('action') === 'count') {
      const result = await getUnreadNotificationCount(user.id);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      
      return NextResponse.json({ 
        count: result.count,
        userId: user.id 
      });
    }

    if (searchParams.get('action') === 'mark-all-read') {
      const result = await markAllNotificationsAsRead(user.id);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Get notifications with enhanced filtering
    const notifications = await getUserNotifications(user.id, {
      page,
      limit,
      unreadOnly
    });
    
    if ('error' in notifications) {
      console.error('[Notifications API] Error fetching notifications:', notifications.error);
      return NextResponse.json({ error: notifications.error }, { status: 500 });
    }
    
    // Apply additional filtering if specified
    let filteredData = notifications.data;
    
    if (type) {
      filteredData = filteredData.filter(notification => notification.type === type);
    }
    
    // Calculate updated metadata based on filtering
    const filteredTotal = filteredData.length;
    const filteredPageCount = Math.ceil(filteredTotal / limit);
    
    return NextResponse.json({
      data: filteredData,
      meta: {
        ...notifications.meta,
        filtered: type ? true : false,
        filteredTotal: type ? filteredTotal : notifications.meta.total,
        filteredPageCount: type ? filteredPageCount : notifications.meta.pageCount
      },
      pagination: {
        page,
        limit,
        hasNextPage: page < (type ? filteredPageCount : notifications.meta.pageCount),
        hasPrevPage: page > 1,
        nextPage: page < (type ? filteredPageCount : notifications.meta.pageCount) ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    });
    
  } catch (error) {
    console.error('[Notifications API] Error processing GET request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for bulk operations on notifications
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    if (!body || !body.action) {
      return NextResponse.json({ error: 'Missing action in request body' }, { status: 400 });
    }
    
    switch (body.action) {
      case 'mark-all-read': {
        const result = await markAllNotificationsAsRead(user.id);
        
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        
        return NextResponse.json({ success: true });
      }
      
      case 'mark-selected-read': {
        if (!body.notificationIds || !Array.isArray(body.notificationIds)) {
          return NextResponse.json({ 
            error: 'notificationIds array is required for mark-selected-read action' 
          }, { status: 400 });
        }
        
        // Mark selected notifications as read
        const { error } = await supabaseAdmin
          .from('Notification')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .in('id', body.notificationIds);
        
        if (error) {
          console.error('[Notifications API] Error marking selected notifications as read:', error.message);
          return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          updated: body.notificationIds.length 
        });
      }
      
      default:
        return NextResponse.json({ 
          error: `Unsupported action: ${body.action}` 
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('[Notifications API] Error processing PUT request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for deleting notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    
    if (deleteAll) {
      // Delete all notifications for user
      const { error } = await supabaseAdmin
        .from('Notification')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[Notifications API] Error deleting all notifications:', error.message);
        return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'All notifications deleted' });
    }
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID or all parameter' }, { status: 400 });
    }
    
    // Delete specific notification (ensure it belongs to the user)
    const { error } = await supabaseAdmin
      .from('Notification')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[Notifications API] Error deleting notification:', error.message);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Notifications API] Error processing DELETE request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}