'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// UI Components
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CheckoutInformationForm } from '@/components/checkout/checkout-information-form';
import { AgentLocationSelector } from '@/components/checkout/agent-location-selector';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';
import { PageTransitionLoader } from '@/components/ui/loader';

// Actions and Types
import { getCart } from '@/actions/cart';
import { getUserAddresses } from '@/actions/profile';
import { getActiveAgents } from '@/actions/agent-actions';
import type { Tables } from '@/types/supabase';

// Define types
type Address = Tables<'Address'>;

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

export default function CheckoutPage() {
  // Router and session
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data state
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutFormData | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  
  // Data loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading your cart...');
  
  // Cart data
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [cartError, setCartError] = useState<string | null>(null);
  
  // Address data
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressError, setAddressError] = useState<string | null>(null);
  
  // Agent data
  const [agents, setAgents] = useState<Tables<'Agent'>[]>([]);
  const [agentError, setAgentError] = useState<string | null>(null);
  
  // Check authentication and load initial data
  useEffect(() => {
    // If loading, show appropriate message
    if (status === 'loading') {
      setLoadingMessage('Checking your login status...');
      return;
    }
    
    // If not authenticated and not already checking
    if (status === 'unauthenticated') {
      console.log('User is not authenticated, will redirect to login');
      
      // Give a slight delay to allow for potential silent auth refresh
      setTimeout(() => {
        if (status === 'unauthenticated') {
          toast.error('Please log in to access checkout');
          router.push('/login?callbackUrl=/checkout');
        }
      }, 1000);
      
      return;
    }
    
    // If authenticated, load data
    if (status === 'authenticated') {
      setIsLoading(true);
      setLoadingMessage('Loading your checkout data...');
      
      // Flag to prevent state updates if component unmounts
      let isMounted = true;
      
      // Function to load all required data
      const loadCheckoutData = async () => {
        try {
          console.log('Loading checkout data for authenticated user');
          
          // 1. Load cart
          setLoadingMessage('Loading your cart...');
          const cartResult = await getCart();
          
          if (!isMounted) return;
          
          if (!cartResult.success || !cartResult.cart?.items?.length) {
            console.log('Cart is empty or error occurred:', cartResult);
            toast.error(cartResult.message || 'Your cart is empty');
            router.push('/cart');
            return;
          }
          
          // Process cart items
          const processedItems = cartResult.cart.items.map((item: any) => ({
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
          
          setCartItems(processedItems);
          
          // 2. Load addresses
          setLoadingMessage('Loading your saved addresses...');
          const addressResult = await getUserAddresses();
          
          if (!isMounted) return;
          
          if (addressResult.success) {
            setAddresses(addressResult.addresses || []);
          } else {
            console.warn('Failed to load addresses:', addressResult.error);
            setAddressError(addressResult.error || 'Failed to load addresses');
            // Don't block checkout for address errors
          }
          
          // 3. Load agents (pickup locations)
          setLoadingMessage('Loading pickup locations...');
          const agentResult = await getActiveAgents();
          
          if (!isMounted) return;
          
          if (agentResult.success) {
            setAgents(agentResult.agents || []);
          } else {
            console.warn('Failed to load agents:', agentResult.error);
            setAgentError(agentResult.error || 'Failed to load pickup locations');
            // Don't block checkout for agent errors
          }
          
          // Data loading complete - clear any auth errors since we've successfully loaded data
          setIsLoading(false);
          setCartError(null);
          
        } catch (error) {
          console.error('Error loading checkout data:', error);
          
          if (isMounted) {
            setCartError('Failed to load checkout data. Please try again.');
            setIsLoading(false);
            toast.error('Error loading checkout data');
          }
        }
      };
      
      // Load all data
      loadCheckoutData();
      
      // Cleanup on unmount
      return () => {
        isMounted = false;
      };
    }
  }, [status, router]);
  
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
      // For now, we'll just simulate a successful save
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
  
  // Show loading state
  if (isLoading) {
    return <PageTransitionLoader text={loadingMessage} />;
  }
  
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
      
      {/* Error Notifications */}
      {cartItems.length > 0 && cartError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{cartError}</span>
        </div>
      )}
      
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
              addresses={addresses}
              initialData={checkoutInfo || undefined}
            />
          )}
          
          {/* Step 2: Agent Location */}
          {currentStep === 1 && (
            <AgentLocationSelector
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={handleSelectAgent}
              onNext={handleNext}
              onBack={handleBack}
              error={agentError}
            />
          )}
          
          {/* Step 3: Payment (placeholder) */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Payment</h2>
              <p className="text-gray-600 mb-8">
                This is a placeholder for the payment step. In a real application, you would integrate
                with a payment processor here.
              </p>
              
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                
                <button
                  onClick={() => toast.success("Order placed successfully!")}
                  className="px-4 py-2 bg-zervia-600 text-white rounded-md hover:bg-zervia-700"
                >
                  Place Order
                </button>
              </div>
            </div>
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
} 