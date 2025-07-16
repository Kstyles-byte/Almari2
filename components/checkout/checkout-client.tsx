'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// UI Components
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CheckoutInformationForm } from '@/components/checkout/checkout-information-form';
import { SignInForm } from '@/components/auth/SignInForm';
import { AgentLocationSelector } from '@/components/checkout/agent-location-selector';
import { getActiveAgents as fetchActiveAgents } from '@/actions/agent-actions';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';
import { CheckoutPaymentForm } from '@/components/checkout/checkout-payment-form';
import { PageTransitionLoader } from '@/components/ui/loader';
import { useCart } from '@/components/providers/CartProvider';
import { getProductsByIds, BasicProduct } from '@/lib/services/products';

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
  lastName?: string;
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
  // Server-prefetched cart, kept for potential future use but no longer relied upon
  initialCart?: any;
  initialAddresses: Tables<'Address'>[];
  initialAgents: Tables<'Agent'>[];
  userEmail: string;
  userName?: string;
};

export function CheckoutClient({ 
  initialCart: _initialCart, // ignore – live cart comes from context
  initialAddresses, 
  initialAgents,
  userEmail,
  userName = ''
}: CheckoutClientProps) {
  // Router
  const router = useRouter();
  
  const isGuest = !userEmail;

  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Keep default contact info in state so it can react to updates in
  // the user profile that may arrive after the initial render (e.g. after
  // a sign-in redirect). Using useEffect ensures the name/email are kept in
  // sync with the latest prop values without requiring a full page refresh.
  const [defaultContact, setDefaultContact] = useState<Partial<CheckoutFormData>>({});

  useEffect(() => {
    if (!userName && !userEmail) return;

    const parts = (userName || '').split(' ');
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');

    setDefaultContact({ email: userEmail, firstName, lastName });
  }, [userName, userEmail]);
  
  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data state
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutFormData | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agents, setAgents] = useState<Tables<'Agent'>[]>(initialAgents);

  // Fallback: fetch agents on the client if none were passed down (or after sign-in)
  useEffect(() => {
    if (agents.length === 0) {
      (async () => {
        try {
          const res = await fetchActiveAgents();
          if (res.success && res.agents?.length) {
            setAgents(res.agents);
          }
        } catch (err) {
          console.error('[Checkout] Failed to fetch agents on client', err);
        }
      })();
    }
  }, [agents.length]);
  
  // Unified cart coming from the CartProvider – contains guest items or the authenticated user's server cart
  const liveCart = useCart();

  // Local state for product details (guest or fallback)
  const [productMap, setProductMap] = useState<Record<string, BasicProduct>>({});

  // Fetch product details whenever the live cart changes and we need metadata
  useEffect(() => {
    const missingIds = liveCart.filter(i => !productMap[i.productId]).map(i => i.productId);
    if (missingIds.length) {
      (async () => {
        const products = await getProductsByIds(missingIds);
        const newMap = { ...productMap };
        products.forEach(p => (newMap[p.id] = p));
        setProductMap(newMap);
      })();
    }
  }, [liveCart, productMap]);

  // Helper to transform cart items to unified structure
  const transform = (items: any[]): CartItemType[] =>
    items.map((item: any) => ({
      id: item.id || 'tmp',
      quantity: typeof item.quantity === 'number' ? item.quantity : item.qty || 1,
      product: {
        id: item.productId || item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        inventory: item.inventory,
        image: item.image || '/placeholder-product.jpg',
        vendor: item.vendorName || item.vendor || null,
      },
    }));

  // Build cart items from live cart and loaded product metadata
  const cartItems: CartItemType[] = liveCart.map((ci) => {
    const p = productMap[ci.productId];
    return {
      id: ci.productId,
      quantity: ci.qty,
      product: p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            inventory: p.inventory,
            image: p.image ?? '/placeholder-product.jpg',
            vendor: p.vendorName ?? null,
          }
        : {
            id: ci.productId,
            name: 'Loading…',
            slug: '#',
            price: 0,
            inventory: 0,
            image: '/placeholder-product.jpg',
            vendor: null,
          },
    };
  });
  
  // Calculate totals from cart state
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  
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
  
  // Show loading while we fetch product details for any of the cart items
  if (liveCart.length && cartItems.some(i => i.product.name === 'Loading…')) {
    return <PageTransitionLoader text="Loading your cart..." />;
  }

  // Empty state
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
            <>
              {isGuest ? (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Sign In or Sign Up to Continue Checkout</h3>
                  <SignInForm callbackUrl="/checkout" />
                </div>
              ) : (
                <CheckoutInformationForm
                  onSave={handleSaveInformation}
                  onSuccess={(email) => {
                    toast.success("Information saved!");
                    handleNext();
                  }}
                  addresses={initialAddresses}
                  initialData={(checkoutInfo || defaultContact) as any}
                  readOnlyName={`${(defaultContact as any).firstName || ''} ${(defaultContact as any).lastName || ''}`.trim() || null}
                  readOnlyEmail={userEmail}
                  profileLoading={profileLoading}
                />
              )}
            </>
          )}
          
          {/* Step 2: Agent Location */}
          {currentStep === 1 && (
            <AgentLocationSelector
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={handleSelectAgent}
              onNext={handleNext}
              onBack={handleBack}
              error={agents.length === 0 ? 'No active pickup locations found' : null}
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
    formData.append('lastName', checkoutInfo.lastName || '');
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