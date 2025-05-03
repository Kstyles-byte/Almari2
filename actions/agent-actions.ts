"use server";

import { createClient } from '@supabase/supabase-js';
import type { Tables } from '@/types/supabase';

/**
 * Server action to get all active agents
 * This can be called from client components safely
 */
export async function getActiveAgents(): Promise<{ 
  success: boolean; 
  agents?: Tables<'Agent'>[]; 
  error?: string 
}> {
  console.log("[Server Action] getActiveAgents called");
  
  try {
    // Get Supabase client directly to avoid circular dependencies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[Server Action] Missing Supabase credentials");
      return { 
        success: false, 
        error: "Server configuration error" 
      };
    }
    
    // Create client with available credentials
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("[Server Action] Querying agents");
    
    // Query agents with snake_case column names to match DB schema
    const { data: agents, error } = await supabase
      .from('Agent')
      .select('*')
      .eq('is_active', true)  // Using snake_case for DB column
      .order('name', { ascending: true });
    
    if (error) {
      console.error("[Server Action] Supabase query error:", error.message);
      // Return a user-friendly error message
      return { 
        success: false, 
        error: "Unable to load pickup locations. Please try again later." 
      };
    }
    
    console.log(`[Server Action] Successfully fetched ${agents?.length || 0} agents`);
    
    // Return successful response with data
    return { 
      success: true, 
      agents: agents || [] 
    };
  } catch (error) {
    // Handle any unexpected errors
    console.error("[Server Action] Unexpected error in getActiveAgents:", error);
    return { 
      success: false, 
      error: "An unexpected error occurred. Please try again later." 
    };
  }
} 