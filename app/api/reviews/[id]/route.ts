import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { auth } from "../../../../auth";
import { updateReview, deleteReview } from "../../../../lib/services/review";
import { getCustomerByUserId } from "../../../../lib/services/customer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id;
    
    // Get review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });
    
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
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
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const reviewId = params.id;
    
    // Get review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: true,
      },
    });
    
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    // Check authorization (only admin or the customer who created the review can update)
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== review.customerId)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { rating, comment } = body;
    
    // Validate input
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    
    // Update review
    const updatedReview = await updateReview(reviewId, {
      rating,
      comment,
    });
    
    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
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
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const reviewId = params.id;
    
    // Get review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: true,
      },
    });
    
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    // Check authorization (only admin or the customer who created the review can delete)
    if (
      session.user.role !== "ADMIN" &&
      (!customer || customer.id !== review.customerId)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Delete review
    await deleteReview(reviewId);
    
    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
} 