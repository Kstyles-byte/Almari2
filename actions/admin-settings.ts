"use server";

import { createSupabaseServerActionClient } from '@/lib/supabase/action';

/**
 * Fetch environment variables for admin settings.
 */
export async function getEnvironmentVariables() {
  // Only return Paystack-related keys for admin management
  return {
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || 'MISSING',
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || 'MISSING',
    PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || 'MISSING',
  };
}

