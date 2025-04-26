import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { auth } from "../../../auth";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const parentId = searchParams.get("parentId");
    
    const whereClause = parentId 
      ? { parentId: parentId } 
      : { parentId: null }; // Get root categories if no parentId
    
    const categories = await db.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          }
        },
        _count: {
          select: {
            products: true,
          }
        }
      },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only admin can create categories
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { name, icon, parentId } = body;
    
    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    
    // Generate slug
    const slug = slugify(name, { lower: true });
    
    // Check if category with the same slug exists
    const existingCategory = await db.category.findUnique({
      where: { slug },
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }
    
    // Check if parent category exists if parentId is provided
    if (parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: parentId },
      });
      
      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }
    }
    
    // Create category
    const category = await db.category.create({
      data: {
        name,
        slug,
        icon,
        parentId,
      },
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
} 