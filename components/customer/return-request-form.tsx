'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createReturnRequestAction } from '@/actions/returns';
import { Icons } from '@/components/icons';

// Define form schema with zod
const returnFormSchema = z.object({
  reason: z.string().min(1, { message: "Please select a reason for return" }),
  additionalDetails: z.string().optional(),
});

// Define the return reasons
const returnReasons = [
  { value: "damaged", label: "Item arrived damaged" },
  { value: "defective", label: "Item is defective" },
  { value: "wrong_item", label: "Received wrong item" },
  { value: "not_as_described", label: "Item not as described" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other reason" },
];

interface ReturnRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  orderItem: {
    orderId: string;
    productId: string;
    vendorId: string;
    agentId: string;
    productName: string;
    price: number;
  };
}

export default function ReturnRequestForm({ isOpen, onClose, orderItem }: ReturnRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form
  const form = useForm<z.infer<typeof returnFormSchema>>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      reason: "",
      additionalDetails: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof returnFormSchema>) => {
    setIsSubmitting(true);

    try {
      // Format the reason with both the category and details
      const selectedReason = returnReasons.find(r => r.value === values.reason);
      const formattedReason = values.additionalDetails
        ? `${selectedReason?.label}: ${values.additionalDetails}`
        : selectedReason?.label;

      // Create FormData for the server action
      const formData = new FormData();
      formData.append("orderId", orderItem.orderId);
      formData.append("productId", orderItem.productId);
      formData.append("vendorId", orderItem.vendorId);
      formData.append("agentId", orderItem.agentId);
      formData.append("reason", formattedReason || values.reason);
      formData.append("refundAmount", orderItem.price.toString());

      // Submit the return request
      const result = await createReturnRequestAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Return request submitted successfully");
        router.refresh();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a Return</DialogTitle>
          <DialogDescription>
            Please provide details about why you'd like to return {orderItem.productName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Return</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {returnReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any additional details about your return request"
                      className="resize-none h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
              <h4 className="font-medium flex items-center">
                <Icons.info className="h-4 w-4 mr-2" />
                Important information
              </h4>
              <ul className="ml-6 mt-1 list-disc text-xs space-y-1">
                <li>Returns must be requested within 24 hours of order pickup</li>
                <li>The vendor will review your return request</li>
                <li>If approved, you will receive a refund of ₦{orderItem.price.toFixed(2)}</li>
                <li>Refunds are typically processed within 3-5 business days</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 