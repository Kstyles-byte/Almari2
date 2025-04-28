import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createClient } from '@supabase/supabase-js';
import { createAgent } from "../../../lib/services/agent";
import type { Agent } from '../../../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/agents.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    
    let query = supabase
        .from('Agent')
        .select('*' , { count: 'exact' });

    if (isActiveParam !== null) {
        query = query.eq('isActive', isActiveParam === "true");
    }

    query = query
        .order('createdAt', { ascending: false })
        .range(skip, skip + limit - 1);

    const { data: agents, error, count } = await query;

    if (error) {
        console.error("Supabase error fetching agents:", error.message);
        throw error;
    }
    
    return NextResponse.json({
      data: agents,
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
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
    
    // Check if user exists (using Supabase)
    const { data: userExists, error: userCheckError } = await supabase
        .from('User') // Check your custom User table
        .select('id')
        .eq('id', body.userId)
        .maybeSingle();

    if (userCheckError) {
        console.error("Error checking user existence:", userCheckError.message);
        return NextResponse.json({ error: "Database error checking user" }, { status: 500 });
    }

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Create agent using the service function
    const agentResult = await createAgent({
      userId: body.userId,
      name: body.name,
      email: body.email, // Service should handle potential email uniqueness check if needed
      phone: body.phone,
      location: body.location,
      operatingHours: body.operatingHours,
      capacity: body.capacity,
    });

    if (!agentResult.success || !agentResult.agent) {
      return NextResponse.json(
        // Use error from service if available
        { error: agentResult.error || "Failed to create agent via service" },
        // Use status 400 for predictable errors like duplicate user
        { status: agentResult.error?.includes("already exists") ? 400 : 500 }
      );
    }

    // Update user role to AGENT
    const { error: roleUpdateError } = await supabase
        .from('User')
        .update({ role: 'AGENT', updatedAt: new Date().toISOString() })
        .eq('id', body.userId);

    if (roleUpdateError) {
        // Log error, but agent was created.
        console.error("Failed to update user role to AGENT:", roleUpdateError.message);
        // Maybe return a warning in the response?
    }

    return NextResponse.json(agentResult.agent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create agent" },
      { status: 500 }
    );
  }
} 