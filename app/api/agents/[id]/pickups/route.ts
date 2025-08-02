import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getAgentById } from "../../../../../lib/services/agent";
import { verifyPickupCode, generatePickupCode } from "../../../../../lib/services/agent";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in agents/[id]/pickups API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define PickupStatus enum (should match your types/schema)
type PickupStatus = 'PENDING' | 'READY_FOR_PICKUP' | 'PICKED_UP';

export async function GET(
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
    
    const agentId = (await context.params).id;
    
    // Get agent
    const agent = await getAgentById(agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    // Check authorization based on role
    if (session.user.role === "AGENT") {
      // Agents can only view their own pickups
      if (agent.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      // Only agents and admins can view agent pickups
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const pickupStatus = (searchParams.get("pickupStatus") as PickupStatus) || "READY_FOR_PICKUP";
    
    const skip = (page - 1) * limit;
    
    // Build Supabase query
    let query = supabase
      .from('Order')
      .select(`
        *,
        Customer:customerId (*, User:userId (name, email)),
        OrderItem ( *, Product:productId (*) )
      `, { count: 'exact' })
      .eq('agentId', agentId)
      .eq('pickupStatus', pickupStatus);
      
    let countQuery = supabase
      .from('Order')
      .select('*' , { count: 'exact', head: true })
      .eq('agentId', agentId)
      .eq('pickupStatus', pickupStatus);

    // Apply sorting and pagination to main query
    query = query.order('updatedAt', { ascending: false })
                 .range(skip, skip + limit - 1);

    // Execute queries
    const { data: orders, error: ordersError } = await query;
    const { count, error: countError } = await countQuery;

    if (ordersError) {
      console.error("Supabase error fetching agent pickups:", ordersError.message);
      throw ordersError;
    }
    if (countError) {
      console.error("Supabase error fetching agent pickup count:", countError.message);
    }

    // Format data if necessary
     const formattedOrders = orders?.map((o: any) => ({
        ...o,
        customer: o.Customer, // Rename if needed
        items: o.OrderItem,    // Rename if needed
        Customer: undefined,
        OrderItem: undefined
    })) || [];
    
    return NextResponse.json({
      data: formattedOrders,
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching agent pickups:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch agent pickups" },
      { status: 500 }
    );
  }
}

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
    
    const agentId = (await context.params).id;
    
    // Get agent
    const agent = await getAgentById(agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    // Check authorization based on role
    if (session.user.role === "AGENT") {
      // Agents can only manage their own pickups
      if (agent.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      // Only agents and admins can manage agent pickups
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    if (!body.orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Get order using Supabase
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('*') // Select all fields or specific ones needed
      .eq('id', body.orderId)
      .maybeSingle();
      
    if (orderError && orderError.code !== 'PGRST116') {
        console.error("API POST Pickup - Error fetching order:", orderError.message);
        throw orderError;
    }
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Verify that the agent is assigned to this order
    if (order.agentId !== agentId) {
      return NextResponse.json(
        { error: "This order is not assigned to this agent" },
        { status: 400 }
      );
    }
    
    if (body.action === "mark_ready") {
      // Mark order as ready for pickup
      const pickupCode = generatePickupCode(); // Use migrated service
      
      const { data: updatedOrder, error: updateError } = await supabase
        .from('Order')
        .update({
          pickupStatus: "READY_FOR_PICKUP",
          pickupCode,
          updatedAt: new Date().toISOString(), // Manually update timestamp
        })
        .eq('id', body.orderId)
        .select() // Select updated data
        .single();

      if (updateError) {
          console.error("API POST Pickup - Error updating order status:", updateError.message);
          throw updateError;
      }
      
      return NextResponse.json({
        success: true,
        pickupCode,
        order: updatedOrder,
      });
    } else if (body.action === "verify_pickup") {
      // Verify pickup code using migrated service
      if (!body.pickupCode) {
        return NextResponse.json(
          { error: "Pickup code is required" },
          { status: 400 }
        );
      }
      
      const verificationResult = await verifyPickupCode(body.orderId, body.pickupCode);
      
      if (!verificationResult.success) {
        return NextResponse.json(
          { error: verificationResult.error },
          { status: 400 }
        );
      }
      
      // If successful, the service already checked conditions.
      // We might want to update status to PICKED_UP here or rely on the action/service flow.
      // For now, just return the verified order from the service.
      return NextResponse.json({
        success: true,
        order: verificationResult.order,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error managing pickup:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage pickup" },
      { status: 500 }
    );
  }
} 