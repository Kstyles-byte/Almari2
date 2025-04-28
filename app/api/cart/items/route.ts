import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { createClient } from '@supabase/supabase-js';
import { getCustomerByUserId, getCustomerCart } from "../../../../lib/services/customer";
import type { Product, Customer } from '../../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Supabase URL/Key missing in cart items API route.");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }
    
    const body = await req.json();
    const { productId, quantity } = body;
    
    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "Product ID and quantity are required" }, { status: 400 });
    }
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }
    
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('id, name, inventory, isPublished')
      .eq('id', productId)
      .single();

    if (productError) {
        console.error("POST Cart Item - Error fetching product:", productError.message);
        return NextResponse.json({ error: "Failed to find product." }, { status: 500 });
    }
    if (!productData) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (!productData.isPublished) {
        return NextResponse.json({ error: "Product is not available" }, { status: 400 });
    }
    if (productData.inventory < numQuantity) {
      return NextResponse.json({ error: `Not enough inventory for ${productData.name}. Only ${productData.inventory} left.` }, { status: 400 });
    }
    
    const cartResult = await getCustomerCart(customer.id);
    if (!cartResult) {
        return NextResponse.json({ error: "Failed to retrieve or create cart." }, { status: 500 });
    }
    const cartId = cartResult.cart.id;
    
    const { error: upsertError } = await supabase
        .from('CartItem')
        .upsert({
            cartId: cartId,
            productId: productId,
            quantity: numQuantity,
        }, {
            onConflict: 'cartId, productId',
        });

    if (upsertError) {
        console.error("Error upserting cart item:", upsertError.message);
        return NextResponse.json({ error: "Failed to add item to cart." }, { status: 500 });
    }
    
    const updatedCartResult = await getCustomerCart(customer.id);
    if (!updatedCartResult) {
        console.error("Failed to fetch updated cart state after add/update.");
        return NextResponse.json({ message: "Item added/updated successfully, but failed to fetch updated cart state."}, { status: 201 });
    }

    return NextResponse.json({
      cart: {
          ...(updatedCartResult.cart),
          items: updatedCartResult.items,
          cartTotal: updatedCartResult.cartTotal,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding/updating item to cart API:", error);
    return NextResponse.json(
      { error: "Failed to add or update item in cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const customer = await getCustomerByUserId(session.user.id);
    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 });
    }
    
    const cartResult = await getCustomerCart(customer.id);
    if (!cartResult) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }
    const cartId = cartResult.cart.id;
    
    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");
    
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }
    
    const { data: cartItem, error: fetchItemError } = await supabase
      .from('CartItem')
      .select('id')
      .eq('id', itemId)
      .eq('cartId', cartId)
      .maybeSingle();

    if (fetchItemError) {
        console.error("DELETE Cart Item - Error fetching item:", fetchItemError.message);
        return NextResponse.json({ error: "Failed to verify item." }, { status: 500 });
    }
    
    if (!cartItem) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }
    
    const { error: deleteError } = await supabase
      .from('CartItem')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error("Error deleting cart item:", deleteError.message);
      return NextResponse.json({ error: "Failed to remove item from cart" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error("Error removing item from cart API:", error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}

// TODO: Implement PUT handler if needed for separate quantity updates
// It would be similar to POST but likely taking itemId in path/params
// and only performing an update, including inventory checks.
/*
export async function PUT(req: NextRequest, { params }: { params: { itemId: string } }) {
  // ... auth, customer, cartId logic ...
  const itemId = params.itemId;
  const { quantity } = await req.json();
  // ... validation ...
  // ... fetch cartItem to check ownership and get productId ...
  // ... fetch product to check inventory ...
  // ... supabase.from('CartItem').update({ quantity }).eq('id', itemId) ...
  // ... return updated cart state ...
}
*/ 