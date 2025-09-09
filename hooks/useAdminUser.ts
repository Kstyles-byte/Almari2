"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export function useAdminUser() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getUser() {
      try {
        // Get the current user from Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get additional user data from the User table
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('name, role')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          // Still set basic user info even if User table lookup fails
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Admin',
          });
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: userData?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Admin',
            role: userData?.role,
          });
        }
      } catch (error) {
        console.error('Error in useAdminUser:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
      } else {
        // Re-fetch user data when auth state changes
        getUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}
