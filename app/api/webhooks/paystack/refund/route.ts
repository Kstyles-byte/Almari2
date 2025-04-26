import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "../../../../../lib/db";
import { createReturnStatusNotification } from "../../../../../lib/services/notification";

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
    const order = await db.order.findFirst({
      where: { paymentReference: transactionReference },
      include: {
        returns: true,
      },
    });
    
    if (!order || order.returns.length === 0) {
      console.error("No return found for transaction:", transactionReference);
      return NextResponse.json({ success: true });
    }
    
    // Get the most recent return for this order
    const latestReturn = order.returns.sort(
      (a: { createdAt: Date }, b: { createdAt: Date }) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
    
    const returnId = latestReturn.id;
    
    // Update return status based on webhook event
    if (payload.event === "refund.processed") {
      await db.return.update({
        where: { id: returnId },
        data: {
          refundStatus: "PROCESSED",
        },
      });
      
      // Update order payment status
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "REFUNDED",
        },
      });
      
      // Create notification
      await createReturnStatusNotification(returnId, "REFUND_PROCESSED");
      
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