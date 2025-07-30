import AdminLayout from '@/components/layout/AdminLayout';
import { getEnvironmentVariables } from '@/actions/admin-settings';
import { SettingsClient } from '@/components/admin/settings/settings-client';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const runtimeEnv = await getEnvironmentVariables();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-semibold">System Settings & Diagnostics</h1>

        <SettingsClient initialEnvVars={runtimeEnv} />

        <section className="bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-medium mb-4">Feature Flags (coming soon)</h2>
          <p className="text-sm text-gray-500">Placeholder – integrate Supabase Config table for editable flags.</p>
        </section>
      </div>
    </AdminLayout>
  );
} 