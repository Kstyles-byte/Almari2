import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";
import { verifyPayment } from "../../../../lib/paystack";

export async function GET(
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
    
    const orderId = context.params.id;
    
    // Get order with details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            phone: true,
            address: true,
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
                slug: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: {
                    order: "asc",
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
        },
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (session.user.role === "CUSTOMER") {
      const customer = await db.customer.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!customer || customer.id !== order.customerId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role === "VENDOR") {
      const vendor = await db.vendor.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      // Check if vendor has items in this order
      const vendorItems = order.items.filter((item: { vendor: { id: string } }) => item.vendor.id === vendor.id);
      
      if (vendorItems.length === 0) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Filter items to only show vendor's items
      order.items = vendorItems;
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const orderId = context.params.id;
    const body = await request.json();
    
    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Check authorization based on role
    if (session.user.role === "CUSTOMER") {
      const customer = await db.customer.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!customer || customer.id !== order.customerId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      // Customers can only cancel orders
      if (body.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Customers can only cancel orders" },
          { status: 403 }
        );
      }
      
      // Can only cancel pending orders
      if (order.status !== "PENDING") {
        return NextResponse.json(
          { error: "Can only cancel pending orders" },
          { status: 400 }
        );
      }
    } else if (session.user.role === "VENDOR") {
      const vendor = await db.vendor.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      // Vendors can only update their own items
      if (body.itemId) {
        const orderItem = await db.orderItem.findFirst({
          where: {
            id: body.itemId,
            orderId: orderId,
            vendorId: vendor.id,
          },
        });
        
        if (!orderItem) {
          return NextResponse.json(
            { error: "Order item not found or not authorized" },
            { status: 404 }
          );
        }
        
        // Update order item status
        await db.orderItem.update({
          where: { id: body.itemId },
          data: {
            status: body.status,
          },
        });
        
        // Check if all items have the same status
        const itemsWithStatus = await db.orderItem.groupBy({
          by: ["status"],
          where: { orderId },
          _count: true,
        });
        
        // If all items have the same status, update the order status
        if (itemsWithStatus.length === 1) {
          await db.order.update({
            where: { id: orderId },
            data: {
              status: body.status,
            },
          });
        }
        
        const updatedOrder = await db.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
          },
        });
        
        return NextResponse.json(updatedOrder);
      } else {
        return NextResponse.json(
          { error: "Item ID is required for vendor updates" },
          { status: 400 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Admin can update order status
    if (body.status) {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: body.status,
        },
      });
      
      // Update all order items to match the order status
      await db.orderItem.updateMany({
        where: { orderId },
        data: {
          status: body.status,
        },
      });
    }
    
    // Admin can update payment status
    if (body.paymentStatus) {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: body.paymentStatus,
        },
      });
    }
    
    // Verify payment if reference is provided
    if (body.paymentReference) {
      try {
        const paymentVerification = await verifyPayment(body.paymentReference);
        
        if (paymentVerification.data.status === "success") {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "COMPLETED",
              paymentReference: body.paymentReference,
            },
          });
        } else {
          await db.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "FAILED",
              paymentReference: body.paymentReference,
            },
          });
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
          { error: "Failed to verify payment" },
          { status: 500 }
        );
      }
    }
    
    const updatedOrder = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 