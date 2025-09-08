'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPayoutRequest } from '@/actions/vendor-orders';
import { useRouter } from 'next/navigation';

interface PayoutRequestFormProps {
  availableBalance: number;
  vendorData?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  };
}

// Form validation schema
const payoutSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Amount must be greater than zero' })
    .min(1000, { message: 'Minimum payout amount is ₦1,000' }),
  accountName: z.string().min(3, { message: 'Account name is required' }),
  accountNumber: z.string()
    .length(10, { message: 'Account number must be 10 digits' })
    .regex(/^\d+$/, { message: 'Account number must contain only digits' }),
  bankName: z.string().min(2, { message: 'Bank name is required' }),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

export default function PayoutRequestForm({ availableBalance, vendorData }: PayoutRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      accountName: vendorData?.account_name || '',
      accountNumber: vendorData?.account_number || '',
      bankName: vendorData?.bank_name || '',
      amount: undefined,
    },
  });

  const watchAmount = watch('amount');

  const onRequestMax = () => {
    const requestAmount = Math.max(1000, Math.floor(availableBalance));
    setValue('amount', requestAmount, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<PayoutFormData> = async (data) => {
    if (data.amount > availableBalance) {
      toast.error('Requested amount exceeds your available balance');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Debug: Submitting payout request with data:', data);
      
      // Create FormData for server action
      const formData = new FormData();
      formData.append('amount', data.amount.toString());
      formData.append('accountName', data.accountName);
      formData.append('accountNumber', data.accountNumber);
      formData.append('bankName', data.bankName);
      console.log('Captured request form data:', { amount: data.amount, bankName: data.bankName, accountName: data.accountName, accountNumber: data.accountNumber });
      
      const result = await createPayoutRequest(formData);
      console.log('Payout request result:', result);
      
      if (result?.success) {
        toast.success('Payout request submitted successfully');
        reset();
        // Refresh the page to show updated balance and payout history
        router.refresh();
      } else {
        console.error('Payout request failed:', result);
        toast.error(result?.error || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Error submitting payout request:', error);
      toast.error('Failed to submit payout request');
      console.error('Full error details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₦</span>
          </div>
          <input
            type="number"
            id="amount"
            {...register('amount')}
            className="block w-full pl-7 pr-12 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            placeholder="1000.00"
            disabled={isSubmitting || availableBalance < 1000}
            step="any"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={onRequestMax}
              className="text-xs text-zervia-600 hover:text-zervia-500 font-medium"
              disabled={isSubmitting || availableBalance < 1000}
            >
              MAX
            </button>
          </div>
        </div>
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Min: {formatCurrency(1000)}</span>
          <span>Available: {formatCurrency(availableBalance)}</span>
        </div>
      </div>
      
      <div>
        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
          Bank Name
        </label>
        <input
          type="text"
          id="bankName"
          {...register('bankName')}
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          disabled={isSubmitting}
          placeholder="e.g. Access Bank, GTBank, First Bank"
        />
        {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>}
      </div>
      
      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
          Account Name
        </label>
        <input
          type="text"
          id="accountName"
          {...register('accountName')}
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          disabled={isSubmitting}
          placeholder="Your full name as it appears on your account"
        />
        {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>}
      </div>
      
      <div>
        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Account Number
        </label>
        <input
          type="text"
          id="accountNumber"
          {...register('accountNumber')}
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          disabled={isSubmitting}
          maxLength={10}
          placeholder="10-digit account number"
        />
        {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>}
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || availableBalance < 1000 || !watchAmount || watchAmount < 1000}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Processing...
            </>
          ) : availableBalance < 1000 ? (
            'Insufficient Balance'
          ) : (
            'Request Payout'
          )}
        </button>
      </div>
      
      {availableBalance < 1000 && (
        <div className="mt-2 text-xs text-center text-yellow-600 bg-yellow-50 p-2 rounded-md">
          You need a minimum balance of {formatCurrency(1000)} to request a payout.
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Note: Payouts are processed within 1-2 business days. A 1% processing fee may apply.</p>
      </div>
    </form>
  );
} 