import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

/**
 * Utility to create Supabase service role client.
 */
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient<Database>(url, serviceKey);
}

export async function upsertPreference(params: {
  userId: string;
  type: Database['public']['Enums']['NotificationType'];
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  enabled: boolean;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from('NotificationPreference').upsert({
    user_id: params.userId,
    type: params.type,
    channel: params.channel as any,
    enabled: params.enabled,
  });
  if (error) throw new Error(error.message);
}

export async function getPreferences(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('NotificationPreference')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data;
} 