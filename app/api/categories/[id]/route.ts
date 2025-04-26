import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";
import slugify from "slugify";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const categoryId = context.params.id;
    
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            products: true,
          }
        }
      },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
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
    
    // Only admin can update categories
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const categoryId = context.params.id;
    const body = await request.json();
    const { name, icon, parentId } = body;
    
    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: {
      icon?: string;
      parentId?: string | null;
      name?: string;
      slug?: string;
    } = {};
    
    if (icon !== undefined) updateData.icon = icon;
    
    // Handle parent category updates
    if (parentId !== undefined) {
      // Check for circular reference if parentId is provided
      if (parentId) {
        if (parentId === categoryId) {
          return NextResponse.json(
            { error: "Category cannot be its own parent" },
            { status: 400 }
          );
        }
        
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
      
      updateData.parentId = parentId;
    }
    
    // Update slug if name is changing
    if (name) {
      const slug = slugify(name, { lower: true });
      
      // Check for slug conflicts
      const slugConflict = await db.category.findFirst({
        where: {
          slug: slug,
          id: { not: categoryId },
        },
      });
      
      if (slugConflict) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
      
      updateData.name = name;
      updateData.slug = slug;
    }
    
    // Update category
    const category = await db.category.update({
      where: { id: categoryId },
      data: updateData,
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
    
    // Only admin can delete categories
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const categoryId = context.params.id;
    
    // Check for subcategories
    const subcategories = await db.category.findMany({
      where: { parentId: categoryId },
    });
    
    if (subcategories.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories" },
        { status: 400 }
      );
    }
    
    // Check for products in this category
    const products = await db.product.findFirst({
      where: { categoryId: categoryId },
    });
    
    if (products) {
      return NextResponse.json(
        { error: "Cannot delete category with products" },
        { status: 400 }
      );
    }
    
    // Delete category
    await db.category.delete({
      where: { id: categoryId },
    });
    
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 