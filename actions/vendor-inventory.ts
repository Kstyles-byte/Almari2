"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { createServerActionClient } from '../lib/supabase/server';

export async function UpdateInventory(formData: FormData) {
  const session = await auth();

  if (!session || session.user.role !== "VENDOR") {
    return { error: "Unauthorized" };
  }

  const productId = formData.get("productId") as string;
  const inventory = parseInt(formData.get("inventory") as string, 10);

  if (isNaN(inventory) || inventory < 0) {
    return { error: "Invalid inventory value" };
  }

  try {
    const supabase = await createServerActionClient();

    // Verify product belongs to this vendor
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('vendor_id, inventory')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return { error: "Product not found" };
    }

    const { data: vendor, error: vendorError } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (vendorError || !vendor || product.vendor_id !== vendor.id) {
      return { error: "Product not found or not authorized" };
    }

    // Update the product inventory
    const { error: updateError } = await supabase
      .from('Product')
      .update({ inventory })
      .eq('id', productId);

    if (updateError) {
      throw updateError;
    }

    // Create an inventory transaction record (if you have this table in Supabase)
    const { error: transactionError } = await supabase
      .from('InventoryTransaction')
      .insert({
        product_id: productId,
        previous_quantity: product.inventory || 0,
        new_quantity: inventory,
        type: "MANUAL_ADJUSTMENT",
        user_id: session.user.id,
        note: "Manual inventory update",
      });

    if (transactionError) {
      console.error("Failed to create inventory transaction:", transactionError);
      // Don't fail the whole operation if transaction logging fails
    }

    revalidatePath("/vendor/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to update inventory:", error);
    return { error: "Failed to update inventory" };
  }
} 