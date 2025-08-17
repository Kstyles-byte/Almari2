import { NextRequest, NextResponse } from 'next/server';
import { createNotificationFromTemplate } from '@/lib/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const { userId, templateKey, data } = await request.json();

    if (!userId || !templateKey) {
      return NextResponse.json(
        { error: 'userId and templateKey are required' },
        { status: 400 }
      );
    }

    // Create a test notification
    const result = await createNotificationFromTemplate(
      templateKey,
      userId,
      data || {},
      { 
        orderId: data?.orderId || null,
        returnId: data?.returnId || null,
        referenceUrl: '/notifications'
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      notification: result.notification,
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('[Test Notification API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
