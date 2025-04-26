import { db } from "../db";

/**
 * Get a vendor by user ID
 * @param userId - The ID of the user
 * @returns The vendor profile or null if not found
 */
export async function getVendorByUserId(userId: string) {
  try {
    return await db.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor by user ID:", error);
    throw error;
  }
}

/**
 * Get a vendor by ID
 * @param id - The ID of the vendor
 * @returns The vendor profile or null if not found
 */
export async function getVendorById(id: string) {
  try {
    return await db.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor by ID:", error);
    throw error;
  }
}

/**
 * Create a vendor profile for a user
 * @param userId - The ID of the user
 * @param data - The vendor profile data
 * @returns The created vendor profile
 */
export async function createVendorProfile(
  userId: string,
  data: {
    storeName: string;
    description?: string;
    logo?: string;
    banner?: string;
    bankName?: string;
    accountNumber?: string;
  }
) {
  try {
    // Check if vendor profile already exists
    const existingVendor = await db.vendor.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new Error("Vendor profile already exists for this user");
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create vendor profile
    return await db.vendor.create({
      data: {
        userId,
        storeName: data.storeName,
        description: data.description,
        logo: data.logo,
        banner: data.banner,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        isApproved: false, // Requires admin approval
        commissionRate: 5, // Default commission rate (5%)
      },
    });
  } catch (error) {
    console.error("Error creating vendor profile:", error);
    throw error;
  }
}

/**
 * Update a vendor profile
 * @param id - The ID of the vendor
 * @param data - The vendor profile data to update
 * @returns The updated vendor profile
 */
export async function updateVendorProfile(
  id: string,
  data: {
    storeName?: string;
    description?: string;
    logo?: string;
    banner?: string;
    bankName?: string;
    accountNumber?: string;
  }
) {
  try {
    return await db.vendor.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    throw error;
  }
}

/**
 * Get sales dashboard data for a vendor
 * @param vendorId - The ID of the vendor
 * @returns The sales dashboard data
 */
export async function getVendorDashboard(vendorId: string) {
  try {
    // Get recent orders for this vendor
    const recentOrders = await db.orderItem.findMany({
      where: { vendorId },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            customer: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    // Get total sales
    const totalSales = await db.orderItem.aggregate({
      where: {
        vendorId,
        order: {
          paymentStatus: "COMPLETED",
        },
      },
      _sum: {
        price: true,
      },
    });

    // Get total orders
    const totalOrders = await db.orderItem.count({
      where: { vendorId },
    });

    // Get total products
    const totalProducts = await db.product.count({
      where: { vendorId },
    });

    // Get sales by status
    const salesByStatus = await db.orderItem.groupBy({
      by: ["status"],
      where: { vendorId },
      _sum: {
        price: true,
      },
      _count: true,
    });

    return {
      recentOrders,
      totalSales: totalSales._sum.price || 0,
      totalOrders,
      totalProducts,
      salesByStatus,
    };
  } catch (error) {
    console.error("Error fetching vendor dashboard:", error);
    throw error;
  }
}

/**
 * Get products for a vendor
 * @param vendorId - The ID of the vendor
 * @param params - Query parameters (page, limit, etc.)
 * @returns Products with pagination
 */
export async function getVendorProducts(
  vendorId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isPublished?: boolean;
  } = {}
) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId, 
      isPublished 
    } = params;
    
    const skip = (page - 1) * limit;
    
    // Build query filter
    const where: { 
      vendorId: string;
      OR?: Array<{ name: { contains: string, mode: "insensitive" } } | { description: { contains: string, mode: "insensitive" } }>;
      categoryId?: string;
      isPublished?: boolean;
    } = { vendorId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }
    
    // Get products
    const products = await db.product.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          take: 1,
          orderBy: { order: "asc" },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });
    
    // Get total count
    const total = await db.product.count({ where });
    
    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    throw error;
  }
}

/**
 * Approve a vendor (admin only)
 * @param id - The ID of the vendor
 * @param commissionRate - The commission rate for the vendor
 * @returns The updated vendor profile
 */
export async function approveVendor(id: string, commissionRate?: number) {
  try {
    return await db.vendor.update({
      where: { id },
      data: {
        isApproved: true,
        ...(commissionRate !== undefined && { commissionRate }),
      },
    });
  } catch (error) {
    console.error("Error approving vendor:", error);
    throw error;
  }
} 