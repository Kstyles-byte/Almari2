import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { auth } from "../../../../../auth";
import { getAgentById } from "../../../../../lib/services/agent";

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
    
    const where: any = { agentId };
    
    if (status) {
      where.status = status;
    }
    
    if (pickupStatus) {
      where.pickupStatus = pickupStatus;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await db.order.findMany({
      where,
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
            vendor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.order.count({ where });
    
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
    console.error("Error fetching agent orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent orders" },
      { status: 500 }
    );
  }
} 