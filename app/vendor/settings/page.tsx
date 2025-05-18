import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Save, UploadCloud } from 'lucide-react';

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
      User:user_id(name, email)
    `)
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return <div>Error loading vendor data</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
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
                  Store Details
                </a>
                <a 
                  href="#payment-info" 
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                >
                  Payment Information
                </a>
                <a 
                  href="#appearance" 
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                >
                  Appearance
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
          {/* Store Details */}
          <div id="store-details" className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Store Details</h2>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    id="store-name"
                    defaultValue={vendorData.store_name}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Store Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    defaultValue={vendorData.description || ''}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 mb-1">
                    Store Logo
                  </label>
                  <div className="flex items-center mt-2">
                    <div className="flex-shrink-0 h-16 w-16 relative bg-gray-100 rounded-md overflow-hidden">
                      {vendorData.logo_url ? (
                        <Image
                          src={vendorData.logo_url}
                          alt="Store Logo"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                          <span className="text-xs">No Logo</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ml-5 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                    >
                      <UploadCloud size={16} className="inline mr-1" />
                      Change
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="banner-upload" className="block text-sm font-medium text-gray-700 mb-1">
                    Store Banner
                  </label>
                  <div className="flex items-center mt-2">
                    <div className="flex-shrink-0 h-24 w-full max-w-md relative bg-gray-100 rounded-md overflow-hidden">
                      {vendorData.banner_url ? (
                        <Image
                          src={vendorData.banner_url}
                          alt="Store Banner"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                          <span className="text-xs">No Banner</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-3 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                  >
                    <UploadCloud size={16} className="inline mr-1" />
                    Upload Banner
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                  >
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Payment Information */}
          <div id="payment-info" className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Payment Information</h2>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bank-name"
                      defaultValue={vendorData.bank_name || ''}
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="account-number" className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      id="account-number"
                      defaultValue={vendorData.account_number || ''}
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center">
                    <div className="bg-yellow-50 rounded-md p-4 w-full">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Commission Information
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Your current commission rate is {vendorData.commission_rate}%. This means for each sale, {vendorData.commission_rate}% will be deducted as platform fee.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                  >
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Security Settings */}
          <div id="security" className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Security</h2>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    defaultValue={vendorData.User?.[0]?.email || ''}
                    disabled
                    className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                  >
                    <Save size={16} className="mr-2" />
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 