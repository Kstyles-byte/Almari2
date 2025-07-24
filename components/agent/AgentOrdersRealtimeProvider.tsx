'use client';

import { ReactNode, useEffect } from 'react';
import { useAgentOrdersSubscription } from '@/hooks/useAgentOrdersSubscription';

interface AgentOrdersRealtimeProviderProps {
  children: ReactNode;
  agentId?: string;
}

export default function AgentOrdersRealtimeProvider({ 
  children, 
  agentId 
}: AgentOrdersRealtimeProviderProps) {
  useAgentOrdersSubscription(agentId);

  useEffect(() => {
    console.log('[AgentOrdersRealtimeProvider] mounted');
  }, []);

  return <>{children}</>;
}
