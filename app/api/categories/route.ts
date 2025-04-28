import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import slugify from "slugify";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (use service role key for POST)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/categories.");
}
// Use ANON key for public GET requests, Service Role for POST/admin actions
const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const parentId = searchParams.get("parentId");
    
    let query = supabaseAnon
      .from('Category')
      .select('id, name, slug, icon, parentId, createdAt, updatedAt'); // Omitting children/product count for now

    if (parentId) {
      query = query.eq('parentId', parentId);
    } else {
      query = query.is('parentId', null);
    }

    const { data: categories, error } = await query;

    if (error) {
        console.error("Supabase error fetching categories:", error.message);
        throw error;
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch categories" },
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
    const { data: existingCategory, error: slugCheckError } = await supabaseAdmin
      .from('Category')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (slugCheckError) {
        console.error("Supabase error checking slug:", slugCheckError.message);
        throw slugCheckError;
    }
    
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }
    
    // Check if parent category exists if parentId is provided
    if (parentId) {
      const { data: parentCategory, error: parentCheckError } = await supabaseAdmin
        .from('Category')
        .select('id')
        .eq('id', parentId)
        .maybeSingle();

      if (parentCheckError && parentCheckError.code !== 'PGRST116') { // Ignore not found
          console.error("Supabase error checking parent category:", parentCheckError.message);
          throw parentCheckError;
      }

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }
    }
    
    // Create category
    const { data: category, error: insertError } = await supabaseAdmin
      .from('Category')
      .insert({
        name,
        slug,
        icon,
        parentId,
      })
      .select() // Select the newly created category
      .single();

    if (insertError) {
        console.error("Supabase error creating category:", insertError.message);
        // Handle potential duplicate slug error (code 23505) if needed, though checked above
        throw insertError;
    }
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    );
  }
} 