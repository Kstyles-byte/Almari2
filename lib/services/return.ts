import { db } from "../db";
import { processAutomatedRefund } from "./refund";
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in environment variables for return service.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Define types based on the Database type
type Return = Database['public']['Tables']['Return']['Row'];
type Order = Database['public']['Tables']['Order']['Row'];
type Customer = Database['public']['Tables']['Customer']['Row'];
type Product = Database['public']['Tables']['Product']['Row'];
type Vendor = Database['public']['Tables']['Vendor']['Row'];
type Agent = Database['public']['Tables']['Agent']['Row'];

// Define ReturnStatus and RefundStatus enums based on schema.sql
type ReturnStatus = Return['status'];
type RefundStatus = Return['refund_status'];
type PickupStatus = Order['pickup_status'];

/**
 * Create a new return request
 */
export async function createReturnRequest(data: {
  orderId: string;
  productId: string;
  customerId: string;
  vendorId: string;
  agentId: string;
  reason: string;
  refundAmount: number;
}) {
  try {
    // Verify that the order was picked up within the last 24 hours
    // Schema uses 'pickup_status' and 'actual_pickup_date' (not 'pickup_date')
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('pickup_status, actual_pickup_date')
      .eq('id', data.orderId)
      .maybeSingle();
    
    if (orderError) {
      console.error("Error fetching order for return check:", orderError.message);
      return { error: "Failed to fetch order details" };
    }
    if (!order) {
      return { error: "Order not found" };
    }
    
    if (order.pickup_status !== 'PICKED_UP') {
      return { error: "Order has not been picked up yet" };
    }
    
    if (!order.actual_pickup_date) {
      return { error: "Pickup date not recorded" };
    }
    
    const pickupDate = new Date(order.actual_pickup_date);
    const currentDate = new Date();
    const hoursSincePickup = (currentDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSincePickup > 24) {
      return { error: "Return request must be made within 24 hours of pickup" };
    }
    
    // Create return request - align with DB column names (snake_case)
    const { data: returnRequest, error: insertError } = await supabase
      .from('Return')
      .insert({
        order_id: data.orderId,
        product_id: data.productId,
        customer_id: data.customerId,
        vendor_id: data.vendorId,
        agent_id: data.agentId,
        reason: data.reason,
        refund_amount: data.refundAmount,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating return request in DB:", insertError.message);
      return { error: `Failed to create return request: ${insertError.message}` };
    }

    return { success: true, returnRequest: returnRequest as Return };
  } catch (error) {
    console.error("Error creating return request:", error);
    return { error: "Failed to create return request" };
  }
}

/**
 * Get return by ID
 */
export async function getReturnById(returnId: string) {
  try {
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        order: true,
        product: true,
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        vendor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        agent: true,
      },
    });
    
    return returnData;
  } catch (error) {
    console.error("Error fetching return by ID:", error);
    return null;
  }
}

/**
 * Get returns by customer
 */
export async function getCustomerReturns(customerId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    // Start building the query
    let query = supabase
      .from('Return')
      .select(`
        *,
        Order:order_id (*),
        Product:product_id (*),
        Vendor:vendor_id (id, store_name),
        Agent:agent_id (id, name, city, state_province)
      `, { count: 'exact' })
      .eq('customer_id', customerId);
    
    // Apply status filter if provided
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    // Apply pagination
    query = query.order('created_at', { ascending: false })
                .range(skip, skip + limit - 1);
    
    // Execute the query
    const { data: returnsData, error, count } = await query;
    
    if (error) {
      console.error("Error fetching customer returns from Supabase:", error.message);
      throw error;
    }
    
    // Format the data to match the expected structure
    const returns = returnsData?.map((returnItem: any) => {
      return {
        ...returnItem,
        orderId: returnItem.order_id,
        productId: returnItem.product_id,
        customerId: returnItem.customer_id,
        vendorId: returnItem.vendor_id,
        agentId: returnItem.agent_id,
        createdAt: returnItem.created_at,
        updatedAt: returnItem.updated_at,
        // Make sure nested objects match the expected structure
        order: returnItem.Order,
        product: returnItem.Product,
        vendor: returnItem.Vendor,
        agent: returnItem.Agent
      };
    }) || [];
    
    return {
      data: returns,
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching customer returns:", error);
    return {
      data: [],
      meta: {
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 10,
        pageCount: 0,
      },
    };
  }
}

/**
 * Get returns by vendor
 */
