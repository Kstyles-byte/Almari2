'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  orderId: string;
  pickupCode?: string | null;
}

export default function VerifyPickupForm({ orderId, pickupCode }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!pickupCode) return;
    setLoading(true);
    try {
      const response = await fetch('/api/agent/verify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, code: pickupCode }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok && data.success) {
        toast.success('Pickup verified!');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to verify');
      }
    } catch (e: any) {
      setLoading(false);
      toast.error(e.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow max-w-sm space-y-4">
      <h3 className="font-medium">Verify Pickup</h3>
      <button
        onClick={handleVerify}
        disabled={loading || !pickupCode}
        className="bg-zervia-600 text-white px-4 py-2 rounded hover:bg-zervia-700 disabled:opacity-50 w-full"
      >
        {loading ? 'Verifying...' : 'Verify Pickup'}
      </button>
    </div>
  );
} 