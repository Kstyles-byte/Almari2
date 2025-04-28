import NextAuth from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";

// Define UserRole enum to match Prisma schema
enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
  AGENT = "AGENT"
}

// Initialize Supabase client for the adapter
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Ensure the adapter doesn't automatically create sessions, NextAuth handles it
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    // Temporarily commented out CredentialsProvider
    /*
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // This logic needs to be replaced with Supabase auth methods
        // For now, it's commented out. User login should be handled
        // via Supabase client functions (e.g., signInWithPassword) on the frontend.

        // if (!credentials?.email || !credentials?.password) {
        //   return null;
        // }
        // // --- OLD PRISMA LOGIC ---
        // const user = await prisma.user.findUnique({
        //   where: { email: credentials.email },
        // });
        // if (!user || !user.password) {
        //   return null;
        // }
        // const isPasswordValid = await comparePassword(
        //   credentials.password as string,
        //   user.password
        // );
        // if (!isPasswordValid) {
        //   return null;
        // }
        // return {
        //   id: user.id,
        //   name: user.name,
        //   email: user.email,
        //   role: user.role, // Ensure 'role' is mapped correctly from Supabase
        // };
        return null; // Returning null as it's commented out
      },
    }),
    */
  ],
  callbacks: {
    async jwt({ token, user }) {
      // If user object exists (e.g., during sign-in), fetch role from custom table
      if (user?.id) {
        token.id = user.id; // Assign user ID to token first

        try {
          // Query your custom "User" table to get the role
          // Ensure the table name "User" matches your Supabase table exactly (case-sensitive)
          const { data: userData, error: userError } = await supabase
            .from('User') // Query the custom "User" table
            .select('role')
            .eq('id', user.id) // Match based on Supabase Auth user ID
            .single();

          if (userError) {
            console.error("Error fetching user role from 'User' table:", userError.message);
            token.role = UserRole.CUSTOMER; // Default role on error
          } else if (userData?.role) {
            token.role = userData.role as UserRole; // Assign fetched role
          } else {
            // This case might occur if a user exists in Supabase Auth but not in your custom 'User' table
            console.warn(`Role not found in 'User' table for user ID: ${user.id}. Defaulting to CUSTOMER.`);
            token.role = UserRole.CUSTOMER;
          }
        } catch (dbError) {
          console.error("Database error fetching role:", dbError);
          token.role = UserRole.CUSTOMER; // Default role on unexpected error
        }
      }
      // For subsequent requests, the role should already be in the token
      return token;
    },
    async session({ session, token }) {
      // Assign role and ID from JWT token to session object
      if (token && session.user) {
        session.user.role = token.role as UserRole; // Assign role from token
        if (token.id) {
          session.user.id = token.id as string; // Assign id from token
        }
      }
      return session;
    },
  },
}); 