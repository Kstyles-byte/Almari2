import { db } from "../db";
import { createRefund } from "../paystack";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Process automated refund through Paystack
 */
export async function processAutomatedRefund(returnId: string) {
  try {
    // Get return data with order information
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        order: true,
        product: true,
      },
    });
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    // Check if return is already processed
    if (returnData.refundStatus === "PROCESSED") {
      return { success: true, message: "Refund already processed" };
    }
    
    // Check if return is approved
    if (returnData.status !== "APPROVED" && returnData.status !== "COMPLETED") {
      return { error: "Return must be approved or completed before processing refund" };
    }
    
    // Get original transaction reference from order
    const paymentReference = returnData.order.paymentReference;
    
    if (!paymentReference) {
      return { error: "No payment reference found for this order" };
    }
    
    // Convert Decimal to number for Paystack API
    const refundAmount = returnData.refundAmount instanceof Decimal 
      ? returnData.refundAmount.toNumber() 
      : Number(returnData.refundAmount);
    
    // Create refund request through Paystack
    const refundResult = await createRefund({
      transaction: paymentReference,
      amount: Math.round(refundAmount * 100), // Convert to kobo (smallest currency unit)
      customer_note: `Refund for return #${returnId} for product ${returnData.product.name}`,
      merchant_note: `Automated refund for return request #${returnId}`,
    });
    
    if (!refundResult.status) {
      return { error: "Failed to process refund through Paystack" };
    }
    
    // Update return status
    await db.return.update({
      where: { id: returnId },
      data: {
        refundStatus: "PROCESSED",
      },
    });
    
    // Update order payment status
    await db.order.update({
      where: { id: returnData.orderId },
      data: {
        paymentStatus: "REFUNDED",
      },
    });
    
    return { 
      success: true, 
      refundData: refundResult.data,
      message: "Refund processed successfully" 
    };
  } catch (error) {
    console.error("Error processing automated refund:", error);
    return { error: "Failed to process automated refund" };
  }
}

/**
 * Check refund status from Paystack
 */
export async function checkRefundStatus(returnId: string) {
  try {
    // Get return data
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        order: true,
      },
    });
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    // For future implementation: Call Paystack API to check refund status
    // This would require getting the refund reference from a previous refund request
    // and storing it in the return record
    
    return { 
      success: true, 
      status: returnData.refundStatus,
    };
  } catch (error) {
    console.error("Error checking refund status:", error);
    return { error: "Failed to check refund status" };
  }
}

/**
 * Process batch refunds for all approved returns
 */
export async function processBatchRefunds() {
  try {
    // Find all approved returns with pending refund status
    const pendingRefunds = await db.return.findMany({
      where: {
        status: "APPROVED",
        refundStatus: "PENDING",
      },
      include: {
        order: true,
      },
    });
    
    if (pendingRefunds.length === 0) {
      return { success: true, message: "No pending refunds to process" };
    }
    
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    // Process each refund
    for (const returnData of pendingRefunds) {
      const result = await processAutomatedRefund(returnData.id);
      
      if (result.success) {
        results.processed++;
      } else {
        results.failed++;
        results.errors.push(`Return #${returnData.id}: ${result.error}`);
      }
    }
    
    return { 
      success: true, 
      results,
      message: `Processed ${results.processed} refunds, failed ${results.failed} refunds` 
    };
  } catch (error) {
    console.error("Error processing batch refunds:", error);
    return { error: "Failed to process batch refunds" };
  }
} 