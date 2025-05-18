'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutRequestFormProps {
  availableBalance: number;
}

// Form validation schema
const payoutSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Amount must be greater than zero' })
    .min(5000, { message: 'Minimum payout amount is ₦5,000' }),
  accountName: z.string().min(3, { message: 'Account name is required' }),
  accountNumber: z.string()
    .length(10, { message: 'Account number must be 10 digits' })
    .regex(/^\d+$/, { message: 'Account number must contain only digits' }),
  bankName: z.string().min(2, { message: 'Bank name is required' }),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

export default function PayoutRequestForm({ availableBalance }: PayoutRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      accountName: '',
      accountNumber: '',
      bankName: '',
      amount: undefined,
    },
  });

  const watchAmount = watch('amount');

  const onRequestMax = () => {
    const requestAmount = Math.max(5000, Math.floor(availableBalance));
    setValue('amount', requestAmount, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<PayoutFormData> = async (data) => {
    if (data.amount > availableBalance) {
      toast.error('Requested amount exceeds your available balance');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting payout request:', data);
      // This would be a server action in a real implementation
      // await createPayoutRequest(data);
      
      await new Promise(res => setTimeout(res, 1500));
      
      toast.success('Payout request submitted successfully');
      reset();
      
      // In a real app, we would revalidate the page here to show updated data
    } catch (error) {
      console.error('Error submitting payout request:', error);
      toast.error('Failed to submit payout request');
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
            placeholder="5000.00"
            disabled={isSubmitting || availableBalance < 5000}
            step="any"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={onRequestMax}
              className="text-xs text-zervia-600 hover:text-zervia-500 font-medium"
              disabled={isSubmitting || availableBalance < 5000}
            >
              MAX
            </button>
          </div>
        </div>
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Min: {formatCurrency(5000)}</span>
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
        />
        {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>}
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || availableBalance < 5000 || !watchAmount || watchAmount < 5000}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Processing...
            </>
          ) : availableBalance < 5000 ? (
            'Insufficient Balance'
          ) : (
            'Request Payout'
          )}
        </button>
      </div>
      
      {availableBalance < 5000 && (
        <div className="mt-2 text-xs text-center text-yellow-600 bg-yellow-50 p-2 rounded-md">
          You need a minimum balance of {formatCurrency(5000)} to request a payout.
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Note: Payouts are processed within 2-3 business days. A 1% processing fee may apply.</p>
      </div>
    </form>
  );
} 