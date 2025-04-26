import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";
import slugify from "slugify";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const productId = context.params.id;
    
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            id: true,
            storeName: true,
            logo: true,
            description: true,
          },
        },
        category: true,
        images: {
          orderBy: {
            order: "asc",
          },
        },
        reviews: {
          take: 5,
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
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Calculate average rating
    const reviews = await db.review.findMany({
      where: { productId },
      select: { rating: true },
    });
    
    const avgRating = reviews.length
      ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
      : 0;
    
    return NextResponse.json({
      ...product,
      avgRating,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const productId = context.params.id;
    
    // Get product to check ownership
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to update the product
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // If user is not an admin, check if they own the product
    if (
      session.user.role !== "ADMIN" &&
      (session.user.role !== "VENDOR" || product.vendor.userId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      description,
      price,
      comparePrice,
      categoryId,
      inventory,
      isPublished,
      images,
    } = body;
    
    // Prepare update data
    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      comparePrice?: number | null;
      categoryId?: string;
      inventory?: number;
      isPublished?: boolean;
    } = {};
    
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = slugify(`${name}-${Date.now()}`, { lower: true });
    }
    
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (comparePrice !== undefined) updateData.comparePrice = parseFloat(comparePrice);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (inventory !== undefined) updateData.inventory = inventory;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    
    // Update product
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
    });
    
    // Handle images update if provided
    if (images && Array.isArray(images)) {
      // Delete existing images first
      await db.productImage.deleteMany({
        where: { productId },
      });
      
      // Add new images
      if (images.length > 0) {
        await Promise.all(
          images.map((image: { url: string; alt?: string }, index: number) =>
            db.productImage.create({
              data: {
                productId,
                url: image.url,
                alt: image.alt || updatedProduct.name,
                order: index,
              },
            })
          )
        );
      }
    }
    
    // Return updated product with images
    const productWithImages = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        vendor: {
          select: {
            id: true,
            storeName: true,
          },
        },
      },
    });
    
    return NextResponse.json(productWithImages);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const productId = context.params.id;
    
    // Get product to check ownership
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to delete the product
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // If user is not an admin, check if they own the product
    if (
      session.user.role !== "ADMIN" &&
      (session.user.role !== "VENDOR" || product.vendor.userId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if product is in any cart or order
    const cartItem = await db.cartItem.findFirst({
      where: { productId },
    });
    
    if (cartItem) {
      return NextResponse.json(
        { error: "Cannot delete product as it exists in a cart" },
        { status: 400 }
      );
    }
    
    const orderItem = await db.orderItem.findFirst({
      where: { productId },
    });
    
    if (orderItem) {
      return NextResponse.json(
        { error: "Cannot delete product as it exists in an order" },
        { status: 400 }
      );
    }
    
    // Delete product images first
    await db.productImage.deleteMany({
      where: { productId },
    });
    
    // Delete product reviews
    await db.review.deleteMany({
      where: { productId },
    });
    
    // Delete product
    await db.product.delete({
      where: { id: productId },
    });
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 