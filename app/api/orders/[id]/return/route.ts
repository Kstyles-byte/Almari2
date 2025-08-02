import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getCustomerByUserId } from "../../../../../lib/services/customer";
import { createReturnRequest } from "../../../../../lib/services/return";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in orders/[id]/return API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    
    const orderId = (await context.params).id;
    if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    const body = await request.json();
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    // Get order using Supabase to verify ownership and get agentId
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('id, customerId, agentId') // Select only necessary fields
      .eq('id', orderId)
      .maybeSingle();

    if (orderError && orderError.code !== 'PGRST116') {
        console.error("API POST Order Return - Fetch error:", orderError.message);
        throw orderError;
    }
    
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
    
    // Validate required fields from body
    if (!body.productId || !body.vendorId || !body.reason || body.refundAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (productId, vendorId, reason, refundAmount)" },
        { status: 400 }
      );
    }

    if (!order.agentId) {
         return NextResponse.json(
            { error: "Cannot request return for order without an assigned agent." },
            { status: 400 }
        );
    }
    
    // Create return request using migrated service
    const result = await createReturnRequest({
      orderId,
      productId: body.productId,
      customerId: customer.id,
      vendorId: body.vendorId,
      agentId: order.agentId, // Use agentId fetched from the order
      reason: body.reason,
      refundAmount: Number(body.refundAmount), // Ensure it's a number
    });
    
    // Service function handles validation like 24hr window check
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 } // Assume service errors are client-side issues
      );
    }
    
    return NextResponse.json(result.returnRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating return request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create return request" },
      { status: 500 }
    );
  }
} 