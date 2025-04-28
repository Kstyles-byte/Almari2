import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (use service role key for admin access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/users.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  try {
    const session = await auth();
    
    // Only admin can list all users
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch users from the public.User table using Supabase
    const { data: users, error } = await supabase
      .from('User') // Ensure this matches your table name
      .select('id, name, email, role, createdAt, updatedAt');

    if (error) {
      console.error("Supabase error fetching users:", error.message);
      throw error; // Throw error to be caught by the catch block
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Remove the POST handler - User creation should be handled via Supabase Auth client-side signup
// or a dedicated admin endpoint using supabase.auth.admin.createUser if needed. 