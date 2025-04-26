import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admin can list all agents
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const isActiveParam = searchParams.get("isActive");
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true";
    }
    
    const agents = await db.agent.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
    });
    
    const total = await db.agent.count({ where });
    
    return NextResponse.json({
      data: agents,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only admin can create agents
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.name || !body.email || !body.phone || !body.location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: body.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if agent with this email already exists
    const existingAgent = await db.agent.findUnique({
      where: { email: body.email },
    });
    
    if (existingAgent) {
      return NextResponse.json(
        { error: "Agent with this email already exists" },
        { status: 400 }
      );
    }
    
    // Create agent
    const agent = await db.agent.create({
      data: {
        userId: body.userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        operatingHours: body.operatingHours,
        capacity: body.capacity || 0,
      },
    });
    
    // Update user role to AGENT
    await db.user.update({
      where: { id: body.userId },
      data: { role: "AGENT" },
    });
    
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
} 