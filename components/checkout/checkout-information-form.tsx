'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// Define Address type using any temporarily
type AddressType = any;

// Form schema using Zod
const informationSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phone: z.string().optional(), // Optional phone number
  deliveryMethod: z.enum(['pickup', 'delivery'], { required_error: "Please select a delivery method." }),
  // Fields for new address (only required if deliveryMethod is 'delivery' and no existing address is selected)
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  saveAddress: z.boolean().optional(),
  selectedAddressId: z.string().optional(), // For selecting an existing address
}).refine((data) => {
    // If delivery is chosen, either an existing address must be selected OR a new address must be fully entered
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
    return true; // Pickup doesn't require address validation here
}, {
    // Custom error message if validation fails
    message: "For delivery, please select an existing address or enter a new one.",
    path: ["selectedAddressId"], // Indicate the error relates to address selection/entry
});


type InformationFormData = z.infer<typeof informationSchema>;

interface CheckoutInformationFormProps {
  onSubmit: (data: FormData) => void;
  addresses: AddressType[]; // Accept addresses array (using any for now)
}

export function CheckoutInformationForm({ onSubmit, addresses }: CheckoutInformationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InformationFormData>({
    resolver: zodResolver(informationSchema),
    defaultValues: {
        deliveryMethod: 'pickup', // Default to pickup
        saveAddress: false,
    },
  });
  
  const deliveryMethod = watch('deliveryMethod');
  const selectedAddressId = watch('selectedAddressId');

  const handleFormSubmit = (data: InformationFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    onSubmit(formData);
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
    setValue("saveAddress", false);
  };
  
  // Handle clearing the selected address (to enter a new one)
   const handleClearSelectedAddress = () => {
        setValue("selectedAddressId", undefined);
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Delivery Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" {...register('email')} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} placeholder="John" />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
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
                            {/* TODO: Replace with a Select component for countries */} 
                            <Input id="country" {...register('country')} placeholder="United States" />
                            {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>}
                        </div>
                        {/* Save Address Checkbox */}
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="saveAddress" {...register('saveAddress')} className="h-4 w-4 rounded border-gray-300 text-zervia-600 focus:ring-zervia-500" />
                            <Label htmlFor="saveAddress" className="text-sm">Save this address for future use</Label>
                        </div>
                    </div>
                )}
                {/* Display the custom refine error */}
                {errors.selectedAddressId && deliveryMethod === 'delivery' && <p className="text-sm text-red-500 mt-1">{errors.selectedAddressId.message}</p>}
            </div>
          )}
          
          {/* Submission Button */}
          <div className="border-t pt-6">
            <Button type="submit" className="w-full md:w-auto">
               {deliveryMethod === 'pickup' ? 'Continue to Pickup Location' : 'Continue to Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 