import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { updateReview, deleteReview } from "../../../../lib/services/review";
import { getCustomerByUserId } from "../../../../lib/services/customer";
import { createClient } from '@supabase/supabase-js';
import type { Review } from '../../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key(s) missing in reviews/[id] API route.");
}
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id;
    if (!reviewId) return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    
    const { data: review, error } = await supabaseAnon
      .from('Review')
      .select(`
        *,
        Customer:customerId ( User:userId ( name ) ),
        Product:productId ( id, name, slug, ProductImage!ProductImage_productId_fkey (url, alt, order) )
      `)
      .eq('id', reviewId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("API GET Review - Fetch error:", error.message);
      throw error;
    }
    
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }
    
    const formattedReview = {
        ...review,
        customer: {
            user: { name: (review as any).Customer?.User?.name || null }
        },
        product: {
            id: (review as any).Product?.id,
            name: (review as any).Product?.name,
            slug: (review as any).Product?.slug,
            images: ( (review as any).Product?.ProductImage || [] ).sort((a:any, b:any) => a.order - b.order).slice(0,1)
        },
        Customer: undefined,
        Product: undefined
    };

    return NextResponse.json(formattedReview);

  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch review" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const reviewId = params.id;
    if (!reviewId) return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    
    const { data: reviewData, error: fetchError } = await supabaseAdmin
      .from('Review')
      .select('id, customerId')
      .eq('id', reviewId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API PUT Review - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!reviewData) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== reviewData.customerId)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { rating, comment } = body;
    
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    
    const updatedReview = await updateReview(reviewId, {
      rating,
      comment,
    });
    
    if (!updatedReview) {
        return NextResponse.json({ error: "Failed to update review (service error)" }, { status: 500 });
    }

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const reviewId = params.id;
    if (!reviewId) return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    
    const { data: reviewData, error: fetchError } = await supabaseAdmin
      .from('Review')
      .select('id, customerId')
      .eq('id', reviewId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API DELETE Review - Fetch error:", fetchError.message);
      throw fetchError;
    }
    
    if (!reviewData) {
        return NextResponse.json({ message: "Review already deleted or not found" }, { status: 200 });
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== reviewData.customerId)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const success = await deleteReview(reviewId);
    
    if (!success) {
        return NextResponse.json({ error: "Failed to delete review (service error)" }, { status: 500 });
    }

    return NextResponse.json({ message: "Review deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete review" },
      { status: 500 }
    );
  }
} 