import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import slugify from "slugify";
import { createClient } from '@supabase/supabase-js';
import type { Category } from '../../../../types/supabase';

// Initialize Supabase client (use admin/service role for all operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in categories/[id] API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const categoryId = context.params.id;
    if (!categoryId) return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    
    // Fetch category with parent, children, and product count using Supabase
    const { data: category, error } = await supabase
      .from('Category')
      .select(`
        *,
        parent:parentId (*),
        children:Category!parentId (*),
        products:Product (count)
      `)
      .eq('id', categoryId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        console.error("API GET Category - Fetch error:", error.message);
        throw error;
    }
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    // Format response to match Prisma structure if needed (especially counts)
    const formattedCategory = {
        ...category,
        _count: {
            products: (category.products as any)?.[0]?.count ?? 0,
        }
    };
    delete (formattedCategory as any).products; // Remove the raw count array

    return NextResponse.json(formattedCategory);

  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch category" },
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
    if (!categoryId) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

    const body = await request.json();
    const { name, icon, parentId } = body;
    
    // Check if category exists using Supabase
    const { data: existingCategory, error: fetchError } = await supabase
        .from('Category')
        .select('id') // Select minimal data
        .eq('id', categoryId)
        .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("API PUT Category - Fetch error:", fetchError.message);
        throw fetchError;
    }
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: Partial<Category> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
    };
    
    if (icon !== undefined) updateData.icon = icon; // Allow setting to null
    
    // Handle parent category updates
    if (parentId !== undefined) {
        updateData.parentId = parentId; // Allow setting to null
        // Check for circular reference if parentId is provided and not null
        if (parentId && parentId === categoryId) {
            return NextResponse.json(
                { error: "Category cannot be its own parent" },
                { status: 400 }
            );
        }
        // Check if parent category exists if parentId is provided and not null
        if (parentId) {
            const { data: parentCategory, error: parentCheckError } = await supabase
                .from('Category')
                .select('id', { head: true })
                .eq('id', parentId)
                .maybeSingle();

            if (parentCheckError && parentCheckError.code !== 'PGRST116') {
                console.error("API PUT Category - Parent check error:", parentCheckError.message);
                throw parentCheckError;
            }
            if (!parentCategory) {
                return NextResponse.json(
                    { error: "Parent category not found" },
                    { status: 400 }
                );
            }
        }
    }
    
    // Update slug if name is changing
    if (name) {
      const slug = slugify(name, { lower: true });
      
      // Check for slug conflicts using Supabase
      const { data: slugConflict, error: slugCheckError } = await supabase
        .from('Category')
        .select('id', { head: true })
        .eq('slug', slug)
        .neq('id', categoryId) // Exclude the current category
        .maybeSingle();

      if (slugCheckError) {
          console.error("API PUT Category - Slug check error:", slugCheckError.message);
          throw slugCheckError;
      }
      
      if (slugConflict) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
      
      updateData.name = name;
      updateData.slug = slug;
    }
    
    // Update category using Supabase
    const { data: category, error: updateError } = await supabase
      .from('Category')
      .update(updateData)
      .eq('id', categoryId)
      .select() // Select the updated category data
      .single();

     if (updateError) {
          console.error("API PUT Category - Update error:", updateError.message);
          throw updateError;
     }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
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
     if (!categoryId) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

    // Check for subcategories using Supabase
    const { count: subcategoryCount, error: subCheckError } = await supabase
      .from('Category')
      .select('*', { count: 'exact', head: true })
      .eq('parentId', categoryId);
      
     if (subCheckError) {
          console.error("API DELETE Category - Subcategory check error:", subCheckError.message);
          throw subCheckError;
     }
    
    if (subcategoryCount && subcategoryCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories" },
        { status: 400 }
      );
    }
    
    // Check for products in this category using Supabase
    const { count: productCount, error: prodCheckError } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('categoryId', categoryId);

     if (prodCheckError) {
          console.error("API DELETE Category - Product check error:", prodCheckError.message);
          throw prodCheckError;
     }
    
    if (productCount && productCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with products" },
        { status: 400 }
      );
    }
    
    // Delete category using Supabase
    const { error: deleteError } = await supabase
      .from('Category')
      .delete()
      .eq('id', categoryId);

     if (deleteError) {
          console.error("API DELETE Category - Delete error:", deleteError.message);
           // Handle potential FK constraint errors if needed (e.g., error code 23503)
          if (deleteError.code === '23503') {
               return NextResponse.json({ error: "Cannot delete category due to related data." }, { status: 400 });
          }
          throw deleteError;
     }
    
    return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 }); // Use 200 for successful DELETE with message
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 500 }
    );
  }
}
