import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createOrderStatusNotification, createReturnStatusNotification } from '../../../lib/services/notification';

// Create a Supabase admin client for authenticating API requests
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * API handler for creating notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.NOTIFICATIONS_API_KEY) {
      console.error('[API] Unauthorized notification creation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Validate request payload
    if (!body || !body.type) {
      console.error('[API] Invalid notification request payload:', body);
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }
    
    // Handle different notification types
    switch (body.type) {
      case 'ORDER_STATUS_CHANGE': {
        if (!body.orderId || !body.status) {
          return NextResponse.json(
            { error: 'Missing required fields: orderId, status' }, 
            { status: 400 }
          );
        }
        
        const result = await createOrderStatusNotification(body.orderId, body.status);
        
        if (!result.success) {
          console.error('[API] Error creating order status notification:', result.error);
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        
        return NextResponse.json({ success: true });
      }
      
      case 'RETURN_STATUS_CHANGE': {
        if (!body.returnId || !body.status) {
          return NextResponse.json(
            { error: 'Missing required fields: returnId, status' }, 
            { status: 400 }
          );
        }
        
        // Validate status
        const validStatuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'];
        if (!validStatuses.includes(body.status)) {
          return NextResponse.json(
            { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 
            { status: 400 }
          );
        }
        
        const result = await createReturnStatusNotification(
          body.returnId, 
          body.status as 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
        );
        
        if (!result.success) {
          console.error('[API] Error creating return status notification:', result.error);
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported notification type: ${body.type}` }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error processing notification request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

/**
 * API handler for getting notifications
 * This endpoint is meant for external services that might need to query notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.NOTIFICATIONS_API_KEY) {
      console.error('[API] Unauthorized notification query attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user ID from URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing required parameter: userId' }, { status: 400 });
    }
    
    // Query notifications directly from the database
    const { data, error } = await supabaseAdmin
      .from('Notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('[API] Error fetching notifications:', error.message);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
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