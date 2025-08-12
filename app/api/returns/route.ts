import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getCustomerByUserId } from "../../../lib/services/customer";
import { createReturnRequest } from "../../../lib/services/return";
import { createClient } from '@supabase/supabase-js';
import { getVendorByUserId } from "../../../lib/services/vendor";
import { getAgentByUserId } from "../../../lib/services/agent";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/returns.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client for session
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: any) { cookieStore.set({ name, value: "", ...options }) },
        },
      }
    );
    const { data: { user } } = await supabaseSSR.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;
    
    let returns;
    let count: number | null = 0;
    
    // Base query
    let query = supabase.from('Return').select(`
        *,
        order:Order (*),
        product:Product (*),
        customer:Customer (*, user:User (name, email)),
        vendor:Vendor (*, user:User (name, email)),
        agent:Agent (*)
    `, { count: 'exact' });
    
    // Apply status filter
    if (status) {
        // TODO: Validate status against ReturnStatus enum?
        query = query.eq('status', status);
    }
    
    // Fetch role for the current user
    const { data: userProfile } = await supabaseSSR
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = userProfile?.role;

    if (role === "ADMIN") {
      // Admin can see all returns (no extra filters needed beyond status)
    } else if (role === "CUSTOMER") {
      // Customers can only see their own returns
      const customer = await getCustomerByUserId(user.id);
      
      if (!customer) {
        return NextResponse.json(
          { error: "Customer profile not found" },
          { status: 404 }
        );
      }
      
      // Apply customer filter
      query = query.eq('customer_id', customer.id);
    } else if (role === "VENDOR") {
      // Vendors can only see returns for their products
      const vendor = await getVendorByUserId(user.id);
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      // Apply vendor filter
      query = query.eq('vendor_id', vendor.id);
    } else if (role === "AGENT") {
      // Agents can only see returns they're handling
      const agent = await getAgentByUserId(user.id);
      
      if (!agent) {
        return NextResponse.json(
          { error: "Agent profile not found" },
          { status: 404 }
        );
      }
      
      // Apply agent filter
      query = query.eq('agent_id', agent.id);
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Apply final ordering and pagination
    query = query
        .order('created_at', { ascending: false })
        .range(skip, skip + limit - 1);
    
    // Execute query
    const { data: returnsData, error, count: fetchedCount } = await query;
    
    if (error) {
        console.error("Supabase error fetching returns:", error.message);
        throw error;
    }
    
    returns = returnsData;
    count = fetchedCount;
    
    return NextResponse.json({
      data: returns,
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use Supabase SSR client for session
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: any) { cookieStore.set({ name, value: "", ...options }) },
        },
      }
    );
    const { data: { user } } = await supabaseSSR.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Fetch role
    const { data: userProfile } = await supabaseSSR
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();
    if (userProfile?.role !== 'CUSTOMER') {
      return NextResponse.json({ error: "Only customers can create return requests" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Get customer profile
    const customer = await getCustomerByUserId(user.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!body.orderId || !body.productId || !body.vendorId || !body.agentId || !body.reason || !body.refundAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create return request
    const result = await createReturnRequest({
      orderId: body.orderId,
      productId: body.productId,
      customerId: customer.id,
      vendorId: body.vendorId,
      agentId: body.agentId,
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