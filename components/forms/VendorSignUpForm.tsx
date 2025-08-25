'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { signUpAsVendor } from '@/actions/auth'; // Import the correct server action

// Zod schema for combined Vendor SignUp (matches the one in actions/auth.ts)
// It includes fields from SignUpSchema and vendor-specific fields
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit account number"),
  whatsappPhone: z.string().min(10, "WhatsApp phone number is required (10+ digits)").regex(/^[+]?[0-9]{10,15}$/, "Enter a valid WhatsApp phone number"),
});

export function VendorSignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  // Note: This form redirects on success/error handled by the server action, 
  // so we primarily focus on displaying initial validation errors or unexpected action errors.

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      storeName: "",
      description: "",
      bankName: "",
      accountNumber: "",
      whatsappPhone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null);
    startTransition(async () => {
      try {
        // Server action handles redirect on success/known errors
        await signUpAsVendor(values);
        // If it doesn't redirect, an unexpected error might have occurred, but typically handled by Next.js error boundaries
      } catch (err) {
        // Catch unexpected errors during the action call itself
        console.error("Unexpected error during vendor sign up:", err);
        setFormError("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <Card className="w-full max-w-lg mx-auto"> {/* Adjust width as needed */} 
      <CardHeader>
        <CardTitle className="text-2xl">Vendor Sign Up</CardTitle>
        <CardDescription>
          Create your account and register your store.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Grid layout */} 
            {/* Display general form error */}
            {formError && (
              <div className="md:col-span-2 p-4 rounded-md text-sm bg-red-100 border border-red-400 text-red-700" role="alert">
                  <p className="font-bold">Error</p>
                  <p>{formError}</p>
              </div>
            )}
            {/* User Fields */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="md:col-span-2"> {/* Span password across */} 
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* WhatsApp Phone Field */}
            <FormField
              control={form.control}
              name="whatsappPhone"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>WhatsApp Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., +2348123456789 or 08123456789" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Vendor Fields */}
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kamsy Tech Gadgets" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Store Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell customers about your store..." {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Zenith Bank" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number (NUBAN)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0123456789" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-center"> {/* Center content */} 
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing Up...' : 'Sign Up as Vendor'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign In
              </Link>
               <span className="mx-2">|</span> 
              <Link href="/signup" className="underline">
                Sign Up as Customer
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 