'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { upsertPreference, getPreferences } from '../lib/services/notification-preference';
import type { Database } from '../types/supabase';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export async function getUserPreferencesAction() {
  const user = await getUser();
  const prefs = await getPreferences(user.id);
  return prefs;
}

export async function updatePreferenceAction(formData: FormData) {
  const user = await getUser();
  const type = formData.get('type') as Database['public']['Enums']['NotificationType'];
  const channel = formData.get('channel') as 'IN_APP' | 'EMAIL' | 'SMS';
  const enabled = formData.get('enabled') === 'true';
  if (!type || !channel) throw new Error('Invalid payload');
  await upsertPreference({
    userId: user.id,
    type,
    channel,
    enabled,
  });
  return { success: true };
} 