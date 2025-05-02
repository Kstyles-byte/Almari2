'use server';

import { z } from 'zod';
import { auth } from '../auth';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getCustomerByUserId } from '../lib/services/customer';
import { getUserAddresses } from './profile'; // Import to potentially check existing addresses
import type { Tables } from '../types/supabase';

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in checkout actions.");
  // Handle appropriately
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// --- Validation Schema (matches the form) ---
// Separate schema for the address part for reuse/clarity
const addressSchema = z.object({
    addressLine1: z.string().min(1, "Address Line 1 is required."),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required."),
    stateProvince: z.string().min(1, "State/Province is required."),
    postalCode: z.string().min(1, "Postal Code is required."),
    country: z.string().min(1, "Country is required."),
});

const checkoutInformationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phone: z.string().optional().nullable(), // Allow optional or null
  deliveryMethod: z.enum(['pickup', 'delivery']),
  // Address fields are optional at the top level
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  stateProvince: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  saveAddress: z.string().optional().transform(val => val === 'true'), // Transform string 'true' to boolean
  selectedAddressId: z.string().optional().nullable(),
}).refine((data) => {
    // If delivery is chosen, either an existing address must be selected OR a new address must be entered
    if (data.deliveryMethod === 'delivery') {
        const hasSelectedAddress = !!data.selectedAddressId;
        // Check if all required new address fields have *some* value (basic check)
        const hasNewAddress = 
            !!data.addressLine1 && 
            !!data.city && 
            !!data.stateProvince && 
            !!data.postalCode && 
            !!data.country;
        return hasSelectedAddress || hasNewAddress;
    }
    return true; // Pickup doesn't require address validation
}, {
    message: "For delivery, please select an existing address or enter a new one.",
    path: ["selectedAddressId"], // Error path focuses on address selection
});

// --- Action State Type ---
export interface CheckoutInfoState {
    message?: string;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    success?: boolean;
}

// --- Server Action ---
export async function saveCheckoutInformation(
    prevState: CheckoutInfoState,
    formData: FormData
): Promise<CheckoutInfoState> {
    
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized", success: false };
    }
    const userId = session.user.id;

    // 1. Validate Form Data
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = checkoutInformationSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Checkout Info Validation Failed:", validatedFields.error.flatten().fieldErrors);
        return {
            error: "Invalid input. Please check the highlighted fields.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    const data = validatedFields.data;

    // 2. Save New Address if requested (Delivery + Save Address Checked + No existing selected)
    if (
        data.deliveryMethod === 'delivery' && 
        data.saveAddress && 
        !data.selectedAddressId
    ) {
        // Refine validation for the new address part specifically
        const newAddressData = {
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            stateProvince: data.stateProvince,
            postalCode: data.postalCode,
            country: data.country,
        };
        const validatedAddress = addressSchema.safeParse(newAddressData);
        
        if (!validatedAddress.success) {
            console.error("New Address Validation Failed:", validatedAddress.error.flatten().fieldErrors);
            // Merge address errors into the main fieldErrors object
            return {
                error: "Invalid new address. Please fill all required fields.",
                fieldErrors: { 
                    ...prevState.fieldErrors, // Keep previous errors if any
                    ...validatedAddress.error.flatten().fieldErrors 
                },
                success: false,
            };
        }

        try {
            // Fetch customer ID
            const customer = await getCustomerByUserId(userId);
            if (!customer) {
                throw new Error("Customer profile not found.");
            }

            // Insert new address
            const { error: insertError } = await supabase
                .from('Address')
                .insert({
                    customer_id: customer.id,
                    address_line1: validatedAddress.data.addressLine1,
                    address_line2: validatedAddress.data.addressLine2,
                    city: validatedAddress.data.city,
                    state_province: validatedAddress.data.stateProvince,
                    postal_code: validatedAddress.data.postalCode,
                    country: validatedAddress.data.country,
                    phone_number: data.phone, // Use phone from main form
                    is_default: false, // Or determine default logic
                });

            if (insertError) {
                console.error("Error saving new address:", insertError);
                throw new Error("Could not save the new address.");
            }
            
            // Revalidate paths that might show addresses
            revalidatePath('/checkout');
            revalidatePath('/account/addresses'); // Assuming an address management page exists

        } catch (error: any) {
            return {
                error: error.message || "Failed to save address.",
                success: false,
            };
        }
    }

    // 3. (Optional) Update User Profile/Contact Info?
    // You might want to update the User table or a Profile table with the
    // email/firstName/lastName/phone if they differ from existing records.
    // This depends on your application structure.
    // Example (pseudo-code):
    /*
    try {
        await supabase
            .from('User') // or 'Profile'
            .update({ 
                name: `${data.firstName} ${data.lastName}`,
                // phone: data.phone, 
                // email: data.email, // Careful updating email, might need verification
             })
            .eq('id', userId);
    } catch (updateError: any) {
        console.warn("Could not update user profile contact info:", updateError.message);
        // Decide if this is a critical error or just a warning
    }
    */

    // 4. Return Success
    // Information is validated. If delivery, address is handled (either selected or saved).
    // The actual order creation will use this validated info later.
    console.log("Checkout Information Saved/Validated Successfully for user:", userId);
    return { success: true, message: "Information saved." }; 
} 