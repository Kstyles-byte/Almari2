import AgentLayout from '@/components/agent/AgentLayout';
import { createServerActionClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

  // Fetch agent record
  const { data: agentRecord } = await supabase
    .from('Agent')
    .select('name, email')
    .eq('user_id', user.id)
    .single();

  if (!agentRecord) {
    // Not an agent -> redirect home or error
    redirect('/');
  }

  return (
    <AgentLayout agentData={{ name: agentRecord.name || 'Agent', email: agentRecord.email }}>
      {children}
    </AgentLayout>
  );
} 