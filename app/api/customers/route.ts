import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";
import { getCustomerByUserId, createCustomerProfile } from "../../../lib/services/customer";

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
    
    // Get customers
    const customers = await db.customer.findMany({
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
            orders: true,
          },
        },
      },
    });
    
    // Get total count
    const total = await db.customer.count({ where });
    
    return NextResponse.json({
      data: customers,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
    
    // Update user role to CUSTOMER if not already
    if (session.user.role !== "CUSTOMER") {
      await db.user.update({
        where: { id: session.user.id },
        data: { role: "CUSTOMER" },
      });
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