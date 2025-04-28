import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { auth } from "../../../auth";
import slugify from "slugify";
import { getVendorByUserId } from "../../../lib/services/vendor";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use anon key for public GET, service key might be needed for POST if RLS isn't fully open
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // For POST

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Key(s) are missing in environment variables for product API route.");
}

// Use anon key for GET, service key for POST (adjust based on RLS)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const vendorId = searchParams.get("vendorId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    // Start query builder (use anon client for public reads)
    let query = supabaseAnon
      .from('Product') // Ensure table name matches
      .select(`
        *,
        Vendor!inner ( id, storeName, logo ),
        Category!inner ( id, name, slug ),
        ProductImage!inner ( url, alt, order ),
        Review ( count )
      `, { count: 'exact' }) // Fetch count for pagination
      .eq('isPublished', true); // Filter only published

    // Apply filters
    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }
    if (vendorId) {
      query = query.eq('vendorId', vendorId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    query = query.order('createdAt', { ascending: false })
                 .range(rangeFrom, rangeTo);

    // Execute query
    const { data: products, error, count } = await query;

    if (error) {
      console.error("Error fetching products API:", error.message);
      throw error;
    }

     // Format results - adjust based on actual Supabase response structure
     const formattedProducts = products?.map(p => ({
        ...(p as any), // Spread base product fields
        vendor: p.Vendor, // Rename/map if needed
        category: p.Category, // Rename/map if needed
        images: (p.ProductImage || []).sort((a:any, b:any) => a.order - b.order).slice(0, 1), // Ensure sort and take 1
        _count: {
            reviews: (p.Review as any)?.[0]?.count ?? 0,
        }
     })) || [];


    return NextResponse.json({
      data: formattedProducts,
      meta: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    });

  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); // Uses Supabase adapter now

    // Check auth
    if (!session?.user || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, price, comparePrice, categoryId, inventory, images, vendorId: vendorIdFromAdmin // Renamed for clarity
    } = body;

    // Basic Validation
    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
     // Add more validation as needed (e.g., types, ranges)


    // Check if category exists (use Admin client for potentially restricted tables)
    const { data: category, error: catError } = await supabaseAdmin
        .from('Category')
        .select('id')
        .eq('id', categoryId)
        .maybeSingle();

    if (catError) { throw new Error(`Category check failed: ${catError.message}`); }
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    // Determine Vendor ID based on role
    let actualVendorId: string;
    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id); // Use migrated service
      if (!vendor) {
        return NextResponse.json({ error: "Vendor profile not found" }, { status: 400 });
      }
      actualVendorId = vendor.id;
    } else { // ADMIN creating product
      if (!vendorIdFromAdmin) {
        return NextResponse.json({ error: "Admin must specify vendorId" }, { status: 400 });
      }
       // Verify admin-provided vendorId exists (implement getVendorById in service if needed)
       // const { data: adminVendor } = await supabaseAdmin.from('Vendor').select('id').eq('id', vendorIdFromAdmin).maybeSingle();
       // if (!adminVendor) return NextResponse.json({ error: "Specified Vendor not found" }, { status: 400 });
      actualVendorId = vendorIdFromAdmin;
    }

    // Generate slug
    const slug = slugify(`${name}-${Date.now()}`, { lower: true, strict: true });

    // Create product (use Admin client for inserts)
    const { data: newProduct, error: insertError } = await supabaseAdmin
      .from('Product')
      .insert({
        name, slug, description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        categoryId,
        inventory: inventory || 0,
        isPublished: body.isPublished || false,
        vendorId: actualVendorId,
      })
      .select('id, name') // Select needed fields
      .single();

    if (insertError || !newProduct) {
        console.error("API Error creating product:", insertError?.message);
        return NextResponse.json({ error: `Failed to create product: ${insertError?.message}` }, { status: 500 });
    }

    // Add images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imageInserts = images.map((image: { url: string; alt?: string }, index: number) => ({
          productId: newProduct.id,
          url: image.url,
          alt: image.alt || newProduct.name,
          order: index,
        }));

       const { error: imageInsertError } = await supabaseAdmin
            .from('ProductImage')
            .insert(imageInserts);

       if (imageInsertError) {
           console.error("API Error adding product images:", imageInsertError.message);
           // Log but maybe don't fail the whole request?
       }
    }

    // Fetch the final created product with necessary relations for response
    const { data: productWithDetails, error: finalFetchError } = await supabaseAdmin // Or Anon if public read is ok
      .from('Product')
      .select(`
          *,
          ProductImage ( url, alt, order ),
          Category ( * ),
          Vendor ( id, storeName )
      `)
      .eq('id', newProduct.id)
      .single();

    if (finalFetchError || !productWithDetails) {
         console.error("API Error fetching created product details:", finalFetchError?.message);
         // Return the basic product ID if the detailed fetch fails?
         return NextResponse.json({ message:"Product created, but failed to fetch full details", productId: newProduct.id }, { status: 201 });
    }

    return NextResponse.json(productWithDetails, { status: 201 });

  } catch (error: any) {
    console.error("Error in POST /api/products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
} 