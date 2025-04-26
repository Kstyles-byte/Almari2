import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";

export async function GET() {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get customer ID from user ID
    const customer = await db.customer.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    // Get cart for customer or create one if it doesn't exist
    let cart = await db.cart.findUnique({
      where: { customerId: customer.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: {
                    order: "asc",
                  },
                  take: 1,
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
        },
      },
    });
    
    if (!cart) {
      cart = await db.cart.create({
        data: {
          customerId: customer.id,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: {
                      order: "asc",
                    },
                    take: 1,
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
          },
        },
      });
    }
    
    // Calculate totals
    const cartTotal = cart.items.reduce(
      (sum: number, item: { quantity: number; product: { price: number } }) => {
        return sum + (item.quantity * Number(item.product.price));
      },
      0
    );
    
    return NextResponse.json({
      ...cart,
      cartTotal,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
} 