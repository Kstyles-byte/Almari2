"use client";
import { useTransition } from 'react';
import { updatePreferenceAction } from '../../actions/notification-preferences';
import type { Database } from '../../types/supabase';

interface Props {
  initialData: any[]; // Replace with proper type later
}

export default function PreferenceForm({ initialData }: Props) {
  const [pending, startTransition] = useTransition();

  // Map initial data to record
  const prefMap = new Map<string, boolean>();
  initialData?.forEach((p) => {
    prefMap.set(`${p.type}_${p.channel}`, p.enabled);
  });

  const handleChange = (type: Database['public']['Enums']['NotificationType'], channel: 'IN_APP' | 'EMAIL' | 'SMS') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    startTransition(async () => {
      const fd = Object.entries({ type, channel, enabled: String(enabled) }).reduce((acc, [k, v]) => {
        acc.append(k, v as string);
        return acc;
      }, new FormData());
      await updatePreferenceAction(fd as any);
    });
  };

  return (
    <div className="space-y-6">
      {[
        'ORDER_STATUS_CHANGE',
        'NEW_ORDER_VENDOR',
        'ORDER_SHIPPED',
        'ORDER_DELIVERED',
        'PAYMENT_FAILED',
      ].map((t) => (
        <div key={t} className="flex items-center justify-between border-b pb-2">
          <span>{t.replaceAll('_', ' ')}</span>
          <input
            type="checkbox"
            defaultChecked={prefMap.get(`${t}_IN_APP`) ?? true}
            onChange={handleChange(t as any, 'IN_APP')}
          />
        </div>
      ))}
    </div>
  );
} 