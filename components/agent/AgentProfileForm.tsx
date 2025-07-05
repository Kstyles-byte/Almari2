'use client';

import { useState, FormEvent } from 'react';
import { Tables } from '@/types/supabase';
import { toast } from 'sonner';

interface Props {
  agent: Tables<'Agent'>;
}

export default function AgentProfileForm({ agent }: Props) {
  const [formData, setFormData] = useState({
    name: agent.name ?? '',
    phone_number: agent.phone_number ?? '',
    operating_hours: agent.operating_hours ?? '',
    address_line1: agent.address_line1 ?? '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok && data.success) {
        toast.success('Profile updated');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (e: any) {
      setLoading(false);
      toast.error(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow rounded-md">
      <div>
        <label className="block text-sm font-medium mb-1">Location Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Operating Hours</label>
        <input
          name="operating_hours"
          value={formData.operating_hours}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          name="address_line1"
          value={formData.address_line1}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-zervia-600 text-white px-4 py-2 rounded hover:bg-zervia-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
} 