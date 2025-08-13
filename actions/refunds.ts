"use server";

import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { 
  processAutomatedRefund, 
  checkRefundStatus, 
  processBatchRefunds 
} from "../lib/services/refund";
import { createReturnStatusNotification } from "../lib/services/notification";

/**
 * Process automated refund through Paystack
 */
export async function processRefundAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can manually process refunds
    if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    const returnId = formData.get("returnId") as string;
    
    if (!returnId) {
      return { error: "Return ID is required" };
    }
    
    // Process refund through Paystack
    const result = await processAutomatedRefund(returnId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Create notification for refund processing
    await createReturnStatusNotification(returnId, "COMPLETED");
    
    revalidatePath(`/admin/refunds`);
    revalidatePath("/admin/refunds");
    revalidatePath(`/customer/refunds`);
    revalidatePath("/customer/refunds");
    
    return { 
      success: true, 
      message: result.message 
    };
  } catch (error) {
    console.error("Error processing refund:", error);
    return { error: "Failed to process refund" };
  }
}

/**
 * Check refund status from Paystack
 */
export async function checkRefundStatusAction(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const returnId = formData.get("returnId") as string;
    
    if (!returnId) {
      return { error: "Return ID is required" };
    }
    
    // Check if user is authorized to view this return
    // This would typically check if the user is an admin, the customer,
    // the vendor, or the agent associated with the return
    
    // Check refund status
    const result = await checkRefundStatus(returnId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    return result;
  } catch (error) {
    console.error("Error checking refund status:", error);
    return { error: "Failed to check refund status" };
  }
}

/**
 * Admin: Process batch refunds for all approved returns
 */
export async function processBatchRefundsAction() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Only admins can process batch refunds
    if (session.user.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }
    
    // Process batch refunds
    const result = await processBatchRefunds();
    
    if (result.error) {
      return { error: result.error };
    }
    
    revalidatePath("/admin/refunds");
    
    return result;
  } catch (error) {
    console.error("Error processing batch refunds:", error);
    return { error: "Failed to process batch refunds" };
  }
}

/**
 * Scheduled task to automatically process pending refunds
 * This would be called by a cron job or scheduled task
 * No authentication is needed as it's triggered by the system
 */
export async function processScheduledRefundsAction() {
  try {
    // Process batch refunds
    const result = await processBatchRefunds();
    
    if (result.error) {
      console.error("Scheduled refund processing failed:", result.error);
      return { error: result.error };
    }
    
    console.log("Scheduled refund processing completed:", result.message);
    return result;
  } catch (error) {
    console.error("Error processing scheduled refunds:", error);
    return { error: "Failed to process scheduled refunds" };
  }
} 