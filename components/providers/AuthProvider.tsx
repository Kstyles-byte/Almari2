'use client';

import React from 'react';
import { SessionProvider as SupabaseSessionProvider } from '@/components/auth/session-provider';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <SupabaseSessionProvider>{children}</SupabaseSessionProvider>;
} 