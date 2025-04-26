import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { auth } from "../../../../../auth";
import { getAgentById } from "../../../../../lib/services/agent";
import { verifyPickupCode, generatePickupCode } from "../../../../../lib/services/agent";

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
    
    const agentId = context.params.id;
    
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
    const pickupStatus = searchParams.get("pickupStatus") || "READY_FOR_PICKUP";
    
    const skip = (page - 1) * limit;
    
    const orders = await db.order.findMany({
      where: {
        agentId,
        pickupStatus,
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.order.count({
      where: {
        agentId,
        pickupStatus,
      },
    });
    
    return NextResponse.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching agent pickups:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent pickups" },
      { status: 500 }
    );
  }
}

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
    
    const agentId = context.params.id;
    
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
    
    // Get order
    const order = await db.order.findUnique({
      where: { id: body.orderId },
    });
    
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
      const pickupCode = generatePickupCode();
      
      const updatedOrder = await db.order.update({
        where: { id: body.orderId },
        data: {
          pickupStatus: "READY_FOR_PICKUP",
          pickupCode,
        },
      });
      
      return NextResponse.json({
        success: true,
        pickupCode,
        order: updatedOrder,
      });
    } else if (body.action === "verify_pickup") {
      // Verify pickup code
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
      { error: "Failed to manage pickup" },
      { status: 500 }
    );
  }
} 