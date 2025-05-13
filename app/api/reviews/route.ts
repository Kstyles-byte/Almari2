import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import { auth } from "../../../auth";
// Import migrated service functions
import { createReview, getProductReviews } from "../../../lib/services/review";
import { getCustomerByUserId } from "../../../lib/services/customer";

// Initialize Supabase client (needed for product check)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use anon key for public reads

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing in environment variables for review API route.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt_desc";
    
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    // Check if product exists using Supabase
    const { data: product, error: productError } = await supabase
        .from('Product')
        .select('id') // Select minimal data
        .eq('id', productId)
        .maybeSingle(); // Check existence

    if (productError) {
        console.error("API GET Reviews - Product check error:", productError.message);
        throw new Error("Failed to verify product existence.");
    }
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Get product reviews using the migrated service function
    const reviewsResult = await getProductReviews(productId, {
      page,
      limit,
      sortBy,
    });

    if (!reviewsResult) {
        // Service function returns null on internal error
        return NextResponse.json(
            { error: "Failed to fetch reviews due to a service error." },
            { status: 500 }
        );
    }

    return NextResponse.json(reviewsResult); // Return the result object from the service
  } catch (error) {
    console.error("Error fetching reviews API:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get customer profile using migrated service
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const { productId, rating, comment } = body;
    
    // Validate input
    if (!productId || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating are required" },
        { status: 400 }
      );
    }
    
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }
    
    // Create review using migrated service
    const review = await createReview({
      customer_id: customer.id, // Use Customer primary key ID with the correct parameter name
      product_id: productId,
      rating,
      comment,
    });

    if (!review) {
        // Service function returns null on internal error
        // We need to check the potential specific error messages if they were thrown
        // For now, assume a generic service error
        return NextResponse.json(
          { error: "Failed to create review due to a service error." },
          { status: 500 }
        );
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review API:", error);

    // Handle specific errors thrown by the service function (if any were re-thrown)
    if (error instanceof Error) {
      if (
        error.message.includes("already reviewed") ||
        error.message.includes("purchased") ||
        error.message.includes("Rating must be") ||
        error.message.includes("Product not found") || // Catch service validation errors
        error.message.includes("Customer not found")
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 } // Use 400 for validation errors
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
} 