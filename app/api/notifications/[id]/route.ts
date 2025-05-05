import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  markNotificationAsRead, 
  deleteNotification 
} from '../../../../lib/services/notification';

// Create a Supabase admin client for authenticating API requests
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * API handler for getting a specific notification by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.NOTIFICATIONS_API_KEY) {
      console.error('[API] Unauthorized notification access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }
    
    // Fetch the notification from the database
    const { data, error } = await supabaseAdmin
      .from('Notification')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('[API] Error fetching notification:', error.message);
      return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API] Error processing GET request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for updating a notification (mark as read)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.NOTIFICATIONS_API_KEY) {
      console.error('[API] Unauthorized notification update attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Currently, the only update operation we support is marking as read
    if (body.operation === 'mark_as_read') {
      const result = await markNotificationAsRead(id);
      
      if (result.error) {
        console.error('[API] Error marking notification as read:', result.error);
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    console.error('[API] Error processing PATCH request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for deleting a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.NOTIFICATIONS_API_KEY) {
      console.error('[API] Unauthorized notification deletion attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }
    
    // Delete the notification
    const result = await deleteNotification(id);
    
    if (result.error) {
      console.error('[API] Error deleting notification:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error processing DELETE request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 