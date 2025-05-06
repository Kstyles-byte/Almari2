'use client';

import React, { useState, useTransition, Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

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
import { transferGuestCartToUserCart } from '@/utils/transfer-guest-cart';
import { getGuestCartItems } from '@/lib/services/guest-cart';

// Basic schema, can be expanded later
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Inner component that uses the hook
function SignInFormContent() {
  const [isPending, startTransition] = useTransition();
  const [hasGuestItems, setHasGuestItems] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || undefined;

  // Check if there are guest cart items
  useEffect(() => {
    // Check if there are guest cart items that would need transferring
    const guestItems = getGuestCartItems();
    setHasGuestItems(guestItems.length > 0);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('[SignInForm] Submitting form with values:', values);
    console.log('[SignInForm] Callback URL:', callbackUrl);
    startTransition(async () => {
      try {
        console.log('[SignInForm] Starting transition...');
        console.log('[SignInForm] Calling signInWithSupabase action...');
        const result = await signInWithSupabase(values, callbackUrl);
        
        // If login is successful and there are guest cart items, transfer them
        if (result?.success && hasGuestItems) {
          console.log('[SignInForm] Transferring guest cart items...');
          
          // Show toast notification for user awareness
          toast.info('Transferring your guest cart items...');
          
          try {
            const transferResult = await transferGuestCartToUserCart();
            if (transferResult.success && transferResult.transferredItems > 0) {
              toast.success(`${transferResult.transferredItems} item(s) transferred to your cart!`);
            }
          } catch (transferError) {
            console.error('Error transferring cart items:', transferError);
            toast.error('Failed to transfer some cart items');
          }
        }
        
        console.log('[SignInForm] Transition function finished (may have redirected).');
      } catch (error) {
        console.error('[SignInForm] Error during login:', error);
      }
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
      {hasGuestItems && (
        <div className="px-6 -mt-4 mb-4">
          <p className="text-sm bg-blue-50 text-blue-700 p-2 rounded">
            Items in your guest cart will be transferred to your account after login.
          </p>
        </div>
      )}
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