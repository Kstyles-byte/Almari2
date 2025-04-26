import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <div className="flex justify-center">
          <ShieldX className="h-24 w-24 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Unauthorized</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Access Denied</h2>
        </div>
        <p className="mx-auto max-w-[500px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Sorry, you don&apos;t have permission to access this page.
          Please sign in with the appropriate credentials or contact the administrator.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button asChild size="lg">
            <Link href="/auth/signin">
              Sign In
            </Link>
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