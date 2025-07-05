'use client';

import OrderList from './order-list';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import useSWR from 'swr';

interface Props {
  pickupStatus?: string;
  query?: string;
}

export default function AgentOrdersTable({ pickupStatus = '', query = '' }: Props) {
  // Fallback to client-side fetch for safety if some page still imports this component
  const supabase = createClientComponentClient();

  const fetchOrders = async () => {
    let q = supabase.from('Order').select('*').eq('agent_id', (await supabase.auth.getUser()).data.user?.id || '');
    if (pickupStatus) q = q.eq('pickup_status', pickupStatus);
    if (query) {
      const term = query.replace(/\s+/g, '');
      if (term.startsWith('D-')) {
        q = q.ilike('dropoff_code', `%${term}%`);
      } else if (/^[0-9]{4,}$/.test(term)) {
        q = q.eq('pickup_code', term);
      } else if (/^[0-9a-fA-F-]{36}$/.test(term)) {
        q = q.eq('id', term);
      } else {
        q = q.or(`dropoff_code.ilike.%${term}%,pickup_code.ilike.%${term}%`);
      }
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const { data: orders = [], isLoading, error } = useSWR(['agent-orders-fallback', pickupStatus, query], fetchOrders);

  if (error) return <p className="text-red-600 text-sm">{error.message}</p>;
  return <OrderList orders={isLoading ? [] : orders} />;
} 