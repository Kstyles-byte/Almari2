import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import VendorLayout from '@/components/layout/vendor-layout';

export const dynamic = 'force-dynamic';

export default async function VendorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?callbackUrl=/vendor/dashboard&message=Please+log+in+to+access+the+vendor+dashboard.');
  }

  // Get user role using service role key to bypass RLS
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  const { data: userData, error: userError } = await supabaseAdmin
    .from('User')
    .select('role, Vendor!inner(store_name, logo_url, is_approved)')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user data in VendorRootLayout:", userError?.message);
    return redirect('/login?callbackUrl=/vendor/dashboard&message=Error+retrieving+user+role.+Please+try+again.');
  }

  // If not a vendor, redirect to appropriate dashboard
  if (userData?.role !== 'VENDOR') {
    const role = userData?.role?.toLowerCase() || 'customer';
    return redirect(`/${role}/dashboard`);
  }

  const vendorDetails = Array.isArray(userData.Vendor) ? userData.Vendor[0] : userData.Vendor;

  if (!vendorDetails) {
    console.error("Vendor details not found for user:", user.id);
    return redirect('/login?callbackUrl=/vendor/dashboard&message=Vendor+details+not+found.');
  }

  // If vendor account is not approved, redirect to pending page
  if (!vendorDetails.is_approved) {
    return redirect('/account/vendor-pending');
  }

  // Pass the vendor data to the layout
  const vendorData = {
    email: user.email,
    storeName: vendorDetails.store_name || 'Your Store',
    logoUrl: vendorDetails.logo_url,
  };

  return <VendorLayout vendorData={vendorData}>{children}</VendorLayout>;
} 