import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { 
  getVendorById, 
  updateVendorProfile, 
  approveVendor 
} from "../../../../lib/services/vendor";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    
    const vendorId = (await context.params).id;
    
    // Get vendor
    const vendor = await getVendorById(vendorId);
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      vendor.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    
    const vendorId = (await context.params).id;
    
    // Get vendor
    const vendor = await getVendorById(vendorId);
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    // Check authorization (only admin or the vendor owner can update)
    if (
      session.user.role !== "ADMIN" &&
      vendor.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      storeName,
      description,
      logo,
      banner,
      bankName,
      accountNumber,
      isApproved,
      commissionRate,
    } = body;
    
    // Prepare update data
    const updateData: {
      storeName?: string;
      description?: string;
      logo?: string;
      banner?: string;
      bankName?: string;
      accountNumber?: string;
      isApproved?: boolean;
      commissionRate?: number;
    } = {};
    
    // Fields that both admin and vendor can update
    if (storeName !== undefined) updateData.storeName = storeName;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (banner !== undefined) updateData.banner = banner;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    
    // Fields that only admin can update
    if (session.user.role === "ADMIN") {
      if (isApproved !== undefined) updateData.isApproved = isApproved;
      if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    }
    
    // Update vendor profile
    const updatedVendor = await updateVendorProfile(vendorId, updateData);
    
    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const vendorId = (await context.params).id;
    
    // Get vendor
    const vendor = await getVendorById(vendorId);
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { action, commissionRate } = body;
    
    // Handle approval action
    if (action === "approve") {
      const updatedVendor = await approveVendor(vendorId, commissionRate);
      return NextResponse.json(updatedVendor);
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing vendor action:", error);
    return NextResponse.json(
      { error: "Failed to process vendor action" },
      { status: 500 }
    );
  }
}