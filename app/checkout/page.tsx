import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import { getCart } from '@/actions/cart';
import { getUserAddresses } from '@/actions/profile';
import { getActiveAgents } from '@/actions/agent-actions';

// Force dynamic rendering 
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  // Create Supabase client using SSR helper - await cookies() call
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check authentication directly via Supabase client
  const { data: { user } } = await supabase.auth.getUser();
  
  // Initialize with empty arrays to avoid undefined
  let initialCart;
  let initialAddresses: any[] = [];
  let initialAgents: any[] = [];

  try {
    // Fetch cart data - need to get cart regardless of auth status
    const cartResult = await getCart();
    
    // If cart is empty, redirect to cart page
    if (!cartResult.success || !cartResult.cart?.items?.length) {
      redirect('/cart?message=Your+cart+is+empty');
    }
    
    initialCart = cartResult.cart;

    // If authenticated, fetch addresses and agents
    if (user) {
      // Fetch addresses and agents in parallel
      const [addressesResult, agentsResult] = await Promise.all([
        getUserAddresses(),
        getActiveAgents()
      ]);
      
      // Ensure we always have arrays, even if empty
      initialAddresses = addressesResult.addresses || [];
      initialAgents = agentsResult.agents || [];
    } else {
      // If not authenticated, redirect to login page with callback to checkout
      // This will be handled in the updated CheckoutClient component
      initialAgents = await getActiveAgents().then(res => res.agents || []);
    }
  } catch (error) {
    console.error('Error loading checkout data:', error);
    // In case of error, we'll still render the page and let client-side 
    // error handling take over
  }

  // Get user's email from Supabase or empty string if not authenticated
  const userEmail = user?.email || '';
  const isAuthenticated = !!user;

  // Now render the client component with pre-fetched data
  return (
    <CheckoutClient 
      initialCart={initialCart}
      initialAddresses={initialAddresses}
      initialAgents={initialAgents}
      userEmail={userEmail}
      isAuthenticated={isAuthenticated}
    />
  );
} 