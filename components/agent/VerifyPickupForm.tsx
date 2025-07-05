'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  orderId: string;
}

export default function VerifyPickupForm({ orderId }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      const response = await fetch('/api/agent/verify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, code }),
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
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow max-w-sm space-y-4">
      <h3 className="font-medium">Verify Pickup</h3>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="Enter pickup code"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-zervia-600 text-white px-4 py-2 rounded hover:bg-zervia-700 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>
    </form>
  );
} 