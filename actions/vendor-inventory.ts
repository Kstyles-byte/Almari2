"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import prisma from "../lib/server/prisma";

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
    // Verify product belongs to this vendor
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        vendorId: true,
      },
    });

    const vendor = await prisma.vendor.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!product || !vendor || product.vendorId !== vendor.id) {
      return { error: "Product not found or not authorized" };
    }

    // Update the product inventory
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        inventory,
      },
    });

    // Create an inventory transaction record
    await prisma.inventoryTransaction.create({
      data: {
        productId,
        previousQuantity: product.inventory || 0,
        newQuantity: inventory,
        type: "MANUAL_ADJUSTMENT",
        userId: session.user.id,
        note: "Manual inventory update",
      },
    });

    revalidatePath("/vendor/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to update inventory:", error);
    return { error: "Failed to update inventory" };
  }
} 