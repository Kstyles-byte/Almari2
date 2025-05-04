'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// UI Components
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CheckoutInformationForm } from '@/components/checkout/checkout-information-form';
import { AgentLocationSelector } from '@/components/checkout/agent-location-selector';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';
import { CheckoutPaymentForm } from '@/components/checkout/checkout-payment-form';
import { PageTransitionLoader } from '@/components/ui/loader';

// Types
import type { Tables } from '@/types/supabase';

// Define CartItem type locally
type CartItemType = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    inventory: number;
    image: string | null;
    vendor: string | null;
  };
};

// Information form data type
type CheckoutFormData = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  deliveryMethod: 'pickup' | 'delivery';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  saveAddress: 'true' | 'false';
  selectedAddressId?: string;
};

// Checkout steps
const CHECKOUT_STEPS = ['Information', 'Pickup Location', 'Payment'];

// Props for the client component
type CheckoutClientProps = {
  initialCart: any;
  initialAddresses: Tables<'Address'>[];
  initialAgents: Tables<'Agent'>[];
  userEmail: string;
};

export function CheckoutClient({ 
  initialCart, 
  initialAddresses, 
  initialAgents,
  userEmail
}: CheckoutClientProps) {
  // Router
  const router = useRouter();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data state
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutFormData | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  
  // Process cart items
  const cartItems: CartItemType[] = (initialCart?.items || []).map((item: any) => ({
    id: item.id || 'unknown',
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    product: {
      id: item.productId || item.id || 'unknown',
      name: item.name || 'Unknown Product',
      slug: item.slug || 'unknown-slug',
      price: typeof item.price === 'number' ? item.price : 0,
      inventory: typeof item.inventory === 'number' ? item.inventory : 0,
      image: item.image || '/placeholder-product.jpg',
      vendor: item.vendorName || null
    }
  }));
  
  // Calculate totals from cart state
  const subtotal = cartItems.reduce((acc, item) => {
    if (!item.product || typeof item.product.price !== 'number') {
      return acc;
    }
    return acc + (item.product.price * item.quantity);
  }, 0);
  
  // For now these are placeholders
  const discount = 0;
  const shipping = 0.00; // Pickup is free
  const tax = subtotal * 0.0; // Placeholder tax rate
  const total = Math.max(0, subtotal + shipping + tax - discount);
  
  // Convert cart items to summary format
  const summaryItems = cartItems.map(item => {
    if (!item.product) {
      return {
        id: item.id || 'unknown',
        name: 'Unknown Product',
        price: 0,
        quantity: item.quantity || 1,
        image: '/placeholder-product.jpg',
        vendor: 'N/A'
      };
    }
    
    return {
      id: item.id,
      name: item.product.name || 'Unnamed Product',
      price: typeof item.product.price === 'number' ? item.product.price : 0,
      quantity: item.quantity,
      image: item.product.image || '/placeholder-product.jpg',
      vendor: item.product.vendor || 'N/A'
    };
  });
  
  // Handle information form submission
  const handleSaveInformation = async (data: CheckoutFormData) => {
    try {
      console.log('Saving checkout information:', data);
      
      // Here you would normally call an API to save this data
      setCheckoutInfo(data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      console.error('Error saving checkout information:', error);
      return { 
        success: false, 
        error: 'Failed to save information. Please try again.' 
      };
    }
  };
  
  // Advance to the next step
  const handleNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, CHECKOUT_STEPS.length - 1));
  }, []);
  
  // Go back to the previous step
  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);
  
  // Select an agent
  const handleSelectAgent = useCallback((agentId: string) => {
    console.log('Selected agent:', agentId);
    setSelectedAgentId(agentId);
  }, []);

  // Handle payment initialization
  const handlePaymentInit = useCallback(() => {
    console.log('Payment initialization started');
    // Any UI state changes for payment initialization
  }, []);

  // Handle payment completion
  const handlePaymentComplete = useCallback((reference: string) => {
    console.log('Payment completed with reference:', reference);
    toast.success('Payment successful!');
    // Any UI state changes for payment completion
  }, []);
  
  // Show cart empty state
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto p-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="mb-8">Add some items to your cart before proceeding to checkout.</p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-zervia-600 hover:bg-zervia-700 text-white px-6 py-2 rounded-md"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }
  
  // Main checkout UI
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold text-zervia-900 mb-8 text-center">Checkout</h1>
      
      <CheckoutStepper steps={CHECKOUT_STEPS} currentStep={currentStep} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {/* Step 1: Information */}
          {currentStep === 0 && (
            <CheckoutInformationForm
              onSave={handleSaveInformation}
              onSuccess={(email) => {
                toast.success("Information saved!");
                handleNext();
              }}
              addresses={initialAddresses}
              initialData={(checkoutInfo || { email: userEmail }) as any}
            />
          )}
          
          {/* Step 2: Agent Location */}
          {currentStep === 1 && (
            <AgentLocationSelector
              agents={initialAgents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={handleSelectAgent}
              onNext={handleNext}
              onBack={handleBack}
              error={null}
            />
          )}
          
          {/* Step 3: Payment (placeholder) */}
          {currentStep === 2 && (
            <CheckoutPaymentForm
              amount={total}
              email={checkoutInfo?.email || userEmail}
              contactInfo={createContactFormData()}
              onPaymentInit={handlePaymentInit}
              onBack={handleBack}
            />
          )}
        </div>
        
        {/* Order Summary (always visible) */}
        <div className="lg:col-span-1">
          <CheckoutSummary
            items={summaryItems}
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </div>
  );
  
  // Helper function to create FormData from checkout information and selected agent
  function createContactFormData() {
    if (!checkoutInfo || !selectedAgentId) {
      return new FormData();
    }

    const formData = new FormData();
    
    // Add checkout info
    formData.append('email', checkoutInfo.email);
    formData.append('firstName', checkoutInfo.firstName);
    formData.append('lastName', checkoutInfo.lastName);
    formData.append('phone', checkoutInfo.phone || '');
    formData.append('deliveryMethod', checkoutInfo.deliveryMethod);
    
    // Add address information
    if (checkoutInfo.deliveryMethod === 'delivery') {
      if (checkoutInfo.selectedAddressId) {
        formData.append('selectedAddressId', checkoutInfo.selectedAddressId);
      } else {
        formData.append('addressLine1', checkoutInfo.addressLine1 || '');
        formData.append('addressLine2', checkoutInfo.addressLine2 || '');
        formData.append('city', checkoutInfo.city || '');
        formData.append('stateProvince', checkoutInfo.stateProvince || '');
        formData.append('postalCode', checkoutInfo.postalCode || '');
        formData.append('country', checkoutInfo.country || '');
        formData.append('saveAddress', checkoutInfo.saveAddress);
      }
    }
    
    // Add selected agent
    formData.append('agentId', selectedAgentId);
    
    return formData;
  }
} 