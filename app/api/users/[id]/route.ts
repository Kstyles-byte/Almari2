import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/server/prisma";
import { auth } from "../../../../auth";
import { hashPassword } from "../../../../lib/server/password";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = context.params.id;
    
    // Users can only fetch their own data unless they are an admin
    if (
      !session?.user ||
      (session.user.id !== userId && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            phone: true,
            address: true,
            hostel: true,
            room: true,
            college: true,
          },
        },
        vendor: {
          select: {
            id: true,
            storeName: true,
            description: true,
            logo: true,
            banner: true,
            isApproved: true,
            commissionRate: true,
            bankName: true,
            accountNumber: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const userId = context.params.id;
    
    // Users can only update their own data unless they are an admin
    if (
      !session?.user ||
      (session.user.id !== userId && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, email, password, role } = body;
    
    // Only admin can change roles
    if (role && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can change user roles" },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    } = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Handle password update with dynamic import
    if (password) {
      updateData.password = await hashPassword(password);
    }
    
    if (role && session.user.role === "ADMIN") updateData.role = role;
    
    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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
    const userId = context.params.id;
    
    // Users can only delete their own account unless they are an admin
    if (
      !session?.user ||
      (session.user.id !== userId && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 