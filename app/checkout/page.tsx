import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { decodeSupabaseCookie } from '@/lib/supabase/cookie-utils';
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
          const raw = cookieStore.get(name)?.value;
          return decodeSupabaseCookie(raw);
        },
        // In a Server Component we cannot modify cookies; provide no-ops so
        // Supabase won't throw, but cookies remain unchanged.
        set() {},
        remove() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Check authentication directly via Supabase client
  const { data: { user } } = await supabase.auth.getUser();

  const isGuest = !user;

  // Pre-fetch the data needed for checkout
  let initialCart;
  // Initialize with empty arrays to avoid undefined
  let initialAddresses: any[] = [];
  let initialAgents: any[] = [];

  try {
    if (!isGuest) {
      // Authenticated user: fetch cart and addresses
      const cartResult = await getCart();
      // If cart is empty immediately after login it may be because the
      // guest-cart merge has not yet happened.  Do NOT redirect; just
      // pass an empty initialCart and let the client-side CartProvider
      // sync + merge on first load.
      initialCart = cartResult.cart ?? null;

      const [addressesResult, agentsResult] = await Promise.all([
        getUserAddresses(),
        getActiveAgents(),
      ]);

      initialAddresses = addressesResult.addresses || [];
      initialAgents = agentsResult.agents || [];
    } else {
      // Guest user: no server cart or addresses. Still fetch agents.
      const agentsResult = await getActiveAgents();
      initialAgents = agentsResult.agents || [];
    }
  } catch (error) {
    console.error('Error loading checkout data:', error);
  }

  const userEmail = user?.email ?? '';
  let userName = '';
  if (user) {
    const { data: profile } = await supabase
      .from('User')
      .select('name')
      .eq('id', user.id)
      .single();
    userName = profile?.name || '';
  }

  // Now render the client component with pre-fetched data
  return (
    <CheckoutClient 
      initialCart={initialCart}
      initialAddresses={initialAddresses}
      initialAgents={initialAgents}
      userEmail={userEmail}
      userName={userName}
    />
  );
} 