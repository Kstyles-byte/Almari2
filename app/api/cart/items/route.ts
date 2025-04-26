import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";

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
    
    const body = await req.json();
    const { productId, quantity } = body;
    
    // Validate input
    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Product ID and quantity are required" },
        { status: 400 }
      );
    }
    
    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }
    
    // Check if product exists and is published
    const product = await db.product.findUnique({
      where: {
        id: productId,
        isPublished: true,
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found or not available" },
        { status: 404 }
      );
    }
    
    // Check if product has enough inventory
    if (product.inventory < quantity) {
      return NextResponse.json(
        { error: "Not enough inventory available" },
        { status: 400 }
      );
    }
    
    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { customerId: customer.id },
    });
    
    if (!cart) {
      cart = await db.cart.create({
        data: {
          customerId: customer.id,
        },
      });
    }
    
    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });
    
    let cartItem;
    
    if (existingItem) {
      // Update existing item
      cartItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: quantity,
        },
        include: {
          product: {
            include: {
              images: {
                orderBy: {
                  order: "asc",
                },
                take: 1,
              },
            },
          },
        },
      });
    } else {
      // Create new item
      cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
        include: {
          product: {
            include: {
              images: {
                orderBy: {
                  order: "asc",
                },
                take: 1,
              },
            },
          },
        },
      });
    }
    
    // Get updated cart with all items
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
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
    
    // Calculate totals
    const cartTotal = updatedCart ? updatedCart.items.reduce(
      (sum: number, item: { quantity: number; product: { price: number } }) => {
        return sum + (item.quantity * Number(item.product.price));
      },
      0
    ) : 0;
    
    return NextResponse.json({
      item: cartItem,
      cart: updatedCart ? {
        ...updatedCart,
        cartTotal,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    
    // Get cart
    const cart = await db.cart.findUnique({
      where: { customerId: customer.id },
    });
    
    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }
    
    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");
    
    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }
    
    // Check if item exists in the cart
    const cartItem = await db.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }
    
    // Delete cart item
    await db.cartItem.delete({
      where: { id: itemId },
    });
    
    // Get updated cart with all items
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
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
    
    // Calculate totals
    const cartTotal = updatedCart ? updatedCart.items.reduce(
      (sum: number, item: { quantity: number; product: { price: number } }) => {
        return sum + (item.quantity * Number(item.product.price));
      },
      0
    ) : 0;
    
    return NextResponse.json({
      cart: updatedCart ? {
        ...updatedCart,
        cartTotal,
      } : null,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
} 