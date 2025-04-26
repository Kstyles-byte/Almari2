"use server";

import { signIn, signOut } from "../auth";
import { AuthError } from "next-auth";
import prisma from "../lib/server/prisma";
import { hashPassword } from "../lib/server/password";
import { redirect } from "next/navigation";
import { z } from "zod";

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