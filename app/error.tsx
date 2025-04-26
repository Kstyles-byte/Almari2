'use client';

import React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <div className="flex justify-center">
          <AlertTriangle className="h-24 w-24 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">500</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Server Error</h2>
        </div>
        <p className="mx-auto max-w-[500px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Sorry, something went wrong on our server.
          We&apos;re working to fix the issue. Please try again later.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button onClick={() => reset()} size="lg">
            Try Again
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 