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
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);

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

  async function performMergeAndLoad(session: any) {
    // ---------------------------------------------
    // STEP 1 – Attempt to merge local guest cart → server
    // ---------------------------------------------
    const guestItems = readGuestCart();
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

      if (customer?.id) {
        const { data: cart, error: cartError } = await supabase
          .from('Cart')
          .select('CartItem(product_id, quantity)')
          .eq('customer_id', customer.id)
          .maybeSingle();

        if (cartError) {
          console.error('[CartProvider] Error fetching cart:', cartError.message);
        }

        serverItems =
          cart?.CartItem?.map((i: any) => ({
            productId: i.product_id,
            qty: i.quantity,
          })) ?? [];
      }

      dispatch({ type: 'SET', items: serverItems });
    } else {
      // Fallback to local guest cart
      dispatch({ type: 'SET', items: readGuestCart() });
    }
  }

  // Initial hydration + merge attempt
  useEffect(() => {
    (async () => {
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
    if (!hydrated) return; // skip the very first run

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

  if (!hydrated) return null;

  const value: CartContextValue = { items, add, remove, updateQty, clear };
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