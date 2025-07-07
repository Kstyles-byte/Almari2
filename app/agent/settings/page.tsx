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

      <PrinterSetup />
    </div>
  );
}
