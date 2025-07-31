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
    // Define the actual query result structure
    type AgentQueryResult = {
        id: string;
        name: string | null;
        address_line1: string | null; // Select the actual address column
        operating_hours: string | null; // Use snake_case
    };

    const { data: agentsData, error } = await supabase
      .from('Agent')
      .select('id, name, address_line1, operating_hours') // Fetch correct columns
      .eq('is_active', true) // Use snake_case for boolean column
      .order('created_at', { ascending: false }) // Use snake_case
      .limit(limit);

    if (error) {
      console.error("Error fetching active agents:", error.message);
      throw error;
    }

    if (!agentsData) {
      return [];
    }

    // Map using the correct field names from the query result
    // Use double assertion to handle potential TS inference issues
    return (agentsData as unknown as AgentQueryResult[]).map(agent => ({
      id: agent.id,
      name: agent.name || 'Unnamed Location',
      description: agent.address_line1 || 'No address provided.', // Use address_line1 for description
      hours: agent.operating_hours || 'Not specified', // Use operating_hours
      image: '/images/location-pin.svg' // Use location pin SVG as default image
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
  // Updated select to use snake_case and likely correct address column
  const { data, error } = await supabase
    .from('Agent')
    .select('id, name, phone_number, address_line1, is_active') // Assuming name, phone_number, address_line1, is_active exist
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
  return data;
}

// REMOVED placeholder functions like getAgentDetails, updateAgentStatus 