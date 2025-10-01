"use server";

import { createSupabaseServerActionClient } from '@/lib/supabase/action';
import { revalidatePath } from 'next/cache';

/**
 * Get current Paystack settings from database
 */
export async function getPaystackSettings(): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    // Get Paystack settings
    const { data: settings, error } = await supabase
      .from('PaystackSettings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching Paystack settings:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: settings || null 
    };
  } catch (error) {
    console.error('Error in getPaystackSettings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update Paystack settings in database
 */
export async function updatePaystackSettings(settings: {
  secret_key?: string;
  public_key?: string;
  webhook_secret?: string;
  is_live?: boolean;
}): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('PaystackSettings')
      .select('id')
      .limit(1)
      .single();

    const updatedData = {
      ...settings,
      updated_at: new Date().toISOString()
    };

    let error: any;
    if (existingSettings) {
      // Update existing settings
      ({ error } = await supabase
        .from('PaystackSettings')
        .update(updatedData)
        .eq('id', existingSettings.id));
    } else {
      // Create new settings
      ({ error } = await supabase
        .from('PaystackSettings')
        .insert(updatedData));
    }

    if (error) {
      console.error('Error updating Paystack settings:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error in updatePaystackSettings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test Paystack configuration by making a simple API call
 */
export async function testPaystackConnection(secretKey: string): Promise<{ 
  success: boolean; 
  error?: string;
  data?: any;
}> {
  try {
    const supabase = await createSupabaseServerActionClient();
    
    // Check if user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    // Test the secret key by fetching the account info
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: result.message || 'Invalid Paystack credentials' 
      };
    }

    return { 
      success: true, 
      data: { message: 'Paystack connection successful' }
    };
  } catch (error) {
    console.error('Error testing Paystack connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    };
  }
}