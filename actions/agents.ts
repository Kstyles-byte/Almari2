"use server";

import { createClient } from '../lib/supabase/server';
// Removed Agent import as we define the structure locally
// import type { Agent } from '../types/supabase'; 

// Initialize Supabase client
const supabase = createClient();

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
  try {
    // Define the structure expected from the Supabase query
    type AgentQueryResult = {
        id: string;
        name: string | null;
        location: string | null;
        operatingHours: string | null;
        // image: string | null; // Add if you have an image field
    };

    const { data: agentsData, error } = await supabase
      .from('Agent')
      .select(`
        id,
        name,       
        location,   
        operatingHours
      `)
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

    // Map the query result to the showcase data structure
    return (agentsData as AgentQueryResult[]).map(agent => ({
      id: agent.id,
      name: agent.name || 'Unnamed Location',
      description: agent.location || 'No description provided.',
      hours: agent.operatingHours || 'Not specified',
      image: '/images/locations/default-location.jpg' // Placeholder default image
    }));

  } catch (error) {
    console.error("Error processing active agents:", error);
    return [];
  }
} 