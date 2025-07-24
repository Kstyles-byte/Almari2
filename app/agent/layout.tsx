import AgentLayout from '@/components/agent/AgentLayout';
import { createServerActionClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import AgentOrdersRealtimeProvider from '@/components/agent/AgentOrdersRealtimeProvider';

export const metadata = {
  title: 'Agent Dashboard',
};

export default async function AgentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // redirect to login
    redirect('/login');
  }

  // Fetch agent record - first try with the regular client
  let { data: agentRecord } = await supabase
    .from('Agent')
    .select('id, name, email')
    .eq('user_id', user.id)
    .single();

  // Fallback to admin client if needed (to bypass RLS issues)
  if (!agentRecord) {
    const { data } = await supabaseAdmin
      .from('Agent')
      .select('id, name, email')
      .eq('user_id', user.id)
      .maybeSingle();
    
    agentRecord = data;
  }

  if (!agentRecord) {
    // Not an agent -> redirect home or error
    redirect('/');
  }

  return (
    <AgentOrdersRealtimeProvider agentId={agentRecord.id}>
      <AgentLayout agentData={{ name: agentRecord.name || 'Agent', email: agentRecord.email }}>
        {children}
      </AgentLayout>
    </AgentOrdersRealtimeProvider>
  );
} 