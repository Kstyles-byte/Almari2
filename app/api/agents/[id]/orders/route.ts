import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getAgentById } from "../../../../../lib/services/agent";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in agents/[id]/orders API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
      // Agents can only view their own orders
      if (agent.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      // Only agents and admins can view agent orders
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const pickupStatus = searchParams.get("pickupStatus") || undefined;
    
    const skip = (page - 1) * limit;

    // Build Supabase query
    let query = supabase
      .from('Order')
      .select(`
        *,
        Customer:customerId (*, User:userId (name, email)),
        OrderItem ( *, Product:productId (*), Vendor:vendorId (*) )
      `, { count: 'exact' })
      .eq('agentId', agentId);
      
     let countQuery = supabase
      .from('Order')
      .select('*' , { count: 'exact', head: true })
      .eq('agentId', agentId);

    // Apply optional filters
    if (status) {
      // TODO: Add validation for status enum if necessary
      query = query.eq('status', status);
      countQuery = countQuery.eq('status', status);
    }
    if (pickupStatus) {
      // TODO: Add validation for pickupStatus enum if necessary
      query = query.eq('pickupStatus', pickupStatus);
      countQuery = countQuery.eq('pickupStatus', pickupStatus);
    }

    // Apply sorting and pagination to main query
    query = query.order('createdAt', { ascending: false })
                 .range(skip, skip + limit - 1);

    // Execute queries
    const { data: orders, error: ordersError } = await query;
    const { count, error: countError } = await countQuery;

    if (ordersError) {
      console.error("Supabase error fetching agent orders:", ordersError.message);
      throw ordersError;
    }
    if (countError) {
      console.error("Supabase error fetching agent order count:", countError.message);
      // Proceed even if count fails?
    }

    // Format data if necessary (e.g., renaming relations)
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
    console.error("Error fetching agent orders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch agent orders" },
      { status: 500 }
    );
  }
} 