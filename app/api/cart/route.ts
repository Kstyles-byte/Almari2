import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCustomerByUserId, getCustomerCart } from '@/lib/services/customer';

export async function GET(req: NextRequest) {
  try {
    // Create a Supabase server client that can read the cookies from the request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
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