"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { createCustomerProfile, updateCustomerProfile } from "../lib/services/customer";
import { createVendorProfile, updateVendorProfile } from "../lib/services/vendor";

/**
 * Create or update a customer profile
 */
export async function saveCustomerProfile(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const hostel = formData.get("hostel") as string;
    const room = formData.get("room") as string;
    const college = formData.get("college") as string;
    
    // Check if customer profile already exists
    const customer = await db.customer.findUnique({
      where: { userId: session.user.id },
    });
    
    if (customer) {
      // Update existing profile
      await updateCustomerProfile(customer.id, {
        phone: phone || undefined,
        address: address || undefined,
        hostel: hostel || undefined,
        room: room || undefined,
        college: college || undefined,
      });
    } else {
      // Create new profile
      await createCustomerProfile(session.user.id, {
        phone: phone || undefined,
        address: address || undefined,
        hostel: hostel || undefined,
        room: room || undefined,
        college: college || undefined,
      });
      
      // Update user role if not already a customer
      if (session.user.role !== "CUSTOMER") {
        await db.user.update({
          where: { id: session.user.id },
          data: { role: "CUSTOMER" },
        });
      }
    }
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error saving customer profile:", error);
    return { error: "Failed to save profile" };
  }
}

/**
 * Create or update a vendor profile
 */
export async function saveVendorProfile(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const storeName = formData.get("storeName") as string;
    const description = formData.get("description") as string;
    const logo = formData.get("logo") as string;
    const banner = formData.get("banner") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    
    if (!storeName) {
      return { error: "Store name is required" };
    }
    
    // Check if vendor profile already exists
    const vendor = await db.vendor.findUnique({
      where: { userId: session.user.id },
    });
    
    if (vendor) {
      // Update existing profile
      await updateVendorProfile(vendor.id, {
        storeName,
        description: description || undefined,
        logo: logo || undefined,
        banner: banner || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
      });
    } else {
      // Create new profile
      await createVendorProfile(session.user.id, {
        storeName,
        description: description || undefined,
        logo: logo || undefined,
        banner: banner || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
      });
      
      // Update user role if not already a vendor
      if (session.user.role !== "VENDOR") {
        await db.user.update({
          where: { id: session.user.id },
          data: { role: "VENDOR" },
        });
      }
    }
    
    revalidatePath("/vendor/profile");
    return { success: true };
  } catch (error) {
    console.error("Error saving vendor profile:", error);
    return { error: "Failed to save profile" };
  }
}

/**
 * Update user's basic information
 */
export async function updateUserInfo(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    
    if (!name || !email) {
      return { error: "Name and email are required" };
    }
    
    // Check if email is already in use by another user
    if (email !== session.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });
      
      if (existingUser && existingUser.id !== session.user.id) {
        return { error: "Email already in use" };
      }
    }
    
    // Update user
    await db.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating user info:", error);
    return { error: "Failed to update user information" };
  }
} 