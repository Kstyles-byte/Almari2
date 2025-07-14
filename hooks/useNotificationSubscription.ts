"use client";
import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/supabase';
import { useAtom } from 'jotai';
import { unreadNotificationCountAtom } from '../lib/atoms';

/**
 * Subscribes to realtime changes on Notification table for the authenticated user.
 * Updates Jotai atom with unread count.
 */
export function useNotificationSubscription() {
  const [count, setCount] = useAtom(unreadNotificationCountAtom);

  useEffect(() => {
    const supabase = createClientComponentClient<Database>();

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Initial count fetch
      const { data, error } = await supabase
        .from('UserUnreadNotificationCount')
        .select('unread_count')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) setCount(data.unread_count);

      // Subscribe to changes on Notification table
      subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Notification',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Just refetch count on any change
            supabase
              .from('UserUnreadNotificationCount')
              .select('unread_count')
              .eq('user_id', user.id)
              .maybeSingle()
              .then(({ data }) => {
                if (data) setCount(data.unread_count);
              });
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
} 