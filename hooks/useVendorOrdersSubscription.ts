"use client";

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/supabase';
import { useAtom } from 'jotai';
import {
  vendorOrdersAtom,
  unreadVendorOrdersCountAtom,
  VendorOrder,
} from '../lib/atoms';

/**
 * Subscribes to realtime OrderItem inserts for the authenticated vendor.
 * Keeps a live list of orders in vendorOrdersAtom and tracks unread count.
 */
export function useVendorOrdersSubscription(passedVendorId?: string) {
  const [, setOrders] = useAtom(vendorOrdersAtom);
  const [, setUnreadCount] = useAtom(unreadVendorOrdersCountAtom);

  useEffect(() => {
    console.log('[useVendorOrdersSubscription] effect start');
    const supabase = createClientComponentClient<Database>();

    let subscription: ReturnType<typeof supabase.channel> | null = null;
    // Fallback polling timer – will fetch latest orders in case realtime is unreliable
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // Helper to fetch latest orders via our API and merge into atoms
    async function fetchLatestOrders(vendorId: string) {
      try {
        const res = await fetch(`/api/vendor/orders?vendorId=${vendorId}`);
        if (!res.ok) {
          console.error('[useVendorOrdersSubscription] Polling fetch returned', res.status);
          return;
        }
        const { orderItems, ordersMap } = await res.json();
        if (!Array.isArray(orderItems)) return;

        const grouped = groupOrderItems(orderItems, ordersMap || {});

        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          let newlyAdded = 0;
          const merged = [...prev];

          grouped.forEach((ord) => {
            const idx = merged.findIndex((o) => o.id === ord.id);
            if (idx === -1) {
              // New order entirely
              ord.isNew = true;
              ord.isUnread = true;
              merged.unshift(ord);
              newlyAdded += 1;
            } else {
              // Existing order – check if status/payment has changed
              const existing = merged[idx];
              if (existing.status !== ord.status || existing.paymentStatus !== ord.paymentStatus) {
                merged[idx] = { ...existing, status: ord.status, paymentStatus: ord.paymentStatus };
              }
            }
          });

          // Update unread count if new orders found
          if (newlyAdded > 0) {
            setUnreadCount((c) => c + newlyAdded);
          }

          return merged;
        });
      } catch (err) {
        console.error('[useVendorOrdersSubscription] Polling fetch error', err);
      }
    }

    async function setup() {
      if (passedVendorId) {
        console.log('[useVendorOrdersSubscription] Using provided vendorId', passedVendorId);

        // Attempt to fetch and subscribe immediately – even if the auth cookie
        // failed to parse on the browser side we can still use the anon key for
        // HTTP fetches (which hit a service-role route) and replication events
        // because they are row-filtered server-side.

        await initForVendor(passedVendorId);

        // Start polling fallback after initial fetch
        pollTimer = setInterval(() => fetchLatestOrders(passedVendorId), 15000);
        return;
      }

      let {
        data: { user },
      } = await supabase.auth.getUser();

      // If user is not yet available (e.g. session restoration delay), wait for auth state change once
      if (!user) {
        console.log('[useVendorOrdersSubscription] Waiting for user from auth state change');
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            user = session.user;
            await initForUser(user.id);
            authListener.subscription.unsubscribe();
          }
        });
      } else {
        await initForUser(user.id);
      }

      async function initForUser(userId: string) {
        // Fetch vendor id
        const { data: vendor, error: vendorError } = await supabase
          .from('Vendor')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (vendorError) {
          console.error('[useVendorOrdersSubscription] vendor lookup error:', vendorError.message);
        }
        if (!vendor) {
          console.warn('[useVendorOrdersSubscription] No vendor record found for user', userId);
          return;
        }

        const vendorId = vendor.id;
        console.log('[useVendorOrdersSubscription] Found vendor id', vendorId);
        await initForVendor(vendorId);
        // Start polling fallback
        pollTimer = setInterval(() => fetchLatestOrders(vendorId), 15000);
      }

      async function initForVendor(vendorId: string) {
        try {
          const res = await fetch(`/api/vendor/orders?vendorId=${vendorId}`);
          if (!res.ok) {
            console.error('[useVendorOrdersSubscription] /api/vendor/orders returned', res.status);
            return;
          }
          const { orderItems, ordersMap } = await res.json();
          console.log('[useVendorOrdersSubscription] Fetched', orderItems?.length, 'order items from API');

          if (Array.isArray(orderItems)) {
            const grouped = groupOrderItems(orderItems, ordersMap || {});
            setOrders(grouped);
            const unread = grouped.filter((o) => o.isUnread).length;
            setUnreadCount(unread);
          }
        } catch (err) {
          console.error('[useVendorOrdersSubscription] Error calling /api/vendor/orders', err);
        }

        // Subscribe to INSERT on OrderItem for this vendor
        subscription = supabase
          .channel('vendor-orders-' + vendorId)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'OrderItem',
              filter: `vendor_id=eq.${vendorId}`,
            },
            async (payload) => {
              const newItem = payload.new as any;
              // Fetch order details for the new item
              const { data: orderRow } = await supabase
                .from('Order')
                .select('status, payment_status, total_amount, created_at, Customer:customer_id(User:user_id(name))')
                .eq('id', newItem.order_id)
                .single();

              const order: VendorOrder = {
                id: newItem.order_id,
                orderNumber: newItem.order_id.substring(0, 8),
                createdAt: orderRow?.created_at ?? new Date().toISOString(),
                totalAmount: orderRow?.total_amount ?? 0,
                status: orderRow?.status ?? 'PENDING',
                paymentStatus: orderRow?.payment_status ?? 'PENDING',
                customerName: orderRow?.Customer?.User?.name ?? 'Customer',
                items: [
                  {
                    productName: '',
                    quantity: newItem.quantity,
                    price: newItem.price_at_purchase,
                    status: newItem.status,
                  },
                ],
                isNew: true,
                isUnread: true,
              };

              setOrders((prev) => {
                const existingIndex = prev.findIndex((o) => o.id === order.id);
                if (existingIndex >= 0) {
                  // merge items if order already exists
                  const updated = [...prev];
                  updated[existingIndex].items?.push(order.items?.[0]);
                  return updated;
                }
                // prepend
                return [order, ...prev];
              });
              setUnreadCount((c) => c + 1);
            }
          )
          .subscribe();
      }
    }

    setup();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
      if (pollTimer) clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedVendorId]);
}

