"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createServerActionClient } from "../lib/supabase/server";
import { Database } from "@/types/supabase";
import crypto from 'crypto'; // Import built-in crypto module

// Schema for vendor application details
const VendorApplicationSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit account number"),
  whatsappPhone: z.string().min(10, "WhatsApp phone number is required (10+ digits)").regex(/^[+]?[0-9]{10,15}$/, "Enter a valid WhatsApp phone number"),
  // Add other fields like logo/banner later if needed via separate actions/uploads
});

export async function applyForVendor(values: z.infer<typeof VendorApplicationSchema>) {
  console.log('[Action] applyForVendor called with:', values);
  const supabase = await createServerActionClient();

  // 1. Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[Action] Auth Error:', authError);
    // Redirect to login if not authenticated
    return redirect('/login?message=Authentication required to apply');
  }
  console.log(`[Action] User authenticated: ${user.id}`);

  // 2. Validate input data
  const validatedFields = VendorApplicationSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error('[Action] Validation Error:', validatedFields.error.flatten());
    // How to return error to form? Server Actions limitations...
    // Redirecting back is not ideal here. Need client-side handling or state.
    // For now, we'll log and potentially throw or return generic error.
    // Consider using react-hook-form's `setError` on the client after action returns.
    return {
      error: "Invalid fields submitted.",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }
  console.log('[Action] Validation successful.');
  const { storeName, description, bankName, accountNumber, whatsappPhone } = validatedFields.data;

  // 3. Check if user already has a vendor application/profile
  const { data: existingVendor, error: checkError } = await supabase
    .from('Vendor')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (checkError) {
    console.error('[Action] Error checking existing vendor:', checkError);
    return { error: "Database error checking vendor status." };
  }

  if (existingVendor) {
    console.log(`[Action] User ${user.id} already has a vendor profile.`);
    return { error: "You already have a pending or approved vendor application." };
  }

  // 4. Prepare Vendor data (Use crypto.randomUUID for the vendor profile ID)
  const vendorId = crypto.randomUUID(); 
  const vendorData: Database['public']['Tables']['Vendor']['Insert'] = {
    id: vendorId, // Assign the generated UUID
    user_id: user.id,
    store_name: storeName,
    description: description || null,
    is_approved: false, // Application starts as not approved
    commission_rate: 5, // Set a default commission rate, admin can change
    bank_name: bankName,
    account_number: accountNumber,
    whatsapp_phone: whatsappPhone,
    // logo and banner might be added later
  };

  // 5. Insert into Vendor table
  console.log('[Action] Inserting vendor application...');
  const { error: insertError } = await supabase.from('Vendor').insert(vendorData);

  if (insertError) {
    console.error('[Action] Error inserting vendor application:', insertError);
    // Handle potential DB errors (e.g., unique constraint violation - though unlikely with generated ID)
    return { error: "Failed to submit application. Please try again." };
  }

  console.log(`[Action] Vendor application submitted successfully for user ${user.id} with vendor ID ${vendorId}`);

  // Notify admin about the new application
  try {
    const { notifyNewVendorApplication } = await import('../lib/notifications/adminNotifications');
    await notifyNewVendorApplication(vendorId);
    console.log(`[Action] Admin notified about new vendor application: ${vendorId}`);
  } catch (notificationError) {
    console.error('[Action] Error sending vendor application notification:', notificationError);
    // Don't fail the application process due to notification errors
  }

  // 6. Redirect to a success/pending page or dashboard
  // Option 1: Redirect
  // redirect('/account/application-pending'); 
  
  // Option 2: Return success object for client-side handling
  return { success: true, message: "Application submitted! You will be notified upon review." };
} 