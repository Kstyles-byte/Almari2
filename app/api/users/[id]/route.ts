import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (use service role key for admin actions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in API route /api/users/[id].");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    
    // Fetch user data including related Customer or Vendor profile
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        name,
        email,
        role,
        createdAt,
        updatedAt,
        customer:Customer (*),
        vendor:Vendor (*)
      `)
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle as user might not exist

    if (error) {
        console.error("Supabase error fetching user:", error.message);
        // Don't throw 'PGRST116' (Not Found) as we handle it below
        if (error.code !== 'PGRST116') throw error;
    }
    
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
    
    // Prepare update data for the custom User table
    const updateData: {
      name?: string;
      email?: string;
      role?: string;
      updatedAt?: string; // Add timestamp for update
    } = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Password updates should be handled via Supabase Auth flows, NOT here.
    if (password) {
      return NextResponse.json(
        { error: "Password updates must be done through dedicated auth flow." },
        { status: 400 }
      );
    }
    
    if (role && session.user.role === "ADMIN") updateData.role = role;
    
    // Update the custom User table if there's data to update
    if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date().toISOString();

        const { data: updatedUser, error: updateError } = await supabase
            .from('User')
            .update(updateData)
            .eq('id', userId)
            .select('id, name, email, role, createdAt, updatedAt'); // Select desired fields
            // Use .single() if you expect exactly one row updated

        if (updateError) {
            console.error("Supabase error updating user:", updateError.message);
            throw updateError;
        }

        // Return the updated user data from the custom table
        return NextResponse.json(updatedUser?.[0] || null);
    } else {
        // If only email/password was provided (which we disallowed), or nothing to update.
        // Fetch and return current user data?
        const { data: currentUser, error: fetchError } = await supabase
            .from('User')
            .select('id, name, email, role, createdAt, updatedAt')
            .eq('id', userId)
            .single();
        if(fetchError) throw fetchError;
        return NextResponse.json(currentUser);
    }
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
    
    // --- Deletion requires Supabase Admin privileges --- 
    // 1. Delete from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
        // Handle potential errors, e.g., user not found in Auth
        console.error("Supabase Auth delete error:", authDeleteError.message);
        // If user wasn't in Auth, maybe still try deleting from custom table?
        // Or return error depending on desired behavior.
        if (authDeleteError.message !== 'User not found') { // Allow proceeding if user wasn't in Auth
            return NextResponse.json({ error: `Auth deletion failed: ${authDeleteError.message}` }, { status: 500 });
        }
    }

    // 2. Delete from custom User table (optional - depends on foreign key constraints/triggers)
    // If you have ON DELETE CASCADE set up for userId references, this might be redundant.
    const { error: dbDeleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', userId);

    if (dbDeleteError) {
        // Log error, but maybe Auth deletion succeeded.
        console.error("Supabase DB User delete error:", dbDeleteError.message);
        // Decide if this should cause the overall request to fail.
    }
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 