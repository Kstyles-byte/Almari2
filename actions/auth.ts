"use server";

import { signIn, signOut } from "../auth";
import { AuthError } from "next-auth";
import prisma from "../lib/server/prisma";
import { hashPassword } from "../lib/server/password";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerActionClient } from '../lib/supabase/server';
import { cookies } from 'next/headers';
import { Database } from "@/types/supabase";
import crypto from 'crypto';

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

// Schema for combined Vendor SignUp
const VendorSignUpSchema = SignUpSchema.extend({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit account number"),
});

// Schema for Agent SignUp (Agent accounts manage pickup locations)
const AgentSignUpSchema = SignUpSchema.extend({
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
  addressLine1: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  stateProvince: z.string().min(2, "State/Province is required"),
  postalCode: z.string().min(3, "Postal code is required"),
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
export async function signInWithSupabase(
  values: z.infer<typeof SignInSchema>, 
  callbackUrl?: string
) {
  console.log('[Action] signInWithSupabase called with:', values);
  console.log('[Action] Callback URL:', callbackUrl);
  
  // Validation is already done by react-hook-form on the client,
  // but it's good practice to re-validate on the server.
  console.log('[Action] Validating fields server-side...');
  const validatedFields = SignInSchema.safeParse(values);

  if (!validatedFields.success) {
    // This case might not be reached if client-side validation is robust,
    // but it's here as a safeguard. Redirect or return an error.
    console.error("[Action] Server-side validation failed:", validatedFields.error.flatten());
    console.log('[Action] Redirecting to /login due to validation failure...');
    return redirect('/login?message=Invalid form data submitted');
  }
  console.log('[Action] Server-side validation successful.');

  const { email, password } = validatedFields.data;
  console.log(`[Action] Attempting Supabase sign-in for email: ${email}`);

  // Use the new server action client which handles cookies
  const supabase = await createServerActionClient(); 
  console.log('[Action] Supabase server action client created.');

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[Action] Supabase Sign In Error:", error);
    const errorMessage = error.message || 'Unknown error';
    console.log(`[Action] Redirecting to /login due to Supabase error: ${errorMessage}`);
    // Redirecting back to login with an error query param
    return redirect(`/login?message=Could not authenticate user: ${errorMessage}`)
  }

  console.log('[Action] Supabase sign-in successful.');
  
  // Get the user role to determine where to redirect
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // This shouldn't happen as we just signed in, but just in case
    return redirect('/login?message=Authentication error: User not found after login');
  }
  
  // Get the user role from the User table
  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (userError) {
    console.error("[Action] Error fetching user role:", userError);
    // Default to customer dashboard if role can't be determined
    return redirect(callbackUrl || '/customer');
  }
  
  // Determine redirect based on user role
  const role = userData?.role?.toLowerCase() || 'customer';
  console.log(`[Action] User ${user.email} has role ${role}, redirecting...`);
  
  // If a callback URL was provided, use that instead of role-based redirect
  if (callbackUrl) {
    return redirect(callbackUrl);
  }
  
  // Otherwise redirect based on role
  if (role === 'admin') {
    return redirect('/admin');
  } else if (role === 'vendor') {
    return redirect('/vendor/dashboard');
  } else if (role === 'agent') {
    return redirect('/agent/dashboard');
  } else {
    // Default to customer dashboard
    return redirect('/customer/dashboard');
  }
}

// New function for Supabase sign-up
export async function signUpWithSupabase(values: z.infer<typeof SignUpSchema>, callbackUrl?: string) {
  // Server-side validation
  const validatedFields = SignUpSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Server-side validation failed:", validatedFields.error);
    // Redirect back to sign-up with an error message
    return redirect('/signup?message=Invalid form data submitted');
  }

  const { name, email, password } = validatedFields.data;
  // Use the new server action client which handles cookies
  const supabase = await createServerActionClient(); 

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

  // Since email confirmation is disabled, the user should be active immediately
  // Get the user role - for new signups this should be 'customer' by default
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // This shouldn't happen as we just signed up, but just in case
    return redirect('/login?message=Registration successful! Please sign in to continue.');
  }
  
  // Redirect to the customer dashboard after signup
  return redirect(callbackUrl || '/customer/dashboard');
}

