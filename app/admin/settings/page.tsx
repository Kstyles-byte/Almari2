import AdminLayout from '@/components/layout/AdminLayout';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const runtimeEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-semibold">System Settings & Diagnostics</h1>

        <section className="bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-medium mb-4">Environment Variables</h2>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(runtimeEnv).map(([key, value]) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-2 font-mono text-gray-700 pr-4">{key}</td>
                  <td className="py-2 break-all text-gray-600">
                    {value ? (
                      <span className="text-green-700">SET</span>
                    ) : (
                      <span className="text-red-700">MISSING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white p-6 rounded-md shadow border">
          <h2 className="text-xl font-medium mb-4">Feature Flags (coming soon)</h2>
          <p className="text-sm text-gray-500">Placeholder – integrate Supabase Config table for editable flags.</p>
        </section>
      </div>
    </AdminLayout>
  );
} 