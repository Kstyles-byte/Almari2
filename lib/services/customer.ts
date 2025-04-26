import { db } from "../db";

/**
 * Get a customer by user ID
 * @param userId - The ID of the user
 * @returns The customer profile or null if not found
 */
export async function getCustomerByUserId(userId: string) {
  try {
    return await db.customer.findUnique({
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
    console.error("Error fetching customer by user ID:", error);
    throw error;
  }
}

/**
 * Get a customer by ID
 * @param id - The ID of the customer
 * @returns The customer profile or null if not found
 */
export async function getCustomerById(id: string) {
  try {
    return await db.customer.findUnique({
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
    console.error("Error fetching customer by ID:", error);
    throw error;
  }
}

/**
 * Create a customer profile for a user
 * @param userId - The ID of the user
 * @param data - The customer profile data
 * @returns The created customer profile
 */
export async function createCustomerProfile(
  userId: string,
  data: {
    phone?: string;
    address?: string;
    hostel?: string;
    room?: string;
    college?: string;
  }
) {
  try {
    // Check if customer profile already exists
    const existingCustomer = await db.customer.findUnique({
      where: { userId },
    });

    if (existingCustomer) {
      throw new Error("Customer profile already exists for this user");
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create customer profile
    return await db.customer.create({
      data: {
        userId,
        phone: data.phone,
        address: data.address,
        hostel: data.hostel,
        room: data.room,
        college: data.college,
      },
    });
  } catch (error) {
    console.error("Error creating customer profile:", error);
    throw error;
  }
}

/**
 * Update a customer profile
 * @param id - The ID of the customer
 * @param data - The customer profile data to update
 * @returns The updated customer profile
 */
export async function updateCustomerProfile(
  id: string,
  data: {
    phone?: string;
    address?: string;
    hostel?: string;
    room?: string;
    college?: string;
  }
) {
  try {
    return await db.customer.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    throw error;
  }
}

/**
 * Get order history for a customer
 * @param customerId - The ID of the customer
 * @param params - Query parameters (page, limit, etc.)
 * @returns Orders with pagination
 */
export async function getCustomerOrders(
  customerId: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}
) {
  try {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: { customerId: string; status?: string } = { customerId };
    
    if (status) {
      where.status = status;
    }
    
    // Get orders
    const orders = await db.order.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
            vendor: {
              select: {
                id: true,
                storeName: true,
              },
            },
          },
        },
      },
    });
    
    // Get total count
    const total = await db.order.count({ where });
    
    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw error;
  }
}

/**
 * Get customer's cart
 * @param customerId - The ID of the customer
 * @returns The customer's cart with items
 */
export async function getCustomerCart(customerId: string) {
  try {
    // Find existing cart or create a new one
    let cart = await db.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: {
                    order: "asc",
                  },
                },
                vendor: {
                  select: {
                    id: true,
                    storeName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!cart) {
      cart = await db.cart.create({
        data: {
          customerId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    orderBy: {
                      order: "asc",
                    },
                  },
                  vendor: {
                    select: {
                      id: true,
                      storeName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }
    
    // Calculate cart total
    const cartTotal = cart.items.reduce(
      (sum: number, item: { quantity: number; product: { price: number | string } }) => 
        sum + (Number(item.product.price) * item.quantity),
      0
    );
    
    return {
      ...cart,
      cartTotal,
    };
  } catch (error) {
    console.error("Error fetching customer cart:", error);
    throw error;
  }
}

/**
 * Get customer's reviews
 * @param customerId - The ID of the customer
 * @param params - Query parameters (page, limit, etc.)
 * @returns Reviews with pagination
 */
export async function getCustomerReviews(
  customerId: string,
  params: {
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    
    // Get reviews
    const reviews = await db.review.findMany({
      where: { customerId },
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });
    
    // Get total count
    const total = await db.review.count({ where: { customerId } });
    
    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    throw error;
  }
} 