import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "../../../../lib/db";

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
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status === "success" ? "COMPLETED" : "FAILED",
          paymentReference: reference,
        },
      });
      
      // If payment was successful, update the inventory and create order items
      if (status === "success") {
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { 
            items: {
              include: {
                product: true,
              },
            },
          },
        });
        
        if (order) {
          // Update product inventory for each order item
          for (const item of order.items) {
            await db.product.update({
              where: { id: item.productId },
              data: {
                inventory: { decrement: item.quantity },
              },
            });
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
      await db.payout.update({
        where: { id: payoutId },
        data: {
          status: status === "success" ? "COMPLETED" : "FAILED",
          reference: reference,
        },
      });
    }
  } catch (error) {
    console.error("Error handling successful transfer:", error);
    throw error;
  }
} 