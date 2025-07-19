import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { LocalCartItem } from '@/lib/utils/guest-cart';
import { createClient } from '@supabase/supabase-js';
// auth import removed – we rely solely on Supabase session

export interface ServerCartItem {
  product_id: string;
  quantity: number;
}

export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    },
  );
}

export async function getServerCart() {
  const supabase = await getServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  // Resolve customer profile first
  const { data: customerInitial, error: customerErrInitial } = await supabase
    .from('Customer')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  // Try fallback lookup using camelCase `userId` if not found
  let customer = customerInitial;
  if (!customer && !customerErrInitial) {
    const { data: customerFallback, error: customerErrFallback } = await supabase
      .from('Customer')
      .select('id')
      .eq('userId', session.user.id)
      .maybeSingle();
    if (customerErrFallback) throw customerErrFallback;
    customer = customerFallback ?? null;
  }

  if (customerErrInitial) throw customerErrInitial;
  if (!customer) return null;

  const { data: cart, error } = await supabase
    .from('Cart')
    .select('id, CartItem(quantity, product_id)')
    .eq('customer_id', customer.id)
    .single();
  if (error) return null;
  return cart;
}

export async function mergeGuestCart(items: LocalCartItem[]): Promise<boolean> {
  console.log('[mergeGuestCart] called with', items.length, 'items');
  // Nothing to merge
  if (!items.length) return false;

  // -----------------------------------------------
  // Determine the currently signed-in Supabase user
  // -----------------------------------------------
  const supabaseRLS = await getServerClient();
  const {
    data: { session },
  } = await supabaseRLS.auth.getSession();

  const userId = session?.user?.id;

  // If the user is not authenticated, we cannot merge – signal failure
  if (!userId) {
    console.warn('[mergeGuestCart] No authenticated Supabase user – skipping merge');
    return false;
  }

  // --------------------------------------------------------
  // 1. Resolve the Customer profile that belongs to the user
  // --------------------------------------------------------
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: customerInitial, error: customerErrInitial } = await supabaseAdmin
    .from('Customer')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  // Fallback: try camelCase `userId` column if not found
  let customer = customerInitial;
  if (!customer && !customerErrInitial) {
    const { data: customerFallback, error: customerErrFallback } = await supabaseAdmin
      .from('Customer')
      .select('id')
      .eq('userId', userId)
      .maybeSingle();
    if (customerErrFallback) throw customerErrFallback;
    customer = customerFallback ?? null;
  }

  if (customerErrInitial) throw customerErrInitial;
  if (!customer) {
    // If no Customer row exists we cannot merge the cart yet – bail silently but indicate not merged
    console.warn('[mergeGuestCart] No customer profile found for user', userId);
    return false;
  }

  // --------------------------------------------
  // 2. Get (or create) the cart for this customer
  // --------------------------------------------
  // supabaseAdmin already created above – reuse the same client for writes
  let { data: cart, error: cartErr } = await supabaseAdmin
    .from('Cart')
    .select('id')
    .eq('customer_id', customer.id)
    .maybeSingle();

  if (cartErr) throw cartErr;

  if (!cart) {
    const { data: newCart, error: insertErr } = await supabaseAdmin
      .from('Cart')
      .insert({ customer_id: customer.id })
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    cart = newCart;
  }

  // -----------------------
  // 3. Upsert the cart items
  // -----------------------
  const upserts = items.map((i) => ({
    cart_id: cart!.id,
    product_id: i.productId,
    quantity: i.qty,
  }));
  const { data: upsertData, error: upsertErr } = await supabaseAdmin
     .from('CartItem')
     .upsert(upserts, { onConflict: 'cart_id,product_id', ignoreDuplicates: false })
    .select('id, quantity');

  console.log('[mergeGuestCart] Upserted rows:', upsertData?.length || 0);

  if (upsertErr) {
    console.error('[mergeGuestCart] Failed to upsert CartItem rows:', upsertErr.message);
    throw upsertErr;
  }

  // -----------------------------
  // 4. Remove items not in payload
  // -----------------------------
  const productIds = items.map((i) => i.productId);
  if (productIds.length) {
    const deleteRes = await supabaseAdmin
      .from('CartItem')
      .delete()
      .eq('cart_id', cart!.id)
      .not('product_id', 'in', `(${productIds.join(',')})`);
    if (deleteRes.error) {
      console.error('[mergeGuestCart] Failed to prune removed items:', deleteRes.error.message);
    }
  }

  return true;
} 