function groupOrderItems(orderItems: any[], ordersMap: Record<string, any>): VendorOrder[] {
  const map = new Map<string, VendorOrder>();
  orderItems.forEach((item) => {
    if (!map.has(item.order_id)) {
      map.set(item.order_id, {
        id: item.order_id,
        orderNumber: item.order_id.substring(0, 8),
        createdAt: ordersMap[item.order_id]?.created_at ?? item.created_at,
        totalAmount: ordersMap[item.order_id]?.total_amount ?? 0,
        status: ordersMap[item.order_id]?.status ?? 'PENDING',
        paymentStatus: ordersMap[item.order_id]?.payment_status ?? 'PENDING',
        customerName: ordersMap[item.order_id]?.Customer?.[0]?.User?.[0]?.name ?? 'Customer',
        items: [],
        isNew: false,
        isUnread: item.created_at && isWithinUnreadWindow(item.created_at),
      });
    }
    map.get(item.order_id)!.items!.push({
      productName: item.Product?.[0]?.name ?? '',
      quantity: item.quantity,
      price: item.price_at_purchase,
      status: item.status,
    });
  });

  // Convert map to array sorted by createdAt desc
  return Array.from(map.values()).sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

function isWithinUnreadWindow(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return now - created < oneDayMs; // unread if within past day (fallback)
} 