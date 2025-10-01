/**
 * Dynamic Paystack API integration utility
 * 
 * This file contains functions for interacting with the Paystack API
 * with dynamic configuration loading from database settings.
 */

import { createClient } from '@supabase/supabase-js';

const PAYSTACK_API_URL = "https://api.paystack.co";

// Supabase client for fetching settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Get current Paystack configuration from database or fallback to env vars
 */
export async function getPaystackConfig(): Promise<{
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}> {
  try {
    // Try to get settings from database first
    const { data: settings, error } = await supabase
      .from('PaystackSettings')
      .select('secret_key, public_key, webhook_secret')
      .limit(1)
      .single();

    if (!error && settings) {
      return {
        secretKey: settings.secret_key || process.env.PAYSTACK_SECRET_KEY || '',
        publicKey: settings.public_key || process.env.PAYSTACK_PUBLIC_KEY || '',
        webhookSecret: settings.webhook_secret || process.env.PAYSTACK_WEBHOOK_SECRET || '',
      };
    }
  } catch (dbError) {
    console.log('Database settings not available, using environment variables:', dbError);
  }

  // Fallback to environment variables
  return {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  };
}

/**
 * Create a payment initialization with Paystack using dynamic config
 * @param data - Payment initialization data
 * @returns The Paystack initialization response
 */
export async function initializePayment(data: {
  email: string;
  amount: number; // amount in kobo (1 Naira = 100 Kobo)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const config = await getPaystackConfig();
    
    if (!config.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to initialize payment");
    }

    return result;
  } catch (error) {
    console.error("Paystack payment initialization error:", error);
    throw error;
  }
}

/**
 * Verify a payment transaction with Paystack using dynamic config
 * @param reference - The transaction reference to verify
 * @returns The Paystack verification response
 */
export async function verifyPayment(reference: string) {
  try {
    const config = await getPaystackConfig();
    
    if (!config.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to verify payment");
    }

    return result;
  } catch (error) {
    console.error("Paystack payment verification error:", error);
    throw error;
  }
}

/**
 * List transactions from Paystack using dynamic config
 * @param params - Query parameters for listing transactions
 * @returns A list of transactions
 */
export async function listTransactions(params?: {
  perPage?: number;
  page?: number;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  status?: "failed" | "success" | "abandoned";
}) {
  try {
    const config = await getPaystackConfig();
    
    if (!config.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Build query string
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${PAYSTACK_API_URL}/transaction?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to list transactions");
    }

    return result;
  } catch (error) {
    console.error("Paystack list transactions error:", error);
    throw error;
  }
}

/**
 * Create a refund request for a transaction using dynamic config
 * @param data - Refund request data
 * @returns The refund request response
 */
export async function createRefund(data: {
  transaction: string; // transaction reference or id
  amount?: number; // amount to refund in kobo
  currency?: string; // currency code (NGN, GHS, ZAR, etc.)
  customer_note?: string; // note to customer
  merchant_note?: string; // note for merchant records
}) {
  try {
    const config = await getPaystackConfig();
    
    if (!config.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(`${PAYSTACK_API_URL}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create refund");
    }

    return result;
  } catch (error) {
    console.error("Paystack refund error:", error);
    throw error;
  }
}

/**
 * Verify webhook signature using dynamic config
 * @param signature - The x-paystack-signature header value
 * @param body - The raw request body as string
 * @returns Boolean indicating if the signature is valid
 */
export async function verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
  try {
    const config = await getPaystackConfig();
    
    if (!config.webhookSecret) {
      console.warn('Paystack webhook secret not configured, skipping verification');
      return false;
    }

    const crypto = await import('crypto');
    
    const hash = crypto
      .createHmac("sha512", config.webhookSecret)
      .update(body)
      .digest("hex");
    
    return hash === signature;
  } catch (error) {
    console.error("Error verifying Paystack signature:", error);
    return false;
  }
}