export async function getVendorReturns(vendorId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { vendorId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    const returns = await db.return.findMany({
      where,
      include: {
        order: true,
        product: true,
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.return.count({ where });
    
    return {
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching vendor returns:", error);
    return {
      data: [],
      meta: {
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 10,
        pageCount: 0,
      },
    };
  }
}

/**
 * Get returns by agent
 */
export async function getAgentReturns(agentId: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where: any = { agentId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    const returns = await db.return.findMany({
      where,
      include: {
        order: true,
        product: true,
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    const total = await db.return.count({ where });
    
    return {
      data: returns,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching agent returns:", error);
    return {
      data: [],
      meta: {
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 10,
        pageCount: 0,
      },
    };
  }
}

/**
 * Approve return request
 */
export async function approveReturnRequest(returnId: string) {
  try {
    const returnData = await db.return.update({
      where: { id: returnId },
      data: {
        status: "APPROVED",
        processDate: new Date(),
      },
    });
    
    return { success: true, return: returnData };
  } catch (error) {
    console.error("Error approving return request:", error);
    return { error: "Failed to approve return request" };
  }
}

/**
 * Reject return request
 */
export async function rejectReturnRequest(returnId: string, reason: string) {
  try {
    const returnData = await db.return.update({
      where: { id: returnId },
      data: {
        status: "REJECTED",
        refundStatus: "REJECTED",
        reason: `REJECTED: ${reason}`,
        processDate: new Date(),
      },
    });
    
    return { success: true, return: returnData };
  } catch (error) {
    console.error("Error rejecting return request:", error);
    return { error: "Failed to reject return request" };
  }
}

/**
 * Complete return process
 */
export async function completeReturnProcess(returnId: string) {
  try {
    // Get return data
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        product: true,
      },
    });
    
    if (!returnData) {
      return { error: "Return not found" };
    }
    
    if (returnData.status !== "APPROVED") {
      return { error: "Return must be approved before completing" };
    }
    
    // Update product inventory (increase by 1)
    await db.product.update({
      where: { id: returnData.productId },
      data: {
        inventory: { increment: 1 },
      },
    });
    
    // Update return status
    const updatedReturn = await db.return.update({
      where: { id: returnId },
      data: {
        status: "COMPLETED",
      },
    });
    
    // Process automated refund through Paystack
    const refundResult = await processAutomatedRefund(returnId);
    
    if (refundResult.error) {
      console.error("Error processing refund:", refundResult.error);
      // We still mark the return as completed even if the refund fails
      // The refund can be retried separately
    }
    
    return { success: true, return: updatedReturn };
  } catch (error) {
    console.error("Error completing return process:", error);
    return { error: "Failed to complete return process" };
  }
}

/**
 * Process refund
 */
export async function processRefund(returnId: string) {
  try {
    // Use the new automated refund system
    const refundResult = await processAutomatedRefund(returnId);
    
    if (refundResult.error) {
      return { error: refundResult.error };
    }
    
    return { 
      success: true, 
      return: refundResult.refundData,
      message: refundResult.message
    };
  } catch (error) {
    console.error("Error processing refund:", error);
    return { error: "Failed to process refund" };
  }
}

/**
 * Get all returns (Admin function)
 */
export async function getAllReturns(options?: {
  page?: number;
  limit?: number;
  status?: ReturnStatus;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let queryBuilder = supabase
      .from('Return')
      .select(`
        *,
        Order:order_id (*),
        Product:product_id (*),
        Customer:customer_id (*, User:user_id (name, email)),
        Vendor:vendor_id (*, User:user_id (name, email)),
        Agent:agent_id (id, name, city, state_province, address_line1, postal_code, country)
      `, { count: 'exact' });

    // Apply status filter
    if (options?.status) {
      queryBuilder = queryBuilder.eq('status', options.status);
    }

    // Apply ordering and pagination
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    // Execute query
    const { data: returns, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching all returns:", error.message);
      throw error;
    }

    // Format the data to match the expected structure
    const formattedReturns = returns?.map((returnItem: any) => {
      return {
        ...returnItem,
        orderId: returnItem.order_id,
        productId: returnItem.product_id,
        customerId: returnItem.customer_id,
        vendorId: returnItem.vendor_id,
        agentId: returnItem.agent_id,
        createdAt: returnItem.created_at,
        updatedAt: returnItem.updated_at,
        refundAmount: returnItem.refund_amount,
        refundStatus: returnItem.refund_status,
        processDate: returnItem.process_date,
        // Make sure nested objects match the expected structure
        order: returnItem.Order,
        product: returnItem.Product,
        customer: returnItem.Customer,
        vendor: returnItem.Vendor,
        agent: returnItem.Agent
      };
    }) || [];

    return {
      data: formattedReturns,
      meta: {
        total: count ?? 0,
        page,
        limit,
        pageCount: Math.ceil((count ?? 0) / limit),
      },
    };

  } catch (error) {
    console.error("Error in getAllReturns service:", error);
    // Return default structure on error
    return {
      data: [],
      meta: {
        total: 0,
        page: options?.page || 1,
        limit: options?.limit || 10,
        pageCount: 0,
      },
    };
  }
} 