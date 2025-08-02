import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getCustomerByUserId } from "../../../../lib/services/customer";
import { getVendorByUserId } from "../../../../lib/services/vendor";
import { getAgentByUserId } from "../../../../lib/services/agent";
import { getReturnById } from "../../../../lib/services/return";
import { createClient } from '@supabase/supabase-js';
import type { Return, Product } from '../../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in returns/[id] API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type ReturnStatus = Return['status'];
type RefundStatus = Return['refundStatus'];
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const returnId = (await context.params).id;
    
    const returnData = await getReturnById(returnId);
    
    if (!returnData) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }
    
    if (session.user.role === "CUSTOMER") {
      const customer = await getCustomerByUserId(session.user.id);
      if (!customer || customer.id !== returnData.customerId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role === "AGENT") {
      const agent = await getAgentByUserId(session.user.id);
      if (!agent || agent.id !== returnData.agentId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(returnData);
  } catch (error) {
    console.error("Error fetching return:", error);
    return NextResponse.json(
      { error: "Failed to fetch return" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const returnId = (await context.params).id;
    if (!returnId) return NextResponse.json({ error: "Return ID required" }, { status: 400 });
    const body = await request.json();
    
    const { data: returnData, error: fetchError } = await supabase
      .from('Return')
      .select('id, customerId, vendorId, agentId, productId, orderId, status, refundStatus') 
      .eq('id', returnId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("API PUT Return - Fetch error:", fetchError.message);
      throw fetchError;
    }

    if (!returnData) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }
    
    let updateData: Partial<Return> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    };
    let updateOrderPaymentStatus: PaymentStatus | null = null;
    let incrementInventory = false;

    if (session.user.role === "VENDOR") {
      const vendor = await getVendorByUserId(session.user.id);
      if (!vendor || vendor.id !== returnData.vendorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      if (body.action === "approve") {
          if (returnData.status !== 'REQUESTED') {
              return NextResponse.json({ error: "Return request already processed." }, { status: 400 });
          }
          updateData.status = "APPROVED";
          updateData.processDate = new Date().toISOString();
          updateData.refundStatus = "PENDING";
      } else if (body.action === "reject") {
          if (returnData.status !== 'REQUESTED') {
              return NextResponse.json({ error: "Return request already processed." }, { status: 400 });
          }
          if (!body.reason) {
            return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
          }
          updateData.status = "REJECTED";
          updateData.refundStatus = "REJECTED";
          updateData.reason = `REJECTED: ${body.reason}`;
          updateData.processDate = new Date().toISOString();
      } else {
        return NextResponse.json({ error: "Invalid action for vendor" }, { status: 400 });
      }
    } else if (session.user.role === "AGENT") {
      const agent = await getAgentByUserId(session.user.id);
      if (!agent || agent.id !== returnData.agentId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      if (body.action === "complete") {
        if (returnData.status !== "APPROVED") {
          return NextResponse.json({ error: "Return must be approved before completing" }, { status: 400 });
        }
        
        updateData.status = "COMPLETED";
        updateData.refundStatus = "PROCESSED";
        updateData.processDate = new Date().toISOString();
        
        incrementInventory = true;
        
        updateOrderPaymentStatus = "REFUNDED";

      } else {
        return NextResponse.json({ error: "Invalid action for agent" }, { status: 400 });
      }
    } else if (session.user.role === "ADMIN") {
       if (body.status) updateData.status = body.status as ReturnStatus;
       if (body.refundStatus) updateData.refundStatus = body.refundStatus as RefundStatus;
       if (body.reason) updateData.reason = body.reason;
       if (body.status && body.status !== 'REQUESTED') {
           updateData.processDate = new Date().toISOString();
       }
       if (body.refundStatus === "PROCESSED" || (body.status === "COMPLETED" && returnData.status === "APPROVED")) {
          updateOrderPaymentStatus = "REFUNDED";
       }
       if (!updateData.status && !updateData.refundStatus && !updateData.reason) {
            return NextResponse.json({ error: "No valid fields provided for admin update" }, { status: 400 });
       }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: updatedReturnData, error: updateError } = await supabase
        .from('Return')
        .update(updateData)
        .eq('id', returnId)
        .select()
        .single();

    if (updateError) {
        console.error("API PUT Return - Update error:", updateError.message);
        throw updateError;
    }

    if (incrementInventory) {
         const { error: inventoryError } = await supabase.rpc('increment_product_inventory', {
            product_id_param: returnData.productId,
            quantity_param: 1
        });
        if (inventoryError) {
            console.error("API PUT Return - Inventory update error:", inventoryError.message);
        }
    }

    if (updateOrderPaymentStatus) {
        const { error: orderUpdateError } = await supabase
            .from('Order')
            .update({ paymentStatus: updateOrderPaymentStatus, updatedAt: new Date().toISOString() })
            .eq('id', returnData.orderId);
        if (orderUpdateError) {
            console.error("API PUT Return - Order payment status update error:", orderUpdateError.message);
        }
    }
    
    return NextResponse.json(updatedReturnData);
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update return" },
      { status: 500 }
    );
  }
} 