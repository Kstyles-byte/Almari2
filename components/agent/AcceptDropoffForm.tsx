'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';

interface Props {
  orderId: string;
}

export default function AcceptDropoffForm({ orderId }: Props) {
  const [loading, setLoading] = useState(false);
  // const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/agent/accept-dropoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Drop-off accepted successfully!');
        // Navigate directly to label page (same tab) to avoid popup blocking
        router.push(`/agent/dropoff-label/${orderId}`);
        return;
      } else {
        toast.error(data.error || 'Unable to accept drop-off');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openPrintLabel = () => {
    window.open(`/agent/dropoff-label/${orderId}`, '_blank');
  };

  return (
    <div className="bg-white p-4 rounded-md shadow max-w-sm space-y-4">
      <h3 className="font-medium">Accept Vendor Drop-off</h3>
      
      <button
        onClick={handleAccept}
        disabled={loading}
        className="bg-zervia-600 text-white px-4 py-2 rounded hover:bg-zervia-700 disabled:opacity-50 w-full"
      >
        {loading ? 'Accepting...' : 'Accept Drop-off'}
      </button>
    </div>
  );
}
