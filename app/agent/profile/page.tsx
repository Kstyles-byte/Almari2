import AgentProfileForm from '@/components/agent/AgentProfileForm';
import { getCurrentAgent } from '@/actions/agent-dashboard';

export default async function AgentProfilePage() {
  const { success, data: agent, error } = await getCurrentAgent();
  if (!success || !agent) {
    return <p className="text-red-600">{error ?? 'Error loading profile'}</p>;
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
      <AgentProfileForm agent={agent} />
    </div>
  );
} 