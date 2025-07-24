'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { agentOrdersAtom, unreadAgentOrdersCountAtom, AgentOrder } from '@/lib/atoms';

type OrderRow = Database['public']['Tables']['Order']['Row'];
type OrderItemRow = Database['public']['Tables']['OrderItem']['Row'] & {
  Product?: { name?: string };
};
type CustomerRow = Database['public']['Tables']['Customer']['Row'] & {
  User?: { name?: string };
};

export function useAgentOrdersSubscription(passedAgentId?: string) {
  const [, setOrders] = useAtom(agentOrdersAtom);
  const [, setUnread] = useAtom(unreadAgentOrdersCountAtom);

  useEffect(() => {
    console.log('[useAgentOrdersSubscription] effect start');
    const supabase = createClientComponentClient<Database>();

    let channel: RealtimeChannel | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function fetchAgentId(): Promise<{ id: string }> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('Agent')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) throw new Error('No agent found');
      return data;
    }

    async function initForAgent(agentId: string) {
      // Helper to fetch latest orders and update atoms
      async function fetchLatestOrders() {
        try {
          const res = await fetch(`/api/agent/orders?agentId=${agentId}`);
          const { orders } = await res.json();

          setOrders(orders);
          setUnread(orders.filter((o: AgentOrder) => o.isUnread).length);
        } catch (error) {
          console.error('[useAgentOrdersSubscription] fetchLatestOrders error:', error);
        }
      }

      // Initial fetch
      await fetchLatestOrders();

      // Set up realtime subscription only ONCE
      channel = supabase
        .channel(`agent-orders-${agentId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'Order', 
            filter: `agent_id=eq.${agentId}` 
          },
          async (payload) => {
            const newOrder = payload.new as OrderRow;
            console.log('[useAgentOrdersSubscription] New order:', newOrder.id);
            
            // Fetch full order details
            const { data: orderWithDetails } = await supabase
              .from('Order')
              .select(`
                id,
                short_id,
                status,
                payment_status,
                total_amount,
                created_at,
                pickup_code,
                dropoff_code,
                pickup_status,
                Customer:customer_id(
                  User:user_id(name)
                ),
                OrderItem:OrderItem(
                  id,
                  quantity,
                  price_at_purchase,
                  Product:product_id(name)
                )
              `)
              .eq('id', newOrder.id)
              .single();

            if (orderWithDetails) {
              const transformedOrder: AgentOrder = {
                id: orderWithDetails.id,
                short_id: orderWithDetails.short_id ?? undefined,
                created_at: orderWithDetails.created_at,
                status: orderWithDetails.status,
                payment_status: orderWithDetails.payment_status,
                total_amount: orderWithDetails.total_amount,
                customer_name: (orderWithDetails.Customer as any)?.User?.name || 'Customer',
                pickup_code: orderWithDetails.pickup_code ?? undefined,
                dropoff_code: orderWithDetails.dropoff_code ?? undefined,
                pickup_status: orderWithDetails.pickup_status ?? undefined,
                items: ((orderWithDetails.OrderItem as any[]) || []).map((item: any) => ({
                  id: item.id,
                  name: item.Product?.name,
                  quantity: item.quantity,
                  price: item.price_at_purchase,
                })),
                isNew: true,
                isUnread: true,
              };

              setOrders(prev => [transformedOrder, ...prev]);
              setUnread(count => count + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'Order', 
            filter: `agent_id=eq.${agentId}` 
          },
          async (payload) => {
            const updatedOrder = payload.new as OrderRow;
            console.log('[useAgentOrdersSubscription] Order updated:', updatedOrder.id);
            
            // Update the order in our state
            setOrders(prev => prev.map(order => {
              if (order.id === updatedOrder.id) {
                return {
                  ...order,
                  status: updatedOrder.status,
                  payment_status: updatedOrder.payment_status,
                  pickup_code: updatedOrder.pickup_code ?? undefined,
                  dropoff_code: updatedOrder.dropoff_code ?? undefined,
                  pickup_status: updatedOrder.pickup_status ?? undefined,
                };
              }
              return order;
            }));
          }
        )
        .subscribe();

      // Polling fallback (15s) – just refetch orders, don't create new subscriptions
      pollTimer = setInterval(() => {
        fetchLatestOrders();
      }, 15_000);
    }

    async function waitForSession() {
      let { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return session;
      
      return new Promise(resolve => {
        const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
          if (sess?.access_token) {
            listener?.subscription.unsubscribe();
            resolve(sess);
          }
        });
      });
    }

    // Initialize
    (async () => {
      try {
        const agentId = passedAgentId ?? (await fetchAgentId()).id;
        // We only need an authenticated session if we had to look up the agentId via profile lookup
        if (!passedAgentId) {
          await waitForSession();
        }
        await initForAgent(agentId);
      } catch (error) {
        console.error('[useAgentOrdersSubscription] Setup error:', error);
      }
    })();

    return () => {
      console.log('[useAgentOrdersSubscription] cleanup');
      channel?.unsubscribe();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [passedAgentId, setOrders, setUnread]);
}
