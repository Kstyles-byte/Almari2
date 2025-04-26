"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import prisma from "../lib/server/prisma";
import { redirect } from "next/navigation";

export async function UpdateStoreDetails(formData: FormData) {
  const session = await auth();

  if (!session || session.user.role !== "VENDOR") {
    return { error: "Unauthorized" };
  }

  const vendorId = formData.get("vendorId") as string;
  const section = formData.get("section") as string | null;

  // Verify the vendor belongs to the current user
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
      userId: session.user.id,
    },
  });

  if (!vendor) {
    return { error: "Unauthorized" };
  }

  try {
    // Handle different sections of the settings form
    if (section === "social") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          instagramHandle: formData.get("instagramHandle") as string || null,
          twitterHandle: formData.get("twitterHandle") as string || null,
          facebookUrl: formData.get("facebookUrl") as string || null,
          websiteUrl: formData.get("websiteUrl") as string || null,
        },
      });
    } else if (section === "appearance") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          bannerImage: formData.get("bannerImage") as string || null,
          logoImage: formData.get("logoImage") as string || null,
          accentColor: formData.get("accentColor") as string || null,
        },
      });
    } else if (section === "policies") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          returnPolicy: formData.get("returnPolicy") as string || null,
          shippingPolicy: formData.get("shippingPolicy") as string || null,
          privacyPolicy: formData.get("privacyPolicy") as string || null,
        },
      });
    } else {
      // Basic store information
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          storeName: formData.get("storeName") as string || null,
          storeDescription: formData.get("storeDescription") as string || null,
          contactEmail: formData.get("contactEmail") as string || null,
          contactPhone: formData.get("contactPhone") as string || null,
          storeTagline: formData.get("storeTagline") as string || null,
        },
      });
    }

    // Revalidate the page to reflect the changes
    revalidatePath("/vendor/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update store details:", error);
    return { error: "Failed to update store details" };
  }
} 