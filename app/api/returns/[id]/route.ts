import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";
import { getCustomerByUserId } from "../../../../lib/services/customer";
import { getVendorByUserId } from "../../../../lib/services/vendor";
import { getAgentByUserId } from "../../../../lib/services/agent";
import { getReturnById } from "../../../../lib/services/return";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const returnId = context.params.id;
    
    // Get return
    const returnData = await getReturnById(returnId);
    
    if (!returnData) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }
    
    // Check authorization based on role
    if (session.user.role === "CUSTOMER") {
      const customer = await getCustomerByUserId(session.user.id);
      if (!customer || customer.id !== returnData.customerId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role === "AGENT") {
      const agent = await getAgentByUserId(session.user.id);
      if (!agent || agent.id !== returnData.agentId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(returnData);
  } catch (error) {
    console.error("Error fetching return:", error);
    return NextResponse.json(
      { error: "Failed to fetch return" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const returnId = context.params.id;
    const body = await request.json();
    
    // Get return
    const returnData = await getReturnById(returnId);
    
    if (!returnData) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }
    
    // Check authorization and allowed actions based on role
    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Vendors can only approve or reject returns
      if (body.action === "approve") {
        await db.return.update({
          where: { id: returnId },
          data: {
            status: "APPROVED",
            processDate: new Date(),
          },
        });
      } else if (body.action === "reject") {
        if (!body.reason) {
          return NextResponse.json(
            { error: "Rejection reason is required" },
            { status: 400 }
          );
        }
        
        await db.return.update({
          where: { id: returnId },
          data: {
            status: "REJECTED",
            refundStatus: "REJECTED",
            reason: `REJECTED: ${body.reason}`,
            processDate: new Date(),
          },
        });
      } else {
        return NextResponse.json(
          { error: "Invalid action for vendor" },
          { status: 400 }
        );
      }
    } else if (session.user.role === "AGENT") {
      const agent = await getAgentByUserId(session.user.id);
      if (!agent || agent.id !== returnData.agentId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Agents can only complete returns that are approved
      if (body.action === "complete") {
        if (returnData.status !== "APPROVED") {
          return NextResponse.json(
            { error: "Return must be approved before completing" },
            { status: 400 }
          );
        }
        
        // Update product inventory (increase by 1)
        await db.product.update({
          where: { id: returnData.productId },
          data: {
            inventory: { increment: 1 },
          },
        });
        
        // Update return status
        await db.return.update({
          where: { id: returnId },
          data: {
            status: "COMPLETED",
            refundStatus: "PROCESSED",
          },
        });
        
        // Update order payment status for refund
        await db.order.update({
          where: { id: returnData.orderId },
          data: {
            paymentStatus: "REFUNDED",
          },
        });
      } else {
        return NextResponse.json(
          { error: "Invalid action for agent" },
          { status: 400 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    } else {
      // Admin can perform any action
      if (body.status) {
        await db.return.update({
          where: { id: returnId },
          data: {
            status: body.status,
            processDate: body.status === "REQUESTED" ? null : new Date(),
          },
        });
      }
      
      if (body.refundStatus) {
        await db.return.update({
          where: { id: returnId },
          data: {
            refundStatus: body.refundStatus,
          },
        });
        
        if (body.refundStatus === "PROCESSED") {
          // Update order payment status for refund
          await db.order.update({
            where: { id: returnData.orderId },
            data: {
              paymentStatus: "REFUNDED",
            },
          });
        }
      }
    }
    
    // Get updated return
    const updatedReturn = await getReturnById(returnId);
    
    return NextResponse.json(updatedReturn);
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json(
      { error: "Failed to update return" },
      { status: 500 }
    );
  }
} 