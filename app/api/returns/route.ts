import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";
import { getCustomerByUserId } from "../../../lib/services/customer";
import { createReturnRequest } from "../../../lib/services/return";

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
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const skip = (page - 1) * limit;
    
    let returns;
    let total = 0;
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (session.user.role === "ADMIN") {
      // Admin can see all returns
      returns = await db.return.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: true,
          product: true,
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
          vendor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          agent: true,
        },
      });
      
      total = await db.return.count({ where });
    } else if (session.user.role === "CUSTOMER") {
      // Customers can only see their own returns
      const customer = await getCustomerByUserId(session.user.id);
      
      if (!customer) {
        return NextResponse.json(
          { error: "Customer profile not found" },
          { status: 404 }
        );
      }
      
      where.customerId = customer.id;
      
      returns = await db.return.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: true,
          product: true,
          vendor: {
            select: {
              id: true,
              storeName: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });
      
      total = await db.return.count({ where });
    } else if (session.user.role === "VENDOR") {
      // Vendors can only see returns for their products
      const vendor = await db.vendor.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      where.vendorId = vendor.id;
      
      returns = await db.return.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: true,
          product: true,
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
          agent: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });
      
      total = await db.return.count({ where });
    } else if (session.user.role === "AGENT") {
      // Agents can only see returns they're handling
      const agent = await db.agent.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!agent) {
        return NextResponse.json(
          { error: "Agent profile not found" },
          { status: 404 }
        );
      }
      
      where.agentId = agent.id;
      
      returns = await db.return.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: true,
          product: true,
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
          vendor: {
            select: {
              id: true,
              storeName: true,
            },
          },
        },
      });
      
      total = await db.return.count({ where });
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
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
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Only customers can create return requests
    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Only customers can create return requests" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
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