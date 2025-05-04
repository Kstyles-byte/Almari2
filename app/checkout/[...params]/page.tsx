import { redirect } from 'next/navigation';

// This forces dynamic rendering for checkout routes
export const dynamic = 'force-dynamic';

// This will redirect any sub-paths back to the main checkout page
export default function CheckoutCatchAll() {
  redirect('/checkout');
  
  // This part won't be reached but is required for TypeScript
  return null;
} 