"use server";

import { auth } from "../auth";
import { db } from "../lib/db";
import { revalidatePath } from "next/cache";
import { getCustomerByUserId } from "../lib/services/customer";
import { initializePayment, verifyPayment } from "../lib/paystack";
import { findNearestAgent, generatePickupCode } from "../lib/services/agent";
import { createOrderStatusNotification } from "../lib/services/notification";

/**
 * Create a new order
 */
export async function createOrder(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Get customer profile
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return { error: "Customer profile not found" };
    }
    
    const shippingAddress = formData.get("shippingAddress") as string;
    
    // Validate shipping address
    if (!shippingAddress) {
      return { error: "Shipping address is required" };
    }
    
    // Get cart items
    const cart = await db.cart.findUnique({
      where: { customerId: customer.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!cart || cart.items.length === 0) {
      return { error: "Cart is empty" };
    }
    
    // Check inventory for all items
    for (const item of cart.items) {
      if (item.product.inventory < item.quantity) {
        return {
          error: `Not enough inventory for product: ${item.product.name}`,
          productId: item.product.id,
        };
      }
    }
    
    // Calculate total
    const total = cart.items.reduce(
      (sum: number, item: { quantity: number; product: { price: number | string } }) => {
        return sum + (item.quantity * Number(item.product.price));
      },
      0
    );
    
    // Find nearest agent
    const agent = await findNearestAgent(shippingAddress);
    
    if (!agent) {
      return { error: "No available agent found for your location" };
    }
    
    // Create order
    const order = await db.order.create({
      data: {
        customerId: customer.id,
        agentId: agent.id,
        total,
        shippingAddress,
        paymentStatus: "PENDING",
        status: "PENDING",
        pickupStatus: "PENDING",
      },
    });
    
    // Create order items
    const orderItems = [];
    
    for (const item of cart.items) {
      const orderItem = await db.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          vendorId: item.product.vendorId,
          quantity: item.quantity,
          price: Number(item.product.price),
          status: "PENDING",
        },
      });
      
      orderItems.push(orderItem);
    }
    
    // Initialize payment with Paystack
    const paymentResponse = await initializePayment({
      email: session.user.email as string,
      amount: Math.round(total * 100), // Convert to kobo (smallest currency unit)
      metadata: {
        orderId: order.id,
        customerId: customer.id,
        agentId: agent.id,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/checkout/complete?orderId=${order.id}`,
    });
    
    // Clear cart after successful order
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    
    revalidatePath("/cart");
    revalidatePath("/customer/orders");
    
    return {
      success: true,
      order: {
        id: order.id,
        total,
        agent: {
          name: agent.name,
          location: agent.location,
        },
      },
      payment: {
        reference: paymentResponse.data.reference,
        authorizationUrl: paymentResponse.data.authorization_url,
      },
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { error: "Failed to create order" };
  }
}

/**
 * Verify an order payment
 */
export async function verifyOrderPayment(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderId = formData.get("orderId") as string;
    const paymentReference = formData.get("paymentReference") as string;
    
    if (!orderId || !paymentReference) {
      return { error: "Order ID and payment reference are required" };
    }
    
    // Get the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    // Verify payment with Paystack
    const verificationResult = await verifyPayment(paymentReference);
    
    // Update order payment status
    if (verificationResult.data.status === "success") {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "COMPLETED",
          paymentReference,
          status: "PROCESSING", // Move to processing once payment is completed
        },
      });
      
      // Update product inventory for each order item
      const orderItems = await db.orderItem.findMany({
        where: { orderId },
        include: {
          product: true,
        },
      });
      
      for (const item of orderItems) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            inventory: { decrement: item.quantity },
          },
        });
      }
      
      // Create notifications for order status change
      await createOrderStatusNotification(orderId, "PROCESSING");
      
      revalidatePath(`/customer/orders/${orderId}`);
      revalidatePath("/customer/orders");
      
      return { success: true, status: "completed" };
    } else {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          paymentReference,
        },
      });
      
      // Notify about failed payment
      await createOrderStatusNotification(orderId, "PAYMENT_FAILED");
      
      revalidatePath(`/customer/orders/${orderId}`);
      revalidatePath("/customer/orders");
      
      return { success: false, status: "failed" };
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { error: "Failed to verify payment" };
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(formData: FormData) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    const orderId = formData.get("orderId") as string;
    
    if (!orderId) {
      return { error: "Order ID is required" };
    }
    
    // Get the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });
    
    if (!order) {
      return { error: "Order not found" };
    }
    
    // Check authorization
    if (
      session.user.role !== "ADMIN" &&
      order.customer.userId !== session.user.id
    ) {
      return { error: "Not authorized to cancel this order" };
    }
    
    // Can only cancel pending orders
    if (order.status !== "PENDING") {
      return { error: "Can only cancel pending orders" };
    }
    
    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    });
    
    // Update all order items status
    await db.orderItem.updateMany({
      where: { orderId },
      data: {
        status: "CANCELLED",
      },
    });
    
    // Create notifications for order status change
    await createOrderStatusNotification(orderId, "CANCELLED");
    
    revalidatePath(`/customer/orders/${orderId}`);
    revalidatePath("/customer/orders");
    
    return { success: true };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { error: "Failed to cancel order" };
  }
} 