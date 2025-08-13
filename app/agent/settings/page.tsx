import PrinterSetup from '@/components/agent/PrinterSetup';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AgentSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/agent/dashboard" 
          className="text-sm text-zervia-600 hover:text-zervia-700 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">Agent Settings</h1>
        <p className="text-gray-600">Configure your printer and other settings</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Settings</h2>
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
        </div>

        <PrinterSetup />
      </div>
    </div>
  );
}
