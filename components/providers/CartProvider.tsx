"use client";

import React, { useEffect, useState, createContext, useContext, useReducer } from 'react';
import { readGuestCart, writeGuestCart, clearGuestCart, LocalCartItem } from '@/lib/utils/guest-cart';
import { createClient } from '@supabase/supabase-js';

interface CartItem extends LocalCartItem {}

type Action =
  | { type: 'SET'; items: CartItem[] }
  | { type: 'ADD'; productId: string; qty: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE'; productId: string; qty: number }
  | { type: 'CLEAR' };

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'SET':
      return action.items;
    case 'ADD': {
      const existing = state.find((i) => i.productId === action.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === action.productId ? { ...i, qty: Math.min(i.qty + action.qty, 99) } : i,
        );
      }
      return [...state, { productId: action.productId, qty: Math.min(action.qty, 99) }];
    }
    case 'REMOVE':
      return state.filter((i) => i.productId !== action.productId);
    case 'UPDATE':
      return state.map((i) => (i.productId === action.productId ? { ...i, qty: action.qty } : i));
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
  discount: number;
  couponCode: string | null;
  setDiscount: (d: number, code: string | null) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize reducer with empty array to ensure server/client consistency
  const [items, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);

  // Coupon state (persisted to localStorage)
  const [discount, setDiscountState] = useState(0);
  const [couponCode, setCouponCodeState] = useState<string | null>(null);

  const setDiscount = (d: number, code: string | null) => {
    setDiscountState(d);
    setCouponCodeState(code);
    if (typeof window !== 'undefined') {
      if (code) {
        window.localStorage.setItem('zervia_coupon_code', code);
      } else {
        window.localStorage.removeItem('zervia_coupon_code');
      }
    }
  };

  // Helper actions
  const add = (productId: string, qty: number = 1) => dispatch({ type: 'ADD', productId, qty });
  const remove = (productId: string) => dispatch({ type: 'REMOVE', productId });
  const updateQty = (productId: string, qty: number) => dispatch({ type: 'UPDATE', productId, qty });
  const clear = () => dispatch({ type: 'CLEAR' });

  // Supabase browser client (no service role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Holds the most recent server-cart subtotal (used when re-hydrating coupon discount)
  let latestCartSubtotal: number | null = null;

  async function performMergeAndLoad(session: any) {
    // ---------------------------------------------
    // STEP 1 – Attempt to merge local guest cart → server
    // ---------------------------------------------
    const guestItems = readGuestCart();
    // Attempt merge whenever we have guest-cart items
    if (guestItems.length) {
      console.log('[CartProvider] Guest cart has', guestItems.length, 'items – attempting merge');
      try {
        console.log('[CartProvider] Sending POST /api/cart/merge');
        const res = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ items: guestItems }),
        });
        console.log('[CartProvider] /api/cart/merge response status:', res.status);
        const data = await res.json().catch(() => ({}));
        console.log('[CartProvider] /api/cart/merge response body:', data);
        // Clear the local guest cart only when merge succeeded
        if (data?.success) {
          clearGuestCart();
        }
      } catch (err) {
        console.error('[CartProvider] Failed to POST /api/cart/merge', err);
      }
    }

    // ---------------------------------------------
    // STEP 2 – If session exists, pull fresh server cart
    // ---------------------------------------------
    if (session?.user) {
      const { data: customer, error: customerError } = await supabase
        .from('Customer')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (customerError) {
        console.error('[CartProvider] Error fetching customer profile:', customerError.message);
      }

      let serverItems: CartItem[] = [];

      // Fetch server cart via API to avoid client-side cookie parsing issues
      try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        if (res.ok) {
          const cartJson = await res.json();
          latestCartSubtotal = typeof cartJson.cartTotal === 'number' ? cartJson.cartTotal : null;

          serverItems = (cartJson.items || []).map((i: any) => ({
            productId: i.productId ?? i.product_id,
            qty: i.quantity ?? i.qty ?? 1,
          }));
        } else if (res.status !== 401 && res.status !== 404) {
          // Log unexpected errors but ignore 401 Unauthorized or 404 Not Found
          console.error('[CartProvider] Failed to GET /api/cart – status', res.status);
        }
      } catch (err) {
        console.error('[CartProvider] Error fetching /api/cart', err);
      }

      dispatch({ type: 'SET', items: serverItems });
    } else {
      // We may still be authenticated via HttpOnly cookies even if Supabase
      // browser client hasn't been hydrated yet (e.g. after a server-side
      // sign-in + redirect). In that case, fall back to calling our API which
      // uses cookie-based auth to return the cart.

      try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          latestCartSubtotal = typeof data.cartTotal === 'number' ? data.cartTotal : latestCartSubtotal;
          if (Array.isArray(data?.items)) {
            const serverItems = data.items.map((i: any) => ({
              productId: i.productId || i.product_id,
              qty: i.quantity || i.qty || 1,
            }));
            dispatch({ type: 'SET', items: serverItems });
            return;
          }
        }
      } catch (err) {
        console.error('[CartProvider] Fallback /api/cart fetch failed:', err);
      }

      // Fallback to local guest cart if cookie-based fetch also failed
      dispatch({ type: 'SET', items: readGuestCart() });
    }
  }

  // Initial hydration + merge attempt
  useEffect(() => {
    (async () => {
      // First, load guest cart items to ensure we start with the right state
      const guestItems = readGuestCart();
      dispatch({ type: 'SET', items: guestItems });

      let {
        data: { session },
      } = await supabase.auth.getSession();

      // Fallback: if no session user, try getUser (works with cookie-based auth)
      if (!session?.user) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          session = {
            user,
            access_token: '',
            refresh_token: '',
            expires_at: 0,
            token_type: 'bearer',
          } as any;
        }
      }

      await performMergeAndLoad(session);

      // Hydrate coupon from localStorage
      if (typeof window !== 'undefined') {
        const storedCode = window.localStorage.getItem('zervia_coupon_code');
        if (storedCode) {
          // No discount value persisted; will be recalculated when applying again.
          try {
            const bodyPayload: any = { code: storedCode };
            if (typeof latestCartSubtotal === 'number') {
              bodyPayload.cartSubtotal = latestCartSubtotal;
            }

            const res = await fetch('/api/coupon/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload),
            });
            const data = await res.json();
            if (data.valid) {
              setCouponCodeState(storedCode);
              setDiscountState(data.discount ?? 0);
            } else {
              // invalid – clear stored code
              window.localStorage.removeItem('zervia_coupon_code');
            }
          } catch {}
        }
      }
      setHydrated(true);
    })();
    // Listen for future auth changes (e.g. guest → signed-in within same tab)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        performMergeAndLoad(session);
      }
      if (event === 'SIGNED_OUT') {
        // When user signs out, reset to guest cart
        dispatch({ type: 'SET', items: readGuestCart() });
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Persist/sync cart whenever it changes – but only *after* initial hydration
  useEffect(() => {
    if (!hydrated) return;          // 1) don't run before first real render
    if (items.length === 0) return; // 2) <-- ADD THIS GUARD

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Guest – save to localStorage
        writeGuestCart(items);
      } else {
        // Authenticated – push latest cart to server
        try {
          const payload = { items: items.map((i) => ({ productId: i.productId, qty: i.qty })) };
          await fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error('[CartProvider] Failed to sync cart with server', err);
        }
      }
    })();
  }, [items, hydrated]);

  // Always render, but provide consistent state during hydration
  const value: CartContextValue = {
    items: hydrated ? items : [], // Show empty cart until hydrated
    add,
    remove,
    updateQty,
    clear,
    discount,
    couponCode,
    setDiscount,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx.items;
};

export const useCartActions = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartActions must be used within CartProvider');
  return {
    add: ctx.add,
    remove: ctx.remove,
    updateQty: ctx.updateQty,
    clear: ctx.clear,
  };
}; 