// New function for Supabase sign-out
export async function signOutWithSupabase() {
  // Use the new server action client which handles cookies
  const supabase = await createServerActionClient(); 
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
  // Use the new server action client which handles cookies
  const supabase = await createServerActionClient(); 

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
  // Use the new server action client which handles cookies
  const supabase = await createServerActionClient(); 

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

// New function for combined Vendor Sign-up
export async function signUpAsVendor(values: z.infer<typeof VendorSignUpSchema>) {
  console.log('[Action] signUpAsVendor called with:', values);
  const supabase = await createServerActionClient();

  // 1. Validate combined input data
  const validatedFields = VendorSignUpSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("[Action] Vendor Sign Up Validation Failed:", validatedFields.error.flatten());
    // Redirect back to the vendor signup form with a general error
    // More specific errors would ideally be handled client-side via return values
    return redirect('/signup/vendor?message=Invalid details provided.');
  }
  console.log('[Action] Vendor sign up validation successful.');

  const { name, email, password, storeName, description, bankName, accountNumber } = validatedFields.data;

  // 2. Sign up the user via Supabase Auth
  console.log(`[Action] Attempting Supabase Auth signup for vendor: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name, // This goes to raw_user_meta_data for the trigger
      },
    },
  });

  if (signUpError) {
    console.error("[Action] Supabase Auth Sign Up Error:", signUpError);
    // Redirect back with a Supabase-specific error or a general one
    return redirect(`/signup/vendor?message=Signup failed: ${signUpError.message}`);
  }

  // Check if user object exists (it should if no error, but good practice)
  if (!signUpData.user) {
     console.error("[Action] Supabase Auth Sign Up Error: User object missing after signup.");
     return redirect('/signup/vendor?message=Signup failed: Could not create user.');
  }
  console.log(`[Action] Supabase Auth user created successfully: ${signUpData.user.id}`);

  // 3. Insert Vendor details into the public.Vendor table
  const userId = signUpData.user.id;

  // Use crypto.randomUUID() for the vendor profile ID
  const vendorId = crypto.randomUUID(); 

  const vendorData: Database['public']['Tables']['Vendor']['Insert'] = {
    id: vendorId, // Assign the generated UUID
    user_id: userId, // Corrected field name
    store_name: storeName, // Corrected field name
    description: description || null,
    is_approved: false, // Corrected field name
    commission_rate: 10, // Corrected field name
    bank_name: bankName, // Corrected field name
    account_number: accountNumber, // Corrected field name
  };

  console.log(`[Action] Inserting Vendor profile for user ${userId}...`);
  const { error: insertVendorError } = await supabase.from('Vendor').insert(vendorData);

  if (insertVendorError) {
    console.error("[Action] Error inserting Vendor profile:", insertVendorError);
    // This is tricky. User is created in Auth, but profile failed.
    // Options: Attempt delete auth user? Log for manual cleanup? Alert user?
    // For now, redirect with error indicating partial failure.
    return redirect(`/login?message=Signup complete, but vendor profile creation failed. Please contact support.`);
  }
  console.log(`[Action] Vendor profile created successfully: ${vendorId}`);

  // Optionally: Update the role in public.User table immediately?
  // Or leave it as CUSTOMER until admin approval?
  // Let's leave it as CUSTOMER, consistent with Flow 1 (pending approval)
  // const { error: updateRoleError } = await supabase
  //   .from('User')
  //   .update({ role: 'VENDOR' })
  //   .eq('id', userId);
  // if (updateRoleError) { ... handle error ... }

  // 4. Redirect user (e.g., to login page with success/pending message)
  console.log('[Action] Vendor signup process complete.');
  return redirect('/login?message=Signup successful! Your vendor application is pending review.');
}

/**
 * Sign up a new Agent user and create the associated Agent profile.
 * The function:
 * 1. Registers a new Supabase Auth user with email/password.
 * 2. Updates the role in public.User to 'AGENT'.
 * 3. Inserts a row into public.Agent with provided profile details.
 * 4. Redirects the user to the agent dashboard on success.
 */
export async function signUpAsAgent(values: z.infer<typeof AgentSignUpSchema>) {
  console.log('[Action] signUpAsAgent called with:', values);
  const supabase = await createServerActionClient();

  // 1. Validate combined input data
  const validatedFields = AgentSignUpSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error('[Action] Agent Sign Up Validation Failed:', validatedFields.error.flatten());
    return redirect('/signup/agent?message=Invalid+details+provided');
  }

  const { name, email, password, phoneNumber, addressLine1, city, stateProvince, postalCode } = validatedFields.data;

  // 2. Sign up the user via Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (signUpError) {
    console.error('[Action] Supabase Auth Sign Up Error (Agent):', signUpError);
    return redirect(`/signup/agent?message=Signup+failed:+${encodeURIComponent(signUpError.message)}`);
  }

  if (!signUpData.user) {
    console.error('[Action] No user returned from Supabase after agent signup.');
    return redirect('/signup/agent?message=Signup+failed:+User+not+created');
  }

  const userId = signUpData.user.id;

  // 3. Update role in public.User to AGENT
  const { error: roleUpdateError } = await supabase
    .from('User')
    .update({ role: 'AGENT' })
    .eq('id', userId);

  if (roleUpdateError) {
    console.error('[Action] Error updating user role to AGENT:', roleUpdateError);
    // Continue, but log error; user might still access dashboard if role not propagated immediately
  }

  // 4. Insert Agent profile
  const agentId = crypto.randomUUID();
  const agentData: Database['public']['Tables']['Agent']['Insert'] = {
    id: agentId,
    user_id: userId,
    name,
    email,
    phone_number: phoneNumber,
    address_line1: addressLine1,
    city,
    state_province: stateProvince,
    postal_code: postalCode,
    country: 'Nigeria',
    operating_hours: '9am - 5pm',
    capacity: 50,
    is_active: true,
  } as any; // Casting to any to satisfy potential missing optional fields

  const { error: insertAgentError } = await supabase.from('Agent').insert(agentData);

  if (insertAgentError) {
    console.error('[Action] Error inserting Agent profile:', insertAgentError);
    return redirect('/login?message=Signup+complete,+but+agent+profile+creation+failed.+Please+contact+support');
  }

  console.log('[Action] Agent signup process complete. Redirecting to dashboard.');
  return redirect('/agent/dashboard');
} 