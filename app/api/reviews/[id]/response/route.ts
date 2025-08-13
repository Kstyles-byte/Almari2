import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getVendorByUserId } from "../../../../../lib/services/vendor";
import { sendReviewResponseNotification } from "../../../../../lib/notifications/reviewNotifications";

/**
 * Create Supabase SSR client
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST(
  req: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const reviewId = params.id;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Use Supabase SSR client directly to check for active user session
    const supabase = await createSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get vendor profile
    const vendor = await getVendorByUserId(session.user.id);
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor profile not found. Only vendors can respond to reviews." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { responseText } = body;
    
    // Validate input
    if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
      return NextResponse.json(
        { error: "Response text is required" },
        { status: 400 }
      );
    }

    if (responseText.trim().length > 1000) {
      return NextResponse.json(
        { error: "Response text must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to vendor's product
    const { data: review, error: reviewError } = await supabase
      .from('Review')
      .select(`
        id,
        customer_id,
        product_id,
        Product:product_id (
          id, vendor_id, name
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const product = (review as any).Product;
    if (!product || product.vendor_id !== vendor.id) {
      return NextResponse.json(
        { error: "You can only respond to reviews for your own products" },
        { status: 403 }
      );
    }

    // Check if vendor already responded to this review
    const { data: existingResponse } = await supabase
      .from('ReviewResponse')
      .select('id')
      .eq('review_id', reviewId)
      .eq('vendor_id', vendor.id)
      .single();

    if (existingResponse) {
      return NextResponse.json(
        { error: "You have already responded to this review" },
        { status: 400 }
      );
    }

    // Create review response
    const { data: reviewResponse, error: createError } = await supabase
      .from('ReviewResponse')
      .insert({
        review_id: reviewId,
        vendor_id: vendor.id,
        response_text: responseText.trim()
      })
      .select('*')
      .single();

    if (createError) {
      console.error("[Review Response API] Error creating review response:", createError);
      return NextResponse.json(
        { error: "Failed to create review response" },
        { status: 500 }
      );
    }

    // Send notification to customer about vendor response
    try {
      await sendReviewResponseNotification(reviewId, responseText.trim(), vendor.id);
      console.log(`[Review Response API] Response notification sent for review ${reviewId}`);
    } catch (notificationError) {
      console.error('[Review Response API] Failed to send response notification:', notificationError);
      // Don't fail the response creation if notification fails
    }

    return NextResponse.json(reviewResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating review response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const reviewId = params.id;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Get review responses
    const { data: responses, error } = await supabase
      .from('ReviewResponse')
      .select(`
        *,
        Vendor:vendor_id (
          store_name,
          User:user_id (name)
        )
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("[Review Response API] Error fetching review responses:", error);
      return NextResponse.json(
        { error: "Failed to fetch review responses" },
        { status: 500 }
      );
    }

    // Format responses
    const formattedResponses = responses?.map(response => ({
      ...response,
      vendor: {
        store_name: (response as any).Vendor?.store_name,
        user: { name: (response as any).Vendor?.User?.name }
      },
      Vendor: undefined
    })) || [];

    return NextResponse.json(formattedResponses);
  } catch (error) {
    console.error("Error fetching review responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
