/**
 * Paystack API integration utility
 * 
 * This file contains functions for interacting with the Paystack API
 * for payment processing in the Almari e-commerce platform.
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_URL = "https://api.paystack.co";

/**
 * Create a payment initialization with Paystack
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
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
 * Verify a payment transaction with Paystack
 * @param reference - The transaction reference to verify
 * @returns The Paystack verification response
 */
export async function verifyPayment(reference: string) {
  try {
    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
 * List transactions from Paystack
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
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
 * Create a refund request for a transaction
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
    const response = await fetch(`${PAYSTACK_API_URL}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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