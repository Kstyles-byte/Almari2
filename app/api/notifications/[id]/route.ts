import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { 
  markNotificationAsRead, 
  deleteNotification 
} from "../../../../lib/services/notification";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in notifications/[id] API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const notificationId = context.params.id;
    if (!notificationId) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    
    const { data: notification, error: fetchError } = await supabase
      .from('Notification')
      .select(`
        *,
        Order:orderId (*),
        Return:returnId (*)
      `)
      .eq('id', notificationId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("API GET Notification - Fetch error:", fetchError.message);
        throw fetchError;
    }
    
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const formattedNotification = {
        ...notification,
        order: notification.Order,
        return: notification.Return,
        Order: undefined,
        Return: undefined
    };

    return NextResponse.json(formattedNotification);

  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const notificationId = context.params.id;
    if (!notificationId) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    
    const { data: notificationData, error: fetchError } = await supabase
      .from('Notification')
      .select('userId')
      .eq('id', notificationId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API PATCH Notification - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!notificationData) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    if (notificationData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const result = await markNotificationAsRead(notificationId);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const notificationId = context.params.id;
    if (!notificationId) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    
    const { data: notificationData, error: fetchError } = await supabase
      .from('Notification')
      .select('userId')
      .eq('id', notificationId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API DELETE Notification - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!notificationData) {
      return NextResponse.json({ success: true, message: "Notification already deleted or not found" }, { status: 200 });
    }
    
    if (notificationData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const result = await deleteNotification(notificationId);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, message: "Notification deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete notification" },
      { status: 500 }
    );
  }
}