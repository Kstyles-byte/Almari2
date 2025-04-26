import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";

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
    
    // Get the agent
    const agent = await db.agent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    // Check authorization based on role
    if (session.user.role === "AGENT") {
      // Agents can only view their own profile
      if (agent.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      // Only agents and admins can view agent profiles
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
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
    
    const agentId = context.params.id;
    const body = await request.json();
    
    // Get the agent
    const agent = await db.agent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    // Check authorization based on role
    if (session.user.role === "AGENT") {
      // Agents can only update their own profile
      if (agent.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Agents cannot update isActive status
      if (body.isActive !== undefined) {
        delete body.isActive;
      }
    } else if (session.user.role !== "ADMIN") {
      // Only agents and admins can update agent profiles
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Update agent
    const updatedAgent = await db.agent.update({
      where: { id: agentId },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        operatingHours: body.operatingHours,
        capacity: body.capacity,
        isActive: body.isActive,
      },
    });
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Only admin can delete agents
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const agentId = context.params.id;
    
    // Get the agent to retrieve user ID
    const agent = await db.agent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    // Delete agent
    await db.agent.delete({
      where: { id: agentId },
    });
    
    // Reset user role
    await db.user.update({
      where: { id: agent.userId },
      data: { role: "CUSTOMER" },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
} 