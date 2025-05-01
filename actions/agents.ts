"use server";

import { createServerActionClient } from '../lib/supabase/server';
// Removed Agent import as we define the structure locally
// import type { Agent } from '../types/supabase'; 

// Define the structure the component expects
interface AgentShowcaseData {
  id: string;
  name: string;
  description: string;
  hours: string;
  image: string;
}

/**
 * Get active agent locations for the showcase
 */
export async function getActiveAgents(limit = 3): Promise<AgentShowcaseData[]> {
  const supabase = await createServerActionClient(); // Client created inside function
  try {
    type AgentQueryResult = {
        id: string;
        name: string | null;
        location: string | null;
        operatingHours: string | null;
    };

    const { data: agentsData, error } = await supabase
      .from('Agent')
      .select('id, name, location, operatingHours')
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching active agents:", error.message);
      throw error;
    }

    if (!agentsData) {
      return [];
    }

    return (agentsData as AgentQueryResult[]).map(agent => ({
      id: agent.id,
      name: agent.name || 'Unnamed Location',
      description: agent.location || 'No description provided.',
      hours: agent.operatingHours || 'Not specified',
      image: '/images/locations/default-location.jpg'
    }));

  } catch (error) {
    console.error("Error processing active agents:", error);
    return [];
  }
}

/**
 * Fetches available pickup agents from the database.
 */
export async function getAvailableAgents() {
  const supabase = await createServerActionClient(); // Client created inside function
  const { data, error } = await supabase
    .from('Agent')
    .select('id, firstName, lastName, phone, location, isAvailable')
    .eq('isAvailable', true);

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
  return data;
}

// REMOVED placeholder functions like getAgentDetails, updateAgentStatus 