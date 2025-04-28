import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { auth } from "../../../../auth";
import slugify from "slugify";
import { getVendorByUserId } from "../../../../lib/services/vendor";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Key(s) are missing in environment variables for product [id] API route.");
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const productId = context.params.id;
    if (!productId) {
        return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Fetch product with relations using Supabase (anon client for public read)
    const { data: product, error } = await supabaseAnon
      .from('Product')
      .select(`
        *,
        Vendor ( id, storeName, logo, description ),
        Category ( * ),
        ProductImage ( * ),
        Review ( rating )
      `)
      .eq('id', productId)
      .eq('isPublished', true) // Ensure only published products are fetched publicly
      .maybeSingle(); // Use maybeSingle as product might not exist or be published

    if (error) {
        console.error(`Error fetching product ${productId} API:`, error.message);
        // Don't throw for not found (PGRST116), let the check below handle it
        if (error.code !== 'PGRST116') throw error;
    }
    
    if (!product) {
      return NextResponse.json({ error: "Product not found or not published" }, { status: 404 });
    }

    // Calculate average rating (reviews are already fetched partially)
    const reviews = product.Review || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
      : 0;
    
    // Structure the response, mapping relations if needed
    const responseData = {
      ...product,
      ProductImage: (product.ProductImage || []).sort((a:any, b:any) => a.order - b.order), // Sort images
      avgRating: parseFloat(avgRating.toFixed(1)),
    };
    delete (responseData as any).Review; // Remove raw review data

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const productId = context.params.id;
    if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    // Check auth
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get current product to check ownership (use Admin client for potentially unpublished)
    const { data: currentProduct, error: fetchErr } = await supabaseAdmin
        .from('Product')
        .select('id, vendorId, name') // Select necessary fields
        .eq('id', productId)
        .single();

     if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return NextResponse.json({ error: "Product not found" }, { status: 404 });
        console.error("API PUT: Error fetching product", fetchErr.message);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
     }
     if (!currentProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Authorization check
    if (session.user.role !== "ADMIN") {
        const vendor = await getVendorByUserId(session.user.id); // Use migrated service
        if (!vendor || currentProduct.vendorId !== vendor.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }
    
    const body = await request.json();
    const { name, description, price, comparePrice, categoryId, inventory, isPublished, images } = body;

    // Prepare update data (add validation if needed)
    const updateData: any = { updatedAt: new Date().toISOString() };
    
    if (name !== undefined) {
      updateData.name = name;
        updateData.slug = slugify(`${name}-${Date.now()}`, { lower: true, strict: true });
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    updateData.comparePrice = comparePrice === undefined ? undefined : (comparePrice === null ? null : parseFloat(comparePrice));
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (inventory !== undefined) updateData.inventory = parseInt(inventory, 10);
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    
    // Update product (use Admin client)
    const { data: updatedProdData, error: updateError } = await supabaseAdmin
      .from('Product')
      .update(updateData)
      .eq('id', productId)
      .select('id, name') // Select minimal data needed
      .single();

     if (updateError || !updatedProdData) {
        console.error("API PUT: Error updating product", updateError?.message);
        return NextResponse.json({ error: `Failed to update product: ${updateError?.message}` }, { status: 500 });
     }
    
    // Handle images update if provided
    if (images && Array.isArray(images)) {
       const { error: deleteImgErr } = await supabaseAdmin
            .from('ProductImage')
            .delete()
            .eq('productId', productId);
       if (deleteImgErr) console.error("API PUT: Error deleting images", deleteImgErr.message);

      if (images.length > 0) {
         const imageInserts = images.map((image: { url: string; alt?: string }, index: number) => ({
             productId: productId,
                url: image.url,
             alt: image.alt || updatedProdData.name,
                order: index,
           }));
         const { error: insertImgErr } = await supabaseAdmin.from('ProductImage').insert(imageInserts);
         if (insertImgErr) console.error("API PUT: Error inserting images", insertImgErr.message);
       }
    }

    // Fetch and return updated product with images
    const { data: finalProduct, error: finalFetchErr } = await supabaseAdmin
        .from('Product')
        .select(`*, ProductImage(*), Category(*), Vendor(id, storeName)`)
        .eq('id', productId)
        .single();

     if (finalFetchErr || !finalProduct) {
        console.error("API PUT: Error fetching final product", finalFetchErr?.message);
        return NextResponse.json({ message: "Product updated, but failed to fetch final details", productId }, { status: 200 });
     }

    return NextResponse.json(finalProduct);

  } catch (error: any) {
    console.error("Error in PUT /api/products/[id]:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const productId = context.params.id;
    if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    // Check auth
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get product to check ownership (use Admin client)
    const { data: currentProduct, error: fetchErr } = await supabaseAdmin
        .from('Product')
        .select('id, vendorId') // Select necessary fields
        .eq('id', productId)
        .single();

     if (fetchErr) {
        if (fetchErr.code === 'PGRST116') return NextResponse.json({ error: "Product not found" }, { status: 404 });
        console.error("API DELETE: Error fetching product", fetchErr.message);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
     }
     if (!currentProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Authorization check
    if (session.user.role !== "ADMIN") {
        const vendor = await getVendorByUserId(session.user.id); // Use migrated service
        if (!vendor || currentProduct.vendorId !== vendor.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    // Check constraints (CartItem, OrderItem) before deleting
    const { data: cartItemCheck } = await supabaseAdmin.from('CartItem').select('id', { head: true }).eq('productId', productId).limit(1);
    if (cartItemCheck) return NextResponse.json({ error: "Cannot delete: Product exists in a cart" }, { status: 400 });

    const { data: orderItemCheck } = await supabaseAdmin.from('OrderItem').select('id', { head: true }).eq('productId', productId).limit(1);
    if (orderItemCheck) return NextResponse.json({ error: "Cannot delete: Product exists in an order" }, { status: 400 });

    // Delete product (use Admin client)
    // Assuming ON DELETE CASCADE is set for ProductImage, Review in Supabase DB
    const { error: deleteError } = await supabaseAdmin
      .from('Product')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error("API DELETE: Error deleting product", deleteError.message);
      return NextResponse.json({ error: `Failed to delete product: ${deleteError.message}` }, { status: 500 });
    }

    // Invalidate relevant caches if needed (not directly possible in Route Handlers like Server Actions)

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 }); // Use 200 or 204

  } catch (error: any) {
    console.error("Error in DELETE /api/products/[id]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
} 