import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";
import { initializePayment } from "../../../lib/paystack";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    let orders;
    let total = 0;
    
    if (session.user.role === "ADMIN") {
      // Admin can see all orders
      orders = await db.order.findMany({
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  storeName: true,
                },
              },
            },
          },
        },
      });
      
      total = await db.order.count();
    } else if (session.user.role === "VENDOR") {
      // Vendor can see orders containing their products
      const vendor = await db.vendor.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      const orderItems = await db.orderItem.findMany({
        where: { vendorId: vendor.id },
        select: { orderId: true },
        distinct: ["orderId"],
      });
      
      const orderIds = orderItems.map((item: { orderId: string }) => item.orderId);
      
      orders = await db.order.findMany({
        where: { id: { in: orderIds } },
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          items: {
            where: { vendorId: vendor.id },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      });
      
      total = await db.orderItem.groupBy({
        by: ["orderId"],
        where: { vendorId: vendor.id },
        _count: true,
      }).then((result: any[]) => result.length);
    } else {
      // Customer can see their own orders
      const customer = await db.customer.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: "Customer profile not found" },
          { status: 404 }
        );
      }
      
      orders = await db.order.findMany({
        where: { customerId: customer.id },
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  storeName: true,
                },
              },
            },
          },
        },
      });
      
      total = await db.order.count({
        where: { customerId: customer.id },
      });
    }
    
    return NextResponse.json({
      data: orders,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is a customer
    if (!session?.user || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const customer = await db.customer.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const { shippingAddress } = body;
    
    // Validate shipping address
    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }
    
    // Get cart items
    const cart = await db.cart.findUnique({
      where: { customerId: customer.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }
    
    // Check inventory for all items
    for (const item of cart.items) {
      if (item.product.inventory < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough inventory for product: ${item.product.name}`,
            productId: item.product.id,
          },
          { status: 400 }
        );
      }
    }
    
    // Calculate total
    const total = cart.items.reduce(
      (sum: number, item: { quantity: number; product: { price: number } }) => {
        return sum + (item.quantity * Number(item.product.price));
      },
      0
    );
    
    // Create order
    const order = await db.order.create({
      data: {
        customerId: customer.id,
        total,
        shippingAddress,
        paymentStatus: "PENDING",
        status: "PENDING",
      },
    });
    
    // Create order items
    const orderItems = [];
    
    for (const item of cart.items) {
      const orderItem = await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          vendorId: item.product.vendorId,
          quantity: item.quantity,
          price: Number(item.product.price),
          status: "PENDING",
        },
      });
      
      orderItems.push(orderItem);
    }
    
    // Initialize payment with Paystack
    const paymentResponse = await initializePayment({
      email: session.user.email as string,
      amount: Math.round(total * 100), // Convert to kobo (smallest currency unit)
      metadata: {
        orderId: order.id,
        customerId: customer.id,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/checkout/complete?orderId=${order.id}`,
    });
    
    // Clear cart after successful order
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    
    return NextResponse.json({
      order: {
        ...order,
        items: orderItems,
      },
      payment: {
        reference: paymentResponse.data.reference,
        authorizationUrl: paymentResponse.data.authorization_url,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
} 