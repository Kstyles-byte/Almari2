'use client';

import React, { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStatus } from 'react-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { applyCoupon, type ApplyCouponState } from '../../actions/coupon';

interface CouponInputFormProps {
  cartSubtotal: number;
  // Callback to pass the applied discount and coupon code back to the parent cart page
  onCouponApply: (discount: number, couponCode: string | null) => void; 
}

// Submit button component to show pending state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="outline" type="submit" disabled={pending}>
      {pending ? 'Applying...' : 'Apply'}
    </Button>
  );
}

export function CouponInputForm({ cartSubtotal, onCouponApply }: CouponInputFormProps) {
  const initialState: ApplyCouponState = { success: false, message: "" };
  const [state, formAction] = useActionState(applyCoupon, initialState);
  
  // State to keep track of the entered coupon code for display/clearing
  const [couponCodeInput, setCouponCodeInput] = React.useState("");
  // State to track the *currently applied* valid coupon code
  const [appliedCouponCode, setAppliedCouponCode] = React.useState<string | null>(null);

  // Effect to handle successful coupon application or errors
  React.useEffect(() => {
    if (state?.success && state.discount !== undefined && state.couponCode) {
       // Pass discount and code up to parent
      onCouponApply(state.discount, state.couponCode);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('zervia_coupon_code', state.couponCode);
      }
      setAppliedCouponCode(state.couponCode); // Set the successfully applied code
      // Clear the input field *after* successful application if desired
      // setCouponCodeInput(""); 
    } else if (!state?.success && state?.error) {
      // If an error occurred (or coupon was invalid), reset discount in parent
      onCouponApply(0, null); 
      setAppliedCouponCode(null); // Clear any previously applied code
    }
     // We might not want to automatically clear the input on error, let user retry
  }, [state, onCouponApply]);
  
  // Handler to remove the applied coupon
  const handleRemoveCoupon = () => {
    onCouponApply(0, null); // Reset discount in parent
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('zervia_coupon_code');
    }
    setAppliedCouponCode(null); // Clear applied code state
    setCouponCodeInput(""); // Clear the input field
     // Reset form state if needed, although not strictly necessary here
    // Consider if you need to reset the useFormState
  };

  return (
    <form action={formAction}>
       <input type="hidden" name="cartSubtotal" value={cartSubtotal} />
      
      <label htmlFor="couponCode" className="block text-sm font-medium text-zervia-700 mb-2">
        Apply Coupon Code
      </label>
      
      {/* Display applied coupon and remove button if a coupon is active */} 
       {appliedCouponCode ? (
         <div className="flex items-center justify-between mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
           <span className="text-sm text-green-700 font-medium">
             Coupon "{appliedCouponCode}" applied! 
           </span>
           <Button 
             type="button" 
             variant="ghost"
             size="sm"
             className="text-red-500 hover:text-red-700 h-auto p-0"
             onClick={handleRemoveCoupon}
            > 
             Remove
           </Button>
         </div>
       ) : (
         /* Show input form only if no coupon is applied */
         <div className="flex space-x-2">
          <Input 
            id="couponCode"
            name="couponCode" 
            placeholder="Enter code" 
            className="flex-1"
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value)}
            aria-describedby="coupon-error"
          />
          <SubmitButton /> 
         </div>
       )}

      {/* Display validation errors or success/failure messages */}
      {state?.fieldErrors?.couponCode && (
        <p id="coupon-error" className="text-sm text-red-500 mt-1">
          {state.fieldErrors.couponCode.join(", ")}
        </p>
      )}
      {/* Display general messages (success or non-field errors) */} 
       {state?.message && !state.success && state.error && !state.fieldErrors?.couponCode && (
         <p className={`text-sm mt-1 ${state.success ? 'text-green-600' : 'text-red-500'}`}>
           {state.message}
         </p>
       )}
       {/* Display success message distinctly if needed, otherwise handled by appliedCouponCode state */}
       {/* {state?.success && state.message && (
         <p className="text-sm text-green-600 mt-1">
           {state.message}
         </p>
       )} */} 
    </form>
  );
} 