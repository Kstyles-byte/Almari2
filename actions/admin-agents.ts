"use server";

import { createServerActionClient } from '../lib/supabase/server';
import { 
  getAllAgents,
  getAgentById,
  createAgent as createAgentService,
  updateAgent as updateAgentService,
  deleteAgent as deleteAgentService
} from '../lib/services/agent';
import type { Tables } from '../types/supabase';

/**
 * Get all agents with pagination and filtering
 */
export async function getAgents(options?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  try {
    return await getAllAgents(options);
  } catch (error) {
    console.error("Error in getAgents server action:", error);
    return {
      data: [],
      meta: { total: 0, page: options?.page || 1, limit: options?.limit || 10, pageCount: 0 },
    };
  }
}

/**
 * Get an agent by ID
 */
export async function getAgent(id: string) {
  try {
    const agent = await getAgentById(id);
    return { success: true, agent };
  } catch (error) {
    console.error("Error in getAgent server action:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get agent" };
  }
}

/**
 * Create a new agent
 */
export async function createAgent(data: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  operatingHours?: string;
  capacity?: number;
}) {
  try {
    const result = await createAgentService(data);
    return result;
  } catch (error) {
    console.error("Error in createAgent server action:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create agent" 
    };
  }
}

/**
 * Update an existing agent
 */
export async function updateAgent(agentId: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  operatingHours?: string;
  capacity?: number;
  isActive?: boolean;
}) {
  try {
    const result = await updateAgentService(agentId, data);
    return result;
  } catch (error) {
    console.error("Error in updateAgent server action:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update agent" 
    };
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string) {
  try {
    const result = await deleteAgentService(agentId);
    return result;
  } catch (error) {
    console.error("Error in deleteAgent server action:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete agent" 
    };
  }
}

/**
 * Toggle agent active status
 */
export async function toggleAgentStatus(agentId: string, isActive: boolean) {
  try {
    const result = await updateAgentService(agentId, { isActive: !isActive });
    return result;
  } catch (error) {
    console.error("Error in toggleAgentStatus server action:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to toggle agent status" 
    };
  }
} 