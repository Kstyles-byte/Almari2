"use server";

import { signIn, signOut } from "../auth";
import { AuthError } from "next-auth";
import prisma from "../lib/server/prisma";
import { hashPassword } from "../lib/server/password";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from '../lib/supabase/server'

// Validation schemas
const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ResetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
  // Add confirm password if needed on the frontend, validation done here on single field
});

/**
 * Sign in a user with email and password
 */
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Validate form data
  const validatedFields = SignInSchema.safeParse({ email, password });
  
  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      issues: validatedFields.error.issues,
    };
  }
  
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    
    // Check if it's a credentials error
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return { error: "Invalid credentials" };
    }
    
    return { error: "Something went wrong" };
  }
}

/**
 * Sign up a new user
 */
export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Validate form data
  const validatedFields = SignUpSchema.safeParse({ name, email, password });
  
  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      issues: validatedFields.error.issues,
    };
  }
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return { error: "Email already in use" };
    }
    
    // Hash password using our server-only utility
    const hashedPassword = await hashPassword(password);
    
    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });
    
    // Auto sign in after successful registration
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "Failed to register user" };
  }
}

/**
 * Sign out the current user
 */
export async function logout() {
  try {
    await signOut({ redirectTo: "/" });
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// Modified function for Supabase sign-in, accepting validated data
export async function signInWithSupabase(values: z.infer<typeof SignInSchema>) {
  // Validation is already done by react-hook-form on the client,
  // but it's good practice to re-validate on the server.
  const validatedFields = SignInSchema.safeParse(values);

  if (!validatedFields.success) {
    // This case might not be reached if client-side validation is robust,
    // but it's here as a safeguard. Redirect or return an error.
    console.error("Server-side validation failed:", validatedFields.error);
    return redirect('/login?message=Invalid form data submitted');
  }

  const { email, password } = validatedFields.data;

  // createClient reads env variables, no args needed
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Supabase Sign In Error:", error);
    // Redirecting back to login with an error query param
    // You might want a more user-friendly error message handling strategy
    return redirect(`/login?message=Could not authenticate user: ${error.message}`)
  }

  // Redirect to a protected page, e.g., dashboard
  return redirect('/dashboard') // Adjust the target route as needed
}

// New function for Supabase sign-up
export async function signUpWithSupabase(values: z.infer<typeof SignUpSchema>) {
  // Server-side validation
  const validatedFields = SignUpSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Server-side validation failed:", validatedFields.error);
    // Redirect back to sign-up with an error message
    return redirect('/signup?message=Invalid form data submitted');
  }

  const { name, email, password } = validatedFields.data;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      // emailRedirectTo is not needed if email confirmation is off
    },
  });

  if (error) {
    console.error("Supabase Sign Up Error:", error);
    return redirect(`/signup?message=Could not register user: ${error.message}`);
  }

  // Since email confirmation is disabled, the user is active immediately.
  // Redirect directly to the dashboard or a logged-in area.
  // Note: The session might take a moment to propagate fully.
  // Consider adding a small delay or a loading indicator on the target page
  // if the user initially appears logged out.
  console.log('Sign up successful, redirecting to dashboard.');
  return redirect('/dashboard'); // Redirect to dashboard after sign up

  /* 
  // Old logic for when email confirmation was enabled:
  if (data.user && !data.user.email_confirmed_at) {
    return redirect('/login?message=Registration successful! Please check your email to verify your account.');
  } 
  return redirect('/login?message=Registration successful! You can now log in.');
  */
}

// New function for Supabase sign-out
export async function signOutWithSupabase() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    // Optionally redirect to an error page or handle differently
    // For now, we still redirect to home even if sign-out fails server-side
    // as the client-side session might be cleared anyway.
  }
  
  // Redirect to the homepage after sign-out
  return redirect('/');
}

// Action to request password reset email
export async function requestPasswordReset(values: z.infer<typeof ForgotPasswordSchema>) {
  const validatedFields = ForgotPasswordSchema.safeParse(values);
  if (!validatedFields.success) {
    return redirect('/forgot-password?message=Invalid email submitted');
  }

  const { email } = validatedFields.data;
  const supabase = createClient();

  // Get the base URL for the redirect
  // Make sure NEXT_PUBLIC_BASE_URL is set in your .env.local
  const redirectUrl = process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm?next=/reset-password` : '/auth/confirm?next=/reset-password';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: redirectUrl, // URL user is redirected to after clicking email link
  });

  if (error) {
    console.error("Password Reset Request Error:", error);
    // Show generic message even on error to prevent email enumeration
    return redirect('/forgot-password?message=If an account exists for this email, a password reset link has been sent.');
  }

  // Show success message
  return redirect('/forgot-password?message=If an account exists for this email, a password reset link has been sent.');
}

// Action to update the user's password
export async function resetPassword(values: z.infer<typeof ResetPasswordSchema>) {
  const validatedFields = ResetPasswordSchema.safeParse(values);
  if (!validatedFields.success) {
     // Redirect back to reset page with an error
     // Note: The URL might not have query params if the user navigated away and back
     return redirect('/reset-password?message=Invalid password format');
  }

  const { password } = validatedFields.data;
  const supabase = createClient(); // Use server client

  // updateUser can only be called from a server component or action
  // when the user is authenticated (in this case, via the reset token link)
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Password Reset Error:", error);
    return redirect(`/reset-password?message=Failed to reset password: ${error.message}`);
  }

  // Redirect to login page with success message
  return redirect('/login?message=Password reset successfully. You can now log in.');
} 