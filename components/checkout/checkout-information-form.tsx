'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStatus } from 'react-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import type { Tables } from '@/types/supabase';
import { toast } from 'sonner';

// Define Address type
type Address = Tables<'Address'>;

// Form schema using Zod
const checkoutInformationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  // Keep first & last names in schema (used internally) but validation will be satisfied
  // automatically once they are fetched. The user will no longer input these fields.
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  // Address fields are optional at the top level
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  saveAddress: z.enum(['true', 'false']).default('false'),
  selectedAddressId: z.string().optional(),
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
  onSave: (data: InformationFormData) => Promise<{success: boolean, error?: string}>;
  onSuccess: (email: string) => void;
  addresses: Address[];
  initialData?: Partial<InformationFormData>;
  readOnlyName?: string | null;
  readOnlyEmail?: string | null;
  profileLoading?: boolean;
}

export function CheckoutInformationForm({ 
  onSave,
  onSuccess, 
  addresses, 
  initialData,
  readOnlyName,
  readOnlyEmail,
  profileLoading = false,
}: CheckoutInformationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
 
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<InformationFormData>({
    resolver: zodResolver(checkoutInformationSchema as any),
    defaultValues: {
      deliveryMethod: 'pickup',
      saveAddress: 'false',
      ...initialData
    },
    mode: 'onChange'
  });
  
  const deliveryMethod = watch('deliveryMethod');
  const selectedAddressId = watch('selectedAddressId');

  // Log form state for debugging
  useEffect(() => {
    console.log('CheckoutInformationForm - Mounted with addresses:', addresses?.length || 0);
  }, []);

  // Populate hidden first/last name fields once the profile name is available
  useEffect(() => {
    if (readOnlyName) {
      const parts = readOnlyName.split(' ');
      const first = parts.shift() || '';
      const last = parts.join(' ');
      setValue('firstName', first, { shouldValidate: false });
      setValue('lastName', last, { shouldValidate: false });
    }
    if (readOnlyEmail) {
      setValue('email', readOnlyEmail, { shouldValidate: false });
    }
  }, [readOnlyName, readOnlyEmail, setValue]);

  const handleFormSubmit = async (data: InformationFormData) => {
    console.log('CheckoutInformationForm - Form submitted:', data);
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setFormError(null);

      // Call the provided onSave function with the form data
      const result = await onSave(data);
      
      if (result.success) {
        console.log('CheckoutInformationForm - Save successful');
        toast.success("Information saved successfully!");
        onSuccess(data.email);
      } else {
        console.error('CheckoutInformationForm - Save failed:', result.error);
        setFormError(result.error || "Failed to save information. Please try again.");
        toast.error(result.error || "Failed to save information");
      }
    } catch (error) {
      console.error('CheckoutInformationForm - Submission error:', error);
      setFormError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle selection of an existing address
  const handleAddressSelect = (addressId: string) => {
    console.log('CheckoutInformationForm - Selected address:', addressId);
    setValue("selectedAddressId", addressId);
    
    // Clear new address fields
    setValue("addressLine1", "");
    setValue("addressLine2", "");
    setValue("city", "");
    setValue("stateProvince", "");
    setValue("postalCode", "");
    setValue("country", "");
    setValue("saveAddress", 'false');
  };
  
  // Handle clearing the selected address to enter a new one
  const handleClearSelectedAddress = () => {
    console.log('CheckoutInformationForm - Clearing selected address');
    setValue("selectedAddressId", undefined);
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Contact & Delivery Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            {/* Show read-only full name fetched from profile */}
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <Input id="fullName" value={readOnlyName || ''} disabled />
                {profileLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin border-2 border-t-transparent rounded-full"></span>
                )}
              </div>
            </div>
            {/* Read-only email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={readOnlyEmail || ''} disabled />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input id="phone" {...register('phone')} placeholder="+1 234 567 890" />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
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
                    </div>
                    <div>
                      <Label htmlFor="stateProvince">State / Province</Label>
                      <Input id="stateProvince" {...register('stateProvince')} placeholder="CA" />
                      {errors.stateProvince && <p className="text-sm text-red-500 mt-1">{errors.stateProvince.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" {...register('postalCode')} placeholder="90210" />
                      {errors.postalCode && <p className="text-sm text-red-500 mt-1">{errors.postalCode.message}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register('country')} placeholder="United States" />
                    {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>}
                  </div>
                  {/* Save Address Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="saveAddress" 
                      onChange={(e) => setValue('saveAddress', e.target.checked ? 'true' : 'false')}
                      className="h-4 w-4 rounded border-gray-300 text-zervia-600 focus:ring-zervia-500" 
                    />
                    <Label htmlFor="saveAddress" className="text-sm">Save this address for future use</Label>
                  </div>
                </div>
              )}
              {/* Display the custom refine error */}
              {(errors.selectedAddressId && deliveryMethod === 'delivery' && (
                <p className="text-sm text-red-500 mt-1">{errors.selectedAddressId.message}</p>
              ))}
            </div>
          )}
          
          {/* Form Error Message */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {formError}
            </div>
          )}
          
          {/* Submission Button */}
          <div className="border-t pt-6">
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={isSubmitting || profileLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                deliveryMethod === 'pickup' ? 'Continue to Pickup Location' : 'Continue to Payment'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 