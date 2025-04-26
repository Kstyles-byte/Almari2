import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const vendorId = searchParams.get("vendorId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause: any = {
      isPublished: true,
    };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (vendorId) {
      whereClause.vendorId = vendorId;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Get products with pagination
    const products = await db.product.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        vendor: {
          select: {
            id: true,
            storeName: true,
            logo: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            order: "asc",
          },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
    
    // Get total count for pagination
    const total = await db.product.count({
      where: whereClause,
    });
    
    return NextResponse.json({
      data: products,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is a vendor
    if (!session?.user || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const {
      name,
      description,
      price,
      comparePrice,
      categoryId,
      inventory,
      images,
    } = body;
    
    // Validation
    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }
    
    // If user is a vendor, ensure they have a vendor profile
    let vendorId: string;
    
    if (session.user.role === "VENDOR") {
      const vendor = await db.vendor.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 400 }
        );
      }
      
      vendorId = vendor.id;
    } else {
      // If admin is creating the product, they need to specify a vendor
      if (!body.vendorId) {
        return NextResponse.json(
          { error: "Vendor ID is required" },
          { status: 400 }
        );
      }
      
      const vendor = await db.vendor.findUnique({
        where: { id: body.vendorId },
      });
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 400 }
        );
      }
      
      vendorId = body.vendorId;
    }
    
    // Generate slug
    const slug = slugify(`${name}-${Date.now()}`, { lower: true });
    
    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
        categoryId,
        inventory: inventory || 0,
        isPublished: body.isPublished || false,
        vendorId,
      },
    });
    
    // Add images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      await Promise.all(
        images.map((image: { url: string; alt?: string }, index: number) =>
          db.productImage.create({
            data: {
              productId: product.id,
              url: image.url,
              alt: image.alt || product.name,
              order: index,
            },
          })
        )
      );
    }
    
    // Return created product with images
    const productWithImages = await db.product.findUnique({
      where: { id: product.id },
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
    
    return NextResponse.json(productWithImages, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 