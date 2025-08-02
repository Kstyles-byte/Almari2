import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { createClient } from '@supabase/supabase-js';
import type { Agent } from '../../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in agents/[id] API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const agentId = (await context.params).id;
    
    const { data: agent, error: fetchError } = await supabase
      .from('Agent')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API GET Agent - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    if (session.user.role === "AGENT") {
      if (agent.userId !== session.user.id) {
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
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const agentId = (await context.params).id;
    const body = await request.json();
    
    const { data: agent, error: fetchError } = await supabase
      .from('Agent')
      .select('id, userId')
      .eq('id', agentId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API PUT Agent - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }
    
    const updateData: Partial<Agent> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
    };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours;
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);

    if (session.user.role === "AGENT") {
      if (agent.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      if (body.isActive !== undefined) {
      }
    } else if (session.user.role === "ADMIN") {
      if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { data: updatedAgent, error: updateError } = await supabase
      .from('Agent')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) {
        console.error("API PUT Agent - Update error:", updateError.message);
        throw updateError;
    }
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const agentId = (await context.params).id;
    
    const { data: agent, error: fetchError } = await supabase
      .from('Agent')
      .select('id, userId')
      .eq('id', agentId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API DELETE Agent - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!agent) {
      return NextResponse.json({ message: "Agent already deleted or not found" }, { status: 200 });
    }
    
    const agentUserId = agent.userId;

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(agentUserId);
    if (authDeleteError) {
        console.error("Supabase Auth delete error during Agent deletion:", authDeleteError.message);
        if (authDeleteError.message !== 'User not found') {
             return NextResponse.json({ error: `Auth deletion failed: ${authDeleteError.message}` }, { status: 500 });
        }
    }

    const { error: dbDeleteError } = await supabase
      .from('Agent')
      .delete()
      .eq('id', agentId);

     if (dbDeleteError) {
        console.error("API DELETE Agent - DB delete error:", dbDeleteError.message);
        throw dbDeleteError;
    }
    
    const { error: roleUpdateError } = await supabase
      .from('User')
      .update({ role: "CUSTOMER", updatedAt: new Date().toISOString() })
      .eq('id', agentUserId);

    if (roleUpdateError) {
        console.error("API DELETE Agent - Role update error:", roleUpdateError.message);
    }
    
    return NextResponse.json({ success: true, message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete agent" },
      { status: 500 }
    );
  }
}
