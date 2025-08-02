import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { 
  getCustomerById, 
  updateCustomerProfile, 
  getCustomerOrders,
  getCustomerReviews
} from "../../../../lib/services/customer";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    
    const customerId = (await context.params).id;
    
    // Get customer
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      customer.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
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
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const customerId = (await context.params).id;
    
    // Get customer
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    
    // Check authorization (only admin or the customer owner can update)
    if (
      session.user.role !== "ADMIN" &&
      customer.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { phone, address, hostel, room, college } = body;
    
    // Update customer profile
    const updatedCustomer = await updateCustomerProfile(customerId, {
      phone,
      address,
      hostel,
      room,
      college,
    });
    
    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// Get customer's orders
export async function GET_orders(
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
    
    const customerId = context.params.id;
    
    // Check if customer exists
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      customer.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    
    // Get customer orders
    const orders = await getCustomerOrders(customerId, {
      page,
      limit,
      status: status ? status : undefined,
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer orders" },
      { status: 500 }
    );
  }
}

// Get customer's reviews
export async function GET_reviews(
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
    
    const customerId = context.params.id;
    
    // Check if customer exists
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      customer.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Get customer reviews
    const reviews = await getCustomerReviews(customerId, {
      page,
      limit,
    });
    
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer reviews" },
      { status: 500 }
    );
  }
} 