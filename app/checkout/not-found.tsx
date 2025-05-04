import { redirect } from 'next/navigation';

export default function CheckoutNotFound() {
  // This will redirect back to the checkout page if not found
  redirect('/checkout');
  
  // This part won't be reached but is required for TypeScript
  return null;
} 