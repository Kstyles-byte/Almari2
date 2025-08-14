import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { verifyPayment } from "../../../../lib/paystack";
import { createClient } from '@supabase/supabase-js';
import { getCustomerByUserId } from "../../../../lib/services/customer";
import { getVendorByUserId } from "../../../../lib/services/vendor";
import type { Database } from '../../../../types/supabase';

type Order = Database['public']['Tables']['Order']['Row'];
type OrderItem = Database['public']['Tables']['OrderItem']['Row'];
type Product = Database['public']['Tables']['Product']['Row'];
type Vendor = Database['public']['Tables']['Vendor']['Row'];
type Customer = Database['public']['Tables']['Customer']['Row'];
type UserProfile = Database['public']['Tables']['User']['Row'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in orders/[id] API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type OrderStatus = Order['status'];
type OrderItemStatus = OrderItem['status'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params; // await params as required in Next.js 15

    // Retrieve the NextAuth session (may be undefined in the print-tab context).
    const session = await auth();
    
    if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select(`
        *,
        Customer:customer_id ( id, phone_number, User:user_id ( name, email ) ),
        OrderItem ( 
          *, 
          Product:product_id ( id, name, slug, price, ProductImage!ProductImage_product_id_fkey ( url, alt_text, display_order ) ), 
          Vendor:vendor_id ( id, store_name )
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError && orderError.code !== 'PGRST116') {
        console.error("API GET Order - Fetch error:", orderError.message);
        throw orderError;
    }
    
    if (!orderData) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    let order = orderData as any;

    if (session?.user?.role === "CUSTOMER") {
      const customer = await getCustomerByUserId(session.user.id);
      
      if (!customer || customer.id !== order.customer_id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session?.user?.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor profile not found" },
          { status: 404 }
        );
      }
      
      const vendorItems = order.OrderItem?.filter((item: any) => item.Vendor?.id === vendor.id);
      
      if (!vendorItems || vendorItems.length === 0) {
        return NextResponse.json(
          { error: "Unauthorized: No items for this vendor in the order" },
          { status: 401 }
        );
      }
      
      order = { ...order, OrderItem: vendorItems };
    }
    
    const formattedOrder = {
        ...order,
        customer: {
            ...order.Customer,
            user: order.Customer?.User,
            User: undefined,
        },
        items: (order.OrderItem || []).map((item: any) => ({
            ...item,
            product: {
                ...item.Product,
                images: (item.Product?.ProductImage || []).sort((a: any, b: any) => a.display_order - b.display_order).slice(0,1),
                ProductImage: undefined,
            },
            vendor: item.Vendor,
            Product: undefined,
            Vendor: undefined,
        })),
        Customer: undefined,
        OrderItem: undefined,
    };

    return NextResponse.json(formattedOrder);

  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params; // await params first per Next.js 15

    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Agents (e.g., at drop-off counter) are allowed full access to order
    if (session.user.role === "AGENT") {
      // continue without additional restrictions
    }
    
    if (!orderId) return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    const body = await request.json();
    
    const { data: order, error: fetchError } = await supabase
        .from('Order')
        .select('id, customer_id, status, OrderItem(id, order_id, vendor_id, status)')
        .eq('id', orderId)
        .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("API PUT Order - Fetch error:", fetchError.message);
        throw fetchError;
    }
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    let updatedOrderData: Order | null = null;
    let updatePerformed = false;

    if (session?.user?.role === "CUSTOMER") {
      const customer = await getCustomerByUserId(session.user.id);
      
      if (!customer || customer.id !== order.customer_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      if (body.status !== "CANCELLED") {
        return NextResponse.json({ error: "Customers can only cancel orders" }, { status: 403 });
      }
      if (order.status !== "PENDING") {
        return NextResponse.json({ error: "Can only cancel pending orders" }, { status: 400 });
      }

      const { data: cancelledOrder, error: cancelError } = await supabase
        .from('Order')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (cancelError) {
        console.error("API PUT Order - Customer Cancel Error:", cancelError.message);
        throw cancelError;
      }
      updatedOrderData = cancelledOrder;
      updatePerformed = true;

    } else if (session?.user?.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
      
      if (body.itemId && body.status) {
        const itemToUpdate = order.OrderItem?.find((item: any) => item.id === body.itemId && item.vendor_id === vendor.id);

        if (!itemToUpdate) {
          return NextResponse.json({ error: "Order item not found or not authorized for this vendor" }, { status: 404 });
        }
        
        const { error: itemUpdateError } = await supabase
          .from('OrderItem')
          .update({ status: body.status as OrderItemStatus, updated_at: new Date().toISOString() })
          .eq('id', body.itemId);

        if (itemUpdateError) {
            console.error("API PUT Order - Vendor Item Update Error:", itemUpdateError.message);
            throw itemUpdateError;
        }
        updatePerformed = true;

        const { data: allItems, error: allItemsError } = await supabase
            .from('OrderItem')
            .select('status')
            .eq('order_id', orderId);

        if (allItemsError) {
            console.error("API PUT Order - Fetching all items error:", allItemsError.message);
        } else if (allItems && allItems.length > 0) {
            const allSameStatus = allItems.every(item => item.status === body.status);
            const firstStatus = allItems[0].status;
            const areAllSame = allItems.every(item => item.status === firstStatus);

            if (areAllSame) {
                 const { error: orderStatusUpdateError } = await supabase
                    .from('Order')
                    .update({ status: firstStatus as OrderStatus, updated_at: new Date().toISOString() })
                    .eq('id', orderId);
                if (orderStatusUpdateError) {
                     console.error("API PUT Order - Order Status Sync Error:", orderStatusUpdateError.message);
                }
            }
        }
      } else if (body.status && !body.itemId) {
            return NextResponse.json({ error: "Vendor must specify itemId to update status" }, { status: 400 });
      } else {
            return NextResponse.json({ error: "Invalid request for vendor update" }, { status: 400 });
      }

    } else if (session.user.role === "ADMIN") {
      const adminUpdateData: Partial<Order> & { updated_at?: string } = {};
       if (body.status) adminUpdateData.status = body.status as OrderStatus;
       if (body.agentId !== undefined) adminUpdateData.agent_id = body.agentId;

       if (Object.keys(adminUpdateData).length > 0) {
           adminUpdateData.updated_at = new Date().toISOString();
           const { data: adminUpdatedOrder, error: adminUpdateError } = await supabase
                .from('Order')
                .update(adminUpdateData)
                .eq('id', orderId)
                .select()
                .single();
            
             if (adminUpdateError) {
                console.error("API PUT Order - Admin Update Error:", adminUpdateError.message);
                throw adminUpdateError;
             }
             
             // If order status is being updated to DELIVERED, update all order items to DELIVERED as well
             if (body.status === 'DELIVERED') {
               const { error: itemUpdateError } = await supabase
                 .from('OrderItem')
                 .update({ 
                   status: 'DELIVERED',
                   updated_at: new Date().toISOString()
                 })
                 .eq('order_id', orderId);
               
               if (itemUpdateError) {
                 console.error("API PUT Order - Order Items Update Error:", itemUpdateError.message);
                 // Don't fail the entire request, but log the error
               }
             }
             
             updatedOrderData = adminUpdatedOrder;
             updatePerformed = true;
       } else {
            return NextResponse.json({ error: "No valid fields provided for admin update" }, { status: 400 });
       }
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 401 });
    }

    if (updatePerformed && !updatedOrderData) {
         const { data: finalOrderState, error: finalFetchError } = await supabase
            .from('Order')
            .select('*, OrderItem(*, Product(*, ProductImage(*)), Vendor(*))')
            .eq('id', orderId)
            .single();
        if (finalFetchError) {
            console.error("API PUT Order - Final Fetch Error:", finalFetchError.message);
            return NextResponse.json({ message: "Update successful, but failed to fetch final state" }, { status: 200 });
        }
        updatedOrderData = finalOrderState;
    }

    const finalFormattedOrder = updatedOrderData ? {
         ...updatedOrderData,
            items: (updatedOrderData as any).OrderItem?.map((item: any) => ({
                ...item,
                product: {
                    ...item.Product,
                    images: (item.Product?.ProductImage || []).sort((a: any, b: any) => a.display_order - b.display_order).slice(0,1),
                    ProductImage: undefined,
                },
                vendor: item.Vendor,
                Product: undefined,
                Vendor: undefined,
            })) || [],
            OrderItem: undefined,
     } : null;

    return NextResponse.json(finalFormattedOrder);

  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order" },
      { status: 500 }
    );
  }
} 