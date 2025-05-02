'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // No need to pass the session here; SessionProvider handles it internally
  return <SessionProvider>{children}</SessionProvider>;
} 