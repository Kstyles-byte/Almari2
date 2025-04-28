import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getVendorByUserId, createVendorProfile } from "../../../lib/services/vendor";
import { createClient } from '@supabase/supabase-js';
import type { Vendor, UserProfile } from '../../../types/supabase';

// Initialize Supabase client (use service role key for admin GET/POST)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/vendors.");
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
    const isApproved = searchParams.get("isApproved");
    const search = searchParams.get("search");
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (isApproved !== null) {
      where.isApproved = isApproved === "true";
    }
    
    if (search) {
      where.OR = [
        {
          storeName: {
            contains: search,
            mode: "insensitive",
          },
        },
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
      ];
    }
    
    let query = supabase
        .from('Vendor')
        .select(`
            *,
            user:User ( id, name, email )
        `, { count: 'exact' });

    // Apply isApproved filter
    if (isApproved !== null) {
        query = query.eq('isApproved', isApproved === "true");
    }

    // Apply search filter (simplified: only on storeName for now)
    // Searching related user fields efficiently might require specific indexing or RPC
    if (search) {
        query = query.ilike('storeName', `%${search}%`);
    }

    // Apply ordering and pagination
    query = query
        .order('createdAt', { ascending: false })
        .range(skip, skip + limit - 1);

    // Execute query
    const { data: vendors, error, count } = await query;

    if (error) {
        console.error("Supabase error fetching vendors:", error.message);
        throw error;
    }

    return NextResponse.json({
      data: vendors,
      meta: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
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
    
    // Check if the user already has a vendor profile
    const existingVendor = await getVendorByUserId(session.user.id);
    
    if (existingVendor) {
      return NextResponse.json(
        { error: "Vendor profile already exists for this user" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { storeName, description, logo, banner, bankName, accountNumber } = body;
    
    // Validate input
    if (!storeName) {
      return NextResponse.json(
        { error: "Store name is required" },
        { status: 400 }
      );
    }
    
    // Create vendor profile
    const vendor = await createVendorProfile(session.user.id, {
      storeName,
      description,
      logo,
      banner,
      bankName,
      accountNumber,
    });

    if (!vendor) {
      // createVendorProfile service function likely threw an error caught below
      // but adding check here for clarity.
       return NextResponse.json(
        { error: "Failed to create vendor profile via service" },
        { status: 500 }
      );
    }

    // Update user role to VENDOR
    const { error: roleUpdateError } = await supabase
        .from('User')
        .update({ role: 'VENDOR', updatedAt: new Date().toISOString() })
        .eq('id', session.user.id);

    if (roleUpdateError) {
        // Log the error, but vendor profile was created.
        // Consider implications: user role didn't update.
        console.error("Failed to update user role to VENDOR:", roleUpdateError.message);
        // Potentially return a specific error or warning, but for now proceed.
    }

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor profile:", error);
    return NextResponse.json(
      { error: "Failed to create vendor profile" },
      { status: 500 }
    );
  }
} 