import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { auth } from "../../../../../auth";
import { getCustomerByUserId } from "../../../../../lib/services/customer";
import { createReturnRequest } from "../../../../../lib/services/return";

export async function POST(
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
    
    // Only customers can create return requests
    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can create return requests" },
        { status: 401 }
      );
    }
    
    const orderId = context.params.id;
    const body = await request.json();
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Check if the order belongs to the customer
    if (order.customerId !== customer.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Validate required fields
    if (!body.productId || !body.vendorId || !body.reason || !body.refundAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create return request
    const result = await createReturnRequest({
      orderId,
      productId: body.productId,
      customerId: customer.id,
      vendorId: body.vendorId,
      agentId: order.agentId as string,
      reason: body.reason,
      refundAmount: body.refundAmount,
    });
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result.returnRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating return request:", error);
    return NextResponse.json(
      { error: "Failed to create return request" },
      { status: 500 }
    );
  }
} 