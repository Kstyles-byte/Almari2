'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  orderId: string;
}

export default function AcceptDropoffForm({ orderId }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    // Open a blank tab immediately to keep the browser popup context
    const printWindow = window.open('', '_blank');

    try {
      const res = await fetch('/api/agent/accept-dropoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Drop-off accepted');
        // Navigate the previously opened window to the printable label
        if (printWindow) {
          printWindow.location.href = `/agent/dropoff-label/${orderId}`;
        }
        // Redirect back to dashboard so that status counts update immediately
        router.push('/agent/dashboard');
        router.refresh();
      } else {
        toast.error(data.error || 'Unable to accept');
        // Close the tab if accept failed
        if (printWindow) printWindow.close();
      }
    } catch (err: any) {
      toast.error(err.message);
      if (printWindow) printWindow.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow max-w-sm space-y-4">
      <h3 className="font-medium">Accept Vendor Drop-off</h3>
      <input
        type="text"
        placeholder="Enter drop-off code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-zervia-600 text-white px-4 py-2 rounded hover:bg-zervia-700 disabled:opacity-50"
      >
        {loading ? 'Accepting...' : 'Accept'}
      </button>
    </form>
  );
} 