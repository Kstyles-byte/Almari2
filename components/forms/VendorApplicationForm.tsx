'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { Textarea } from "@/components/ui/textarea"; // For description
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { applyForVendor } from '@/actions/vendor'; // Adjust path if needed

// Zod schema mirroring the server action validation
const formSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit account number"),
});

export function VendorApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: "",
      description: "",
      bankName: "",
      accountNumber: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setFormMessage(null); // Clear previous messages
    startTransition(async () => {
      const result = await applyForVendor(values);

      if (result?.error) {
        setFormMessage({ type: 'error', message: result.error });
        // Optionally parse result.issues to set field-specific errors
        // if (result.issues) {
        //   Object.keys(result.issues).forEach((field) => {
        //     form.setError(field as keyof typeof values, { 
        //       type: 'server', 
        //       message: result.issues[field]?.[0] 
        //     });
        //   });
        // }
      } else if (result?.success) {
        setFormMessage({ type: 'success', message: result.message || 'Application submitted successfully!' });
        form.reset(); // Clear form on success
      }
    });
  }

  return (
    <Card className="w-full max-w-lg mx-auto"> {/* Center card */} 
      <CardHeader>
        <CardTitle className="text-2xl">Vendor Application</CardTitle>
        <CardDescription>
          Fill in your store details below to apply to become a vendor.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="grid gap-4">
            {formMessage && (
              <div
                className={`p-4 rounded-md text-sm ${formMessage.type === 'error' 
                  ? 'bg-red-100 border border-red-400 text-red-700' 
                  : 'bg-green-100 border border-green-400 text-green-700'}`}
                role="alert"
              >
                <p className="font-bold">{formMessage.type === 'error' ? 'Error' : 'Success'}</p>
                <p>{formMessage.message}</p>
              </div>
            )}
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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
                  <FormLabel>Bank Account Number (NUBAN)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="0123456789" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 