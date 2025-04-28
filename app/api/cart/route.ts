import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { createClient } from '@supabase/supabase-js';
import { getCustomerByUserId, getCustomerCart } from "../../../lib/services/customer";
import type { Cart } from '../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in cart API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found" },
        { status: 404 }
      );
    }
    
    const cartResult = await getCustomerCart(customer.id);

    if (!cartResult) {
        console.error(`Failed to get or create cart for customer ${customer.id}`);
        return NextResponse.json(
            { error: "Failed to retrieve or create cart." },
            { status: 500 }
        );
    }
    
    return NextResponse.json({
      ...(cartResult.cart),
      items: cartResult.items, 
      cartTotal: cartResult.cartTotal, 
    });

  } catch (error) {
    console.error("Error fetching cart API:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch cart";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 