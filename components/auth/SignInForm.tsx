'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { signInWithSupabase } from '../../actions/auth';
import { Loader2 } from 'lucide-react';

// Basic schema, can be expanded later
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Inner component that uses the hook
function SignInFormContent() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('[SignInForm] Submitting form with values:', values);
    console.log('[SignInForm] Callback URL:', callbackUrl);
    startTransition(async () => {
      console.log('[SignInForm] Starting transition...');
      console.log('[SignInForm] Calling signInWithSupabase action...');
      await signInWithSupabase(values, callbackUrl);
      console.log('[SignInForm] Transition function finished (may have redirected).');
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <div className="flex items-center">
                    <FormLabel htmlFor="password">Password</FormLabel>
                    <Link
                      href="/forgot-password" // TODO: Create this page later
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input id="password" type="password" required {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              Want to sell?{" "}
              <Link href="/signup/vendor" className="underline">
                Sign up as a Vendor
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// Exported component that wraps the form content with Suspense
export function SignInForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm"><Card><CardHeader><CardTitle>Loading...</CardTitle></CardHeader><CardContent><Loader2 className="h-8 w-8 animate-spin text-center" /></CardContent></Card></div>}> 
      <SignInFormContent />
    </Suspense>
  );
} 