import AdminLayout from '@/components/layout/AdminLayout';
import { getEnvironmentVariables } from '@/actions/admin-settings';
import { SettingsClient } from '@/components/admin/settings/settings-client';
import { PaystackSettings } from '@/components/admin/settings/paystack-settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const runtimeEnv = await getEnvironmentVariables();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-semibold">System Settings & Diagnostics</h1>

        <PaystackSettings />
        
        <SettingsClient initialEnvVars={runtimeEnv} />

        <section className="bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-medium mb-4">Quick Settings</h2>
          <div className="space-y-3">
            <a 
              href="/settings/notifications"
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM6 4h8v16H6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Notification Settings</h3>
                  <p className="text-sm text-gray-500">Manage your notification preferences</p>
                </div>
              </div>
            </a>
          </div>
        </section>

        <section className="bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-medium mb-4">Feature Flags (coming soon)</h2>
          <p className="text-sm text-gray-500">Placeholder – integrate Supabase Config table for editable flags.</p>
        </section>
      </div>
    </AdminLayout>
  );
} 