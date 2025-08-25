import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VendorPendingPage() {
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
    return redirect('/login?message=Please+log+in+to+access+your+account.');
  }

  // Get vendor data to verify status
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('is_approved, store_name')
    .eq('user_id', user.id)
    .single();

  // If no vendor record found or error, redirect to account
  if (vendorError || !vendorData) {
    return redirect('/account');
  }

  // If approved, redirect to vendor dashboard
  if (vendorData.is_approved) {
    return redirect('/vendor/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Application Pending
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your vendor account is awaiting approval
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-6 inline-flex rounded-full bg-yellow-100 p-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {vendorData.store_name}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Your vendor application is currently under review. Our team will evaluate your application and get back to you soon. You&apos;ll receive an email notification once your account is approved.
            </p>
            
            <div className="mt-6 flex flex-col space-y-3">
              <Link href="/" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500">
                Return to Homepage
              </Link>
              <Link href="/customer/dashboard" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500">
                Customer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 