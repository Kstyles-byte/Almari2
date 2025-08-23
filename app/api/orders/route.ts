import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { initializePayment } from "../../../lib/paystack";
import { getCustomerByUserId } from "../../../lib/services/customer";
import { getVendorByUserId } from "../../../lib/services/vendor";
import type { Database } from '../../../types/supabase';

// Re-define table row types using generated Database
type Order = Database['public']['Tables']['Order']['Row'];
type OrderItem = Database['public']['Tables']['OrderItem']['Row'];
type Customer = Database['public']['Tables']['Customer']['Row'];
type Vendor = Database['public']['Tables']['Vendor']['Row'];
type Product = Database['public']['Tables']['Product']['Row'];
type CartItem = Database['public']['Tables']['CartItem']['Row'];
type UserProfile = Database['public']['Tables']['User']['Row'];

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL or Service Role Key is missing in API route /api/orders.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    let query = supabase
        .from('Order')
        .select(`
            *,
            Customer:customerId ( id, User:userId ( name, email ) ),
            OrderItem ( 
                *, 
                Product:productId ( id, name, price, slug, ProductImage!ProductImage_productId_fkey(url, order) ), 
                Vendor:vendorId ( id, storeName ) 
            )
        `, { count: 'exact' }); // Add count for pagination
    
    let countQuery = supabase
        .from('Order')
        .select('*', { count: 'exact', head: true });

    // Declare vendor variable here to be accessible later
    let vendor: Vendor | null = null;

    if (session.user.role === "ADMIN") {
      // Admin can see all orders - no additional filters needed for query or countQuery
      
    } else if (session.user.role === "VENDOR") {
      // Vendor can see orders containing their products
      vendor = await getVendorByUserId(session.user.id); // Use Supabase service
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      // Vendors see Orders that have at least one OrderItem linked to their vendorId
      // Use a join filter on OrderItem
      query = query.eq('OrderItem.vendorId', vendor.id);
      countQuery = countQuery.eq('OrderItem.vendorId', vendor.id);

    } else { // Customer role
      // Customer can see their own orders
      const customer = await getCustomerByUserId(session.user.id); // Use Supabase service
      
      if (!customer) {
        return NextResponse.json(
          { error: "Customer profile not found" },
          { status: 404 }
        );
      }
      
      query = query.eq('customerId', customer.id);
      countQuery = countQuery.eq('customerId', customer.id);
    }
    
    // Apply ordering and pagination to the main query
    query = query.order('createdAt', { ascending: false })
                 .range(skip, skip + limit - 1);

    // Execute queries
    const { data: ordersData, error: ordersError } = await query;
    const { count, error: countError } = await countQuery;

    if (ordersError) {
        console.error("Supabase error fetching orders:", ordersError.message);
        throw ordersError;
    }
     if (countError) {
        // Log count error but potentially proceed with fetched data if available
        console.error("Supabase error fetching order count:", countError.message);
    }

    // Format data if needed, especially nested relations
    // Ensure images are sorted, etc.
    const formattedOrders = ordersData?.map((order: any) => {
        const items = order.OrderItem?.map((item: any) => {
            const productImages = (item.Product?.ProductImage || []).sort((a:any, b:any) => a.order - b.order);
            return {
                ...item,
                product: item.Product ? {
                    ...item.Product,
                    images: productImages, // Use the sorted images
                    ProductImage: undefined // Remove original ProductImage array if desired
                } : null,
                 vendor: item.Vendor // Rename if needed, already fetched
            };
        // Filter items again for Vendor role to ensure only their items are shown
        }).filter((item: any) => session.user.role !== 'VENDOR' || item.vendorId === vendor?.id); // Now vendor is in scope

        return {
            ...order,
            customer: order.Customer, // Rename if needed
            items: items || [],
            Customer: undefined, // Remove original Customer relation if desired
            OrderItem: undefined // Remove original OrderItem relation
        };
    }) || [];

    return NextResponse.json({
      data: formattedOrders, // Use formatted data
      meta: {
        page,
        limit,
        total: count ?? 0, // Use count from countQuery
        pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is a customer
    if (!session?.user || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch customer and their related User data (for email/name)
    const { data: customerWithUser, error: customerFetchError } = await supabase
      .from('Customer')
      .select(`
        *,
        user:User (id, name, email)
      `)
      .eq('userId', session.user.id)
      .single();

    if (customerFetchError || !customerWithUser) {
        console.error("Error fetching customer with user:", customerFetchError?.message);
        return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }

    // Use the fetched object which includes user details
    const customer = customerWithUser as Customer & { user: UserProfile }; // Type assertion for clarity
    
    const body = await req.json();
    const { shippingAddress } = body;
    
    // Validate shipping address
    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }
    
    // Get cart items
    const { data: cartData, error: cartError } = await supabase
      .from('Cart')
      .select('id')
      .eq('customerId', customer.id)
      .single();

    if (cartError || !cartData) {
        console.error("Cart fetch error or cart not found:", cartError?.message);
        return NextResponse.json({ error: "Active cart not found" }, { status: 404 });
    }

    const cartId = cartData.id;

    // 2. Fetch cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('CartItem')
      .select('*, product:Product (*)') // Fetch product details
      .eq('cartId', cartId);

    if (itemsError) {
        console.error("Cart items fetch error:", itemsError.message);
        return NextResponse.json({ error: "Failed to fetch cart items" }, { status: 500 });
    }

    // Ensure cartItems are properly typed (array of CartItem with a nested product object)
    const typedCartItems = cartItems as (CartItem & { product: Product | null })[];

    if (!typedCartItems || typedCartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Check inventory for all items
    const inventoryUpdates: { product_id: string; quantityChange: number }[] = [];
    for (const item of typedCartItems) {
      if (!item.product) {
          // Should not happen if FK constraints are good, but good to check
          return NextResponse.json(
            { error: `Product details missing for item in cart.`,
              productId: (item as any).product_id },
            { status: 500 }
          );
      }
      if (item.product.inventory < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough inventory for product: ${item.product.name}`,
            productId: (item as any).product_id,
          },
          { status: 400 }
        );
      }
      inventoryUpdates.push({ product_id: (item as any).product_id, quantityChange: -item.quantity });
    }

    // Calculate total
    const total = typedCartItems.reduce((sum, item) => {
      // Use Number() to handle potential Decimal types if they exist, or just use price directly if it's number
      return sum + Number(item.product?.price || 0) * item.quantity;
    }, 0);

    // Create order (snake_case columns to match schema)
    const { data: newOrderData, error: orderError } = await supabase
      .from('Order')
      .insert({
        customer_id: customer.id,
        subtotal: total,
        discount_amount: 0,
        tax_amount: 0,
        shipping_amount: 0,
        total_amount: total,
        status: 'PENDING',
        payment_status: 'PENDING',
      })
      .select()
      .single();

    if (orderError || !newOrderData) {
        console.error("Failed to create order:", orderError?.message);
        // TODO: Rollback logic if not using RPC
        return NextResponse.json({ error: `Failed to create order: ${orderError?.message}` }, { status: 500 });
    }

    const newOrder = newOrderData; // Assign for use below

    // Create order items (use snake_case column names to match DB schema)
    const orderItemInserts = typedCartItems.map(item => ({
      order_id: newOrder.id,
      product_id: (item as any).product_id,
      vendor_id: item.product ? (item.product as any).vendor_id ?? (item.product as any).vendorId : null,
      quantity: item.quantity,
      price_at_purchase: Number(item.product?.price || 0),
      status: 'PENDING',
    }));

    // Persist order items so that realtime subscriptions (e.g. vendor dashboard) receive INSERT events
    const { error: orderItemsError } = await supabase
      .from('OrderItem')
      .insert(orderItemInserts);

    if (orderItemsError) {
      console.error('Failed to create order items:', orderItemsError.message);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Update inventory
    for (const update of inventoryUpdates) {
      const { error: inventoryUpdateError } = await supabase
        .from('Product')
        .update({
          inventory: {
            decrement: update.quantityChange,
          },
        })
        .eq('id', update.product_id);

      if (inventoryUpdateError) {
        console.error(`Failed to update inventory for product ${update.product_id}:`, inventoryUpdateError.message);
        // TODO: Rollback or compensation logic
      }
    }

    // Clear cart after successful order (ideally in RPC/transaction)
    // NOTE: use snake_case column name `cart_id` to match DB schema
    const { error: deleteCartError } = await supabase
      .from('CartItem')
      .delete()
      .eq('cart_id', cartId);

    if (deleteCartError) {
      console.error("Failed to clear cart:", deleteCartError.message);
      // TODO: Rollback or compensation logic
    }

    // Initialize payment (pass arguments as an object)
    const paymentData = await initializePayment({
      email: customer.user.email,
      amount: Math.round(total * 100),
      metadata: {
        orderId: newOrder.id,
        customerId: customer.id,
        customerName: customer.user.name,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/checkout/complete?orderId=${newOrder.id}`,
    });

    // Check for high-value orders and send admin notifications
    try {
      const { notifyHighValueOrder } = await import('../../../lib/notifications/adminNotifications');
      // Notify if order is above 100,000 Naira threshold
      await notifyHighValueOrder(newOrder.id, 100000);
    } catch (notificationError) {
      console.error('Error sending high-value order notifications:', notificationError);
      // Don't fail the order creation process due to notification errors
    }

    // Send vendor notifications for new order
    console.log('🔥 [Orders API] About to send vendor notification for order:', newOrder.id);
    try {
      const { notifyVendorsNewOrder } = await import('../../../lib/notifications/vendorOrderNotifications');
      console.log('🔥 [Orders API] Successfully imported notifyVendorsNewOrder');
      console.log(`🔥 [Orders API] Calling notifyVendorsNewOrder for order: ${newOrder.id}`);
      await notifyVendorsNewOrder(newOrder.id);
      console.log(`🔥 [Orders API] Completed notifyVendorsNewOrder for order: ${newOrder.id}`);
    } catch (vendorNotificationError) {
      console.error('🚨 [Orders API] Error sending vendor new order notifications:', vendorNotificationError);
      // Don't fail the order creation process due to notification errors
    }

    return NextResponse.json({
      order: {
        ...newOrder,
        items: orderItemInserts,
      },
      payment: {
        reference: paymentData.data.reference,
        authorizationUrl: paymentData.data.authorization_url,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
} 