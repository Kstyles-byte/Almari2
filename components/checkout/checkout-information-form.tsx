'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormState, useFormStatus } from 'react-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Tables } from '@/types/supabase';
import { saveCheckoutInformation, type CheckoutInfoState } from '@/actions/checkout';
import { toast } from 'sonner';

// Define Address type using any temporarily
type AddressType = any;
type Address = Tables<'Address'>; // Use the specific Supabase table type

// Form schema using Zod
const addressSchema = z.object({
    addressLine1: z.string().min(1, "Address Line 1 is required."),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required."),
    stateProvince: z.string().min(1, "State/Province is required."),
    postalCode: z.string().min(1, "Postal Code is required."),
    country: z.string().min(1, "Country is required."),
});

const checkoutInformationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phone: z.string().optional().nullable(), // Allow optional or null
  deliveryMethod: z.enum(['pickup', 'delivery']),
  // Address fields are optional at the top level
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  stateProvince: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  // Form sends string 'true'/undefined, action handles transform
  saveAddress: z.string().optional(), 
  selectedAddressId: z.string().optional().nullable(),
}).refine((data) => {
    if (data.deliveryMethod === 'delivery') {
        const hasSelectedAddress = !!data.selectedAddressId;
        const hasNewAddress = 
            !!data.addressLine1 && 
            !!data.city && 
            !!data.stateProvince && 
            !!data.postalCode && 
            !!data.country;
        return hasSelectedAddress || hasNewAddress;
    }
    return true;
}, {
    message: "For delivery, please select an existing address or enter a new one.",
    path: ["selectedAddressId"],
});

type InformationFormData = z.infer<typeof checkoutInformationSchema>;

interface CheckoutInformationFormProps {
  onSuccess: (email: string) => void;
  addresses: Address[];
  initialData?: Partial<InformationFormData>;
}

// Initial state for useFormState
const initialActionState: CheckoutInfoState = { success: false };

export function CheckoutInformationForm({ onSuccess, addresses, initialData }: CheckoutInformationFormProps) {
  // Use the server action with useFormState
  const [state, formAction] = useFormState(saveCheckoutInformation, initialActionState);

  // Reinstate handleSubmit and other destructured values from useForm
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<InformationFormData>({
    resolver: zodResolver(checkoutInformationSchema),
    defaultValues: {
        deliveryMethod: 'pickup',
        saveAddress: 'false',
        ...initialData
    },
  });
  
  const deliveryMethod = watch('deliveryMethod');
  const selectedAddressId = watch('selectedAddressId');

  // Effect to call onSuccess when the action succeeds
  useEffect(() => {
    if (state.success) {
      const email = getValues('email');
      toast.success(state.message || "Information saved!");
      onSuccess(email);
    }
    if (state.error && !state.fieldErrors) {
        toast.error(state.error);
    }
  }, [state, onSuccess, getValues]);

  const handleFormSubmit = (data: InformationFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formAction(formData);
  };
  
  // Handle selection of an existing address
  const handleAddressSelect = (addressId: string) => {
    setValue("selectedAddressId", addressId);
    // Optionally, clear new address fields if an existing one is selected
    setValue("addressLine1", "");
    setValue("addressLine2", "");
    setValue("city", "");
    setValue("stateProvince", "");
    setValue("postalCode", "");
    setValue("country", "");
    setValue("saveAddress", 'false');
  };
  
  // Handle clearing the selected address (to enter a new one)
   const handleClearSelectedAddress = () => {
        setValue("selectedAddressId", undefined);
    };

  // Submit button component using useFormStatus
  const SubmitButton = () => {
      const { pending } = useFormStatus();
      return (
          <Button type="submit" className="w-full md:w-auto" disabled={pending}>
              {pending ? 'Saving...' : 
               deliveryMethod === 'pickup' ? 'Continue to Pickup Location' : 'Continue to Payment'}
          </Button>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Delivery Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" {...register('email')} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
              {state.fieldErrors?.email && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.email[0]}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} placeholder="John" />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>}
                {state.fieldErrors?.firstName && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.firstName[0]}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>}
                {state.fieldErrors?.lastName && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.lastName[0]}</p>}
              </div>
            </div>
             <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" {...register('phone')} placeholder="+1 234 567 890" />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
                {state.fieldErrors?.phone && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.phone[0]}</p>}
            </div>
          </div>
          
          {/* Delivery Method */}
          <div className="space-y-4 border-t pt-6">
             <h3 className="text-lg font-medium">Delivery Method</h3>
              <RadioGroup 
                defaultValue="pickup" 
                onValueChange={(value) => setValue('deliveryMethod', value as 'pickup' | 'delivery')} 
                className="flex flex-col sm:flex-row gap-4"
                >
                <Label htmlFor="pickup" className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:border-zervia-500 flex-1 data-[state=checked]:border-zervia-600 data-[state=checked]:bg-zervia-50">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <span>Campus Pickup (Free)</span>
                </Label>
                <Label htmlFor="delivery" className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:border-zervia-500 flex-1 data-[state=checked]:border-zervia-600 data-[state=checked]:bg-zervia-50">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <span>Local Delivery (Coming Soon)</span> 
                </Label>
              </RadioGroup>
             {errors.deliveryMethod && <p className="text-sm text-red-500 mt-1">{errors.deliveryMethod.message}</p>}
             {state.fieldErrors?.deliveryMethod && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.deliveryMethod[0]}</p>}
          </div>
          
          {/* Address Section (Conditional) */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Delivery Address</h3>
                
                {/* Display Existing Addresses if available */}
                {addresses && addresses.length > 0 && (
                    <div className="space-y-3">
                        <Label>Select Saved Address</Label>
                        {addresses.map((addr) => (
                            <div 
                                key={addr.id} 
                                onClick={() => handleAddressSelect(addr.id)}
                                className={`border rounded-md p-3 cursor-pointer hover:border-zervia-400 ${selectedAddressId === addr.id ? 'border-zervia-600 bg-zervia-50' : 'border-gray-300'}`}
                            >
                                <p className="font-medium">{addr.address_line1}</p>
                                {addr.address_line2 && <p>{addr.address_line2}</p>}
                                <p>{addr.city}, {addr.state_province} {addr.postal_code}</p>
                                <p>{addr.country}</p>
                                {addr.phone_number && <p>Phone: {addr.phone_number}</p>}
                            </div>
                        ))}
                         {/* Option to enter a new address even if existing ones are present */} 
                        {selectedAddressId && (
                             <Button variant="link" size="sm" onClick={handleClearSelectedAddress} className="p-0 h-auto text-zervia-600">
                                Or Enter a New Address
                            </Button>
                        )}
                    </div>
                )}
                
                 {/* New Address Form (Show if no addresses exist OR if user clears selection) */}
                {(!addresses || addresses.length === 0 || !selectedAddressId) && (
                    <div className="space-y-4 pt-4 border-t border-dashed">
                         <p className="text-sm text-gray-600">
                            {addresses && addresses.length > 0 ? 'Enter New Address:' : 'Enter Delivery Address:'}
                         </p>
                        <div>
                            <Label htmlFor="addressLine1">Address Line 1</Label>
                            <Input id="addressLine1" {...register('addressLine1')} placeholder="123 Main St" />
                            {errors.addressLine1 && <p className="text-sm text-red-500 mt-1">{errors.addressLine1.message}</p>}
                            {state.fieldErrors?.addressLine1 && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.addressLine1[0]}</p>}
                        </div>
                        <div>
                            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                            <Input id="addressLine2" {...register('addressLine2')} placeholder="Apartment, suite, etc."/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="city">City</Label>
                                <Input id="city" {...register('city')} placeholder="Anytown" />
                                {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>}
                                {state.fieldErrors?.city && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.city[0]}</p>}
                            </div>
                            <div>
                                <Label htmlFor="stateProvince">State / Province</Label>
                                <Input id="stateProvince" {...register('stateProvince')} placeholder="CA" />
                                {errors.stateProvince && <p className="text-sm text-red-500 mt-1">{errors.stateProvince.message}</p>}
                                {state.fieldErrors?.stateProvince && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.stateProvince[0]}</p>}
                            </div>
                            <div>
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input id="postalCode" {...register('postalCode')} placeholder="90210" />
                                {errors.postalCode && <p className="text-sm text-red-500 mt-1">{errors.postalCode.message}</p>}
                                {state.fieldErrors?.postalCode && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.postalCode[0]}</p>}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="country">Country</Label>
                            {/* TODO: Replace with a Select component for countries */} 
                            <Input id="country" {...register('country')} placeholder="United States" />
                            {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>}
                            {state.fieldErrors?.country && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.country[0]}</p>}
                        </div>
                        {/* Save Address Checkbox */}
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="saveAddress" {...register('saveAddress')} className="h-4 w-4 rounded border-gray-300 text-zervia-600 focus:ring-zervia-500" />
                            <Label htmlFor="saveAddress" className="text-sm">Save this address for future use</Label>
                        </div>
                    </div>
                )}
                {/* Display the custom refine error */}
                {(errors.selectedAddressId && deliveryMethod === 'delivery') && <p className="text-sm text-red-500 mt-1">{errors.selectedAddressId.message}</p>}
                {state.fieldErrors?.selectedAddressId && <p className="text-sm text-red-500 mt-1">{state.fieldErrors.selectedAddressId[0]}</p>}
            </div>
          )}
          
          {/* Submission Button */}
          <div className="border-t pt-6">
            <SubmitButton />
            {/* Display general action error message if not field specific */}
            {state.error && !state.fieldErrors && <p className="text-sm text-red-500 mt-2">{state.error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 