import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { createReturnStatusNotification } from "../../../../../lib/services/notification";

// Initialize Supabase client with service role key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

/**
 * Handle Paystack refund webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request JSON
    const payload = await request.json();
    
    // Check if this is a refund event
    if (payload.event !== "refund.processed" && payload.event !== "refund.failed") {
      // Not a refund event we're interested in
      return NextResponse.json({ success: true });
    }
    
    const data = payload.data;
    const transactionReference = data.transaction.reference;
    
    // Get order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, payment_reference')
      .eq('payment_reference', transactionReference)
      .single();
    
    if (orderError || !order) {
      console.error("No order found for transaction:", transactionReference, orderError);
      return NextResponse.json({ success: true });
    }
    
    // Get the most recent return for this order
    const { data: returns, error: returnsError } = await supabase
      .from('Return')
      .select('id, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (returnsError || !returns || returns.length === 0) {
      console.error("No return found for order:", order.id, returnsError);
      return NextResponse.json({ success: true });
    }
    
    const returnId = returns[0].id;
    
    // Update return status based on webhook event
    if (payload.event === "refund.processed") {
      // Update return status
      const { error: returnUpdateError } = await supabase
        .from('Return')
        .update({ refund_status: "PROCESSED" })
        .eq('id', returnId);
      
      if (returnUpdateError) {
        console.error("Error updating return status:", returnUpdateError);
      }
      
      // Update order payment status
      const { error: orderUpdateError } = await supabase
        .from('Order')
        .update({ payment_status: "REFUNDED" })
        .eq('id', order.id);
      
      if (orderUpdateError) {
        console.error("Error updating order payment status:", orderUpdateError);
      }
      
      // Create notification
      try {
        await createReturnStatusNotification(returnId, "REFUND_PROCESSED");
      } catch (notificationError) {
        console.error("Error creating refund notification:", notificationError);
      }
      
      console.log(`Refund processed for return: ${returnId}`);
    } else if (payload.event === "refund.failed") {
      // Log the failure but keep the status as PENDING so it can be retried
      console.error("Refund failed for return:", returnId, "Reason:", data.reason);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Paystack refund webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
} 