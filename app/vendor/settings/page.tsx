import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { StoreDetailsForm, PaymentInfoForm, SecurityForm } from '../../../components/vendor/settings-form';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VendorSettingsPage() {
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

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  // Get vendor information
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select(`
      id,
      store_name,
      description,
      logo_url,
      banner_url, 
      commission_rate,
      bank_name,
      account_number,
      account_name,
      whatsapp_phone,
      User:user_id(name, email)
    `)
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading vendor data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendor Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <nav className="p-2">
              <div className="space-y-1">
                <a 
                  href="#store-details" 
                  className="block px-3 py-2 rounded-md bg-zervia-50 text-zervia-600 font-medium"
                >
                  Store Profile
                </a>
                <a 
                  href="#payment-info" 
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                >
                  Payment Information
                </a>
                <a 
                  href="/settings/notifications" 
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                >
                  Notifications
                </a>
                <a 
                  href="#security" 
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                >
                  Security
                </a>
              </div>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Store Profile */}
          <div id="store-details" className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Store Profile</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your store information and contact details</p>
            </div>
            <div className="p-6">
              <Suspense fallback={<div>Loading...</div>}>
                <StoreDetailsForm vendorData={vendorData} />
              </Suspense>
            </div>
          </div>
          
          {/* Payment Information */}
          <div id="payment-info" className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Payment Information</h2>
              <p className="text-sm text-gray-500 mt-1">Update your bank details for payouts</p>
            </div>
            <div className="p-6">
              <Suspense fallback={<div>Loading...</div>}>
                <PaymentInfoForm vendorData={vendorData} />
              </Suspense>
            </div>
          </div>
          
          {/* Security Settings */}
          <div id="security" className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your account security and password</p>
            </div>
            <div className="p-6">
              <Suspense fallback={<div>Loading...</div>}>
                <SecurityForm vendorData={vendorData} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 