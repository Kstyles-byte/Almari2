/**
 * Client-side Paystack utilities
 * This file contains functions that can be safely used on the client-side
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Get Paystack public key for client-side use
 * Falls back to environment variable if database setting is not available
 */
export async function getPaystackPublicKey(): Promise<string> {
  try {
    // Try to get from database first (will only work if user has access)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: settings, error } = await supabase
      .from('PaystackSettings')
      .select('public_key')
      .limit(1)
      .single();

    if (!error && settings && settings.public_key) {
      return settings.public_key;
    }
  } catch (error) {
    console.log('Database settings not available for public key, using environment variable');
  }

  // Fallback to environment variable
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
}

/**
 * Check if we're in live mode
 */
export async function isPaystackLiveMode(): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: settings, error } = await supabase
      .from('PaystackSettings')
      .select('is_live')
      .limit(1)
      .single();

    if (!error && settings) {
      return settings.is_live || false;
    }
  } catch (error) {
    console.log('Database settings not available for live mode check');
  }

  // Default to false (test mode)
  return false;
}