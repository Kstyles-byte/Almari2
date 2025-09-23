import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client with service role key for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

const PAYSTACK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

/**
 * Verify that the request is coming from Paystack
 * @param request The incoming request
 * @param body The request body
 * @returns Boolean indicating if the request is valid
 */
function verifyPaystackSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get("x-paystack-signature");
    if (!signature) return false;
    
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET || "")
      .update(body)
      .digest("hex");
    
    return hash === signature;
  } catch (error) {
    console.error("Error verifying Paystack signature:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the request body as text for signature verification
    const body = await req.text();
    
    // Verify the request is from Paystack
    if (!verifyPaystackSignature(req, body)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(body);
    const { event, data } = payload;
    
    // Handle different event types
    switch (event) {
      case "charge.success":
        await handleSuccessfulCharge(data);
        break;
      
      case "transfer.success":
        await handleSuccessfulTransfer(data);
        break;
      
      // Add more event handlers as needed
      default:
        console.log(`Unhandled Paystack event: ${event}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Paystack webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * Handle a successful charge event
 * @param data The charge data from Paystack
 */
async function handleSuccessfulCharge(data: {
  reference: string;
  metadata: {
    orderId?: string;
    [key: string]: any;
  };
  status: string;
}) {
  try {
    const { reference, metadata, status } = data;
    
    // Check if the metadata contains an orderId
    if (metadata && metadata.orderId) {
      const orderId = metadata.orderId;
      
      // Update the order with payment information
      const { error: orderUpdateError } = await supabase
        .from('Order')
        .update({
          payment_status: status === "success" ? "COMPLETED" : "FAILED",
          payment_reference: reference,
        })
        .eq('id', orderId);
        
      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        throw orderUpdateError;
      }
      
      // If payment was successful, update the inventory
      if (status === "success") {
        // Get order items
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('OrderItem')
          .select('product_id, quantity')
          .eq('order_id', orderId);
        
        if (orderItemsError) {
          console.error("Error fetching order items:", orderItemsError);
        } else if (orderItems) {
          // Update product inventory for each order item
          for (const item of orderItems) {
            const { error: inventoryError } = await supabase
              .rpc('decrement_inventory', {
                product_id: item.product_id,
                quantity: item.quantity
              });
              
            if (inventoryError) {
              console.error("Error updating inventory for product:", item.product_id, inventoryError);
              // Note: You might want to implement a fallback or manual inventory adjustment
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error handling successful charge:", error);
    throw error;
  }
}

/**
 * Handle a successful transfer event (e.g., payout to vendor)
 * @param data The transfer data from Paystack
 */
async function handleSuccessfulTransfer(data: {
  reference: string;
  metadata: {
    payoutId?: string;
    [key: string]: any;
  };
  status: string;
}) {
  try {
    const { reference, metadata, status } = data;
    
    // Check if the metadata contains a payoutId
    if (metadata && metadata.payoutId) {
      const payoutId = metadata.payoutId;
      
      // Update the payout with transfer information
      const { error: payoutUpdateError } = await supabase
        .from('Payout')
        .update({
          status: status === "success" ? "COMPLETED" : "FAILED",
          reference_id: reference,
        })
        .eq('id', payoutId);
        
      if (payoutUpdateError) {
        console.error("Error updating payout:", payoutUpdateError);
        throw payoutUpdateError;
      }
    }
  } catch (error) {
    console.error("Error handling successful transfer:", error);
    throw error;
  }
} 