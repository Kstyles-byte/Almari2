import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";
import { getVendorByUserId, createVendorProfile } from "../../../lib/services/vendor";

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
    
    // Get vendors
    const vendors = await db.vendor.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    
    // Get total count
    const total = await db.vendor.count({ where });
    
    return NextResponse.json({
      data: vendors,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
    
    // Update user role to VENDOR
    await db.user.update({
      where: { id: session.user.id },
      data: { role: "VENDOR" },
    });
    
    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor profile:", error);
    return NextResponse.json(
      { error: "Failed to create vendor profile" },
      { status: 500 }
    );
  }
} 