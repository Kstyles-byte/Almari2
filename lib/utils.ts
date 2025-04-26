import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine multiple class names with clsx and optimize with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price number as currency
 */
export function formatPrice(price: number, options: {
  currency?: 'USD' | 'EUR' | 'GBP' | 'BDT';
  notation?: Intl.NumberFormatOptions['notation'];
} = {}) {
  const { currency = 'USD', notation = 'compact' } = options;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(price);
}

/**
 * Generate a random number between min and max (inclusive)
 */
export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Truncate a string to a specific length and add an ellipsis
 */
export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 