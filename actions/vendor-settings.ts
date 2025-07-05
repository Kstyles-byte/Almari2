"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActionClient } from '../lib/supabase/action';
import { uploadImage } from "../lib/cloudinary";

export async function updateStoreDetails(formData: FormData) {
  try {
    // Initialize Supabase client
    const supabase = await createActionClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized - No active session found", success: false };
    }

    // Get the vendor ID from the form data
    const vendorId = formData.get("vendorId") as string;
    const section = formData.get("section") as string | null;

    // Verify the vendor belongs to the current user
    const { data: vendorData, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('Vendor verification error:', vendorError?.message || 'Vendor not found');
      return { error: "Unauthorized - Vendor not found or doesn't belong to current user", success: false };
    }

    // Prepare the update data based on section
    let updateData: any = {};

    if (section === "store-details") {
      updateData = {
        store_name: formData.get("storeName") as string || undefined,
        description: formData.get("description") as string || undefined,
      };

      // Handle logo upload if a file is provided
      const logoFile = formData.get("logo") as File;
      if (logoFile && logoFile.size > 0 && logoFile.type.startsWith('image/')) {
        try {
          // Convert file to base64 string
          const logoBuffer = await logoFile.arrayBuffer();
          const logoBase64 = `data:${logoFile.type};base64,${Buffer.from(logoBuffer).toString('base64')}`;
          
          // Upload to Cloudinary
          const logoResult = await uploadImage(logoBase64, 'vendors/logos');
          updateData.logo_url = logoResult.url;
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          return { error: "Failed to upload logo image", success: false };
        }
      }

      // Handle banner upload if a file is provided
      const bannerFile = formData.get("banner") as File;
      if (bannerFile && bannerFile.size > 0 && bannerFile.type.startsWith('image/')) {
        try {
          // Convert file to base64 string
          const bannerBuffer = await bannerFile.arrayBuffer();
          const bannerBase64 = `data:${bannerFile.type};base64,${Buffer.from(bannerBuffer).toString('base64')}`;
          
          // Upload to Cloudinary
          const bannerResult = await uploadImage(bannerBase64, 'vendors/banners');
          updateData.banner_url = bannerResult.url;
        } catch (uploadError) {
          console.error('Banner upload error:', uploadError);
          return { error: "Failed to upload banner image", success: false };
        }
      }
    } else if (section === "payment-info") {
      updateData = {
        bank_name: formData.get("bankName") as string || undefined,
        account_number: formData.get("accountNumber") as string || undefined,
      };
    } else if (section === "security") {
      // Password changes are handled through Supabase Auth
      // Only update profile email if needed (this may require additional Supabase Auth updates)
      const newEmail = formData.get("email") as string;
      if (newEmail && newEmail !== user.email) {
        // This would need additional email verification workflows through Supabase Auth
        return { error: "Email changes are not supported in this form", success: false };
      }

      // If we decide to implement password changes, we'd use Supabase Auth update
      const currentPassword = formData.get("currentPassword") as string;
      const newPassword = formData.get("newPassword") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (newPassword || confirmPassword || currentPassword) {
        if (newPassword !== confirmPassword) {
          return { error: "New password and confirmation do not match", success: false };
        }

        if (!currentPassword) {
          return { error: "Current password is required", success: false };
        }

        // This is simplified - we would normally need to verify the current password first
        try {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: newPassword
          });

          if (passwordError) {
            return { error: `Failed to update password: ${passwordError.message}`, success: false };
          }
          
          return { success: true, message: "Password updated successfully" };
        } catch (passwordUpdateError) {
          console.error('Password update error:', passwordUpdateError);
          return { error: "Failed to update password", success: false };
        }
      }
      
      // If we get here, there was no password change requested
      return { success: true, message: "No changes to apply" };
    } else {
      return { error: "Invalid section specified", success: false };
    }

    // Update vendor profile
    const { data: updatedVendor, error: updateError } = await supabase
      .from('Vendor')
      .update(updateData)
      .eq('id', vendorId)
      .select();

    if (updateError) {
      console.error('Vendor update error:', updateError.message);
      return { error: `Failed to update vendor profile: ${updateError.message}`, success: false };
    }

    // Revalidate the page to reflect the changes
    revalidatePath("/vendor/settings");
    
    return { success: true, data: updatedVendor };
  } catch (error: any) {
    console.error("Failed to update store details:", error);
    return { error: `Error updating store details: ${error.message}`, success: false };
  }
}