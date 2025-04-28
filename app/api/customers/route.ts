import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getCustomerByUserId, createCustomerProfile } from "../../../lib/services/customer";
import { createClient } from '@supabase/supabase-js';
import type { Customer, UserProfile } from '../../../types/supabase';

// Initialize Supabase client (use service role key for admin GET/POST)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/customers.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: {
      OR?: Array<{
        user?: { 
          name?: { contains: string; mode: "insensitive" }; 
          email?: { contains: string; mode: "insensitive" }; 
        };
        phone?: { contains: string; mode: "insensitive" };
      }>;
    } = {};
    
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }
    
    let query = supabase
        .from('Customer')
        .select(`
            *,
            user:User ( id, name, email )
        `, { count: 'exact' });

    // Apply search filter
    if (search) {
        // Use .or() to search across multiple fields
        // Searching related user fields like this might require adjustments based on RLS
        query = query.or(`phone.ilike.%${search}%,user.name.ilike.%${search}%,user.email.ilike.%${search}%`);
    }

    // Apply ordering and pagination
    query = query
        .order('createdAt', { ascending: false })
        .range(skip, skip + limit - 1);

    // Execute query
    const { data: customers, error, count } = await query;

    if (error) {
        console.error("Supabase error fetching customers:", error.message);
        throw error;
    }

    // Note: Prisma _count on relations (orders) is omitted.

    return NextResponse.json({
      data: customers,
      meta: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the user already has a customer profile
    const existingCustomer = await getCustomerByUserId(session.user.id);
    
    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer profile already exists for this user" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { phone, address, hostel, room, college } = body;
    
    // Create customer profile
    const customer = await createCustomerProfile(session.user.id, {
      phone,
      address,
      hostel,
      room,
      college,
    });
    
    if (!customer) {
       return NextResponse.json(
        { error: "Failed to create customer profile via service" },
        { status: 500 }
      );
    }

    // Update user role to CUSTOMER if not already
    if (session.user.role !== "CUSTOMER") {
      const { error: roleUpdateError } = await supabase
        .from('User')
        .update({ role: 'CUSTOMER', updatedAt: new Date().toISOString() })
        .eq('id', session.user.id);

        if (roleUpdateError) {
            // Log error but proceed, as customer profile was created.
            console.error("Failed to update user role to CUSTOMER:", roleUpdateError.message);
        }
    }
    
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer profile:", error);
    return NextResponse.json(
      { error: "Failed to create customer profile" },
      { status: 500 }
    );
  }
}