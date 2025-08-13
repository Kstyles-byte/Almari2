import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { Database } from '@/types/supabase';

// Add dynamic export configuration
export const dynamic = 'force-dynamic';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export default async function NotificationSettingsDemoPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get user session using Supabase SSR client
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login?message=Please+log+in+to+view+notification+settings+demo');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings Demo</h1>
          <p className="mt-2 text-gray-600">
            This is a demo page to showcase the notification system. Click the link below to access the full notification settings.
          </p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Phase 10 Implementation Complete ✅</h2>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-medium">✅ Completed Features:</h3>
              <ul className="text-green-700 text-sm mt-2 space-y-1">
                <li>• Comprehensive notification settings UI</li>
                <li>• Role-based notification type management</li>
                <li>• Channel preference controls (IN_APP, PUSH)</li>
                <li>• Quiet hours configuration</li>
                <li>• Frequency and timing settings</li>
                <li>• Integration with existing notification system</li>
                <li>• Supabase SSR client authentication</li>
                <li>• RLS bypass for service operations</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-medium">📱 User Experience Features:</h3>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• Tabbed interface for easy navigation</li>
                <li>• Critical notifications cannot be disabled</li>
                <li>• Real-time preference updates</li>
                <li>• Role-specific notification categories</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-purple-800 font-medium">🔗 Access Points:</h3>
              <ul className="text-purple-700 text-sm mt-2 space-y-1">
                <li>• Customer Settings: /customer/settings</li>
                <li>• Vendor Settings: /vendor/settings</li>
                <li>• Admin Settings: /admin/settings</li>
                <li>• Agent Settings: /agent/settings</li>
                <li>• Direct Access: /settings/notifications</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <a 
              href="/settings/notifications"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open Notification Settings
            </a>
            <a 
              href="/customer/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Customer Settings
            </a>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current User Information</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
