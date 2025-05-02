'use client';

import React, { useState, useEffect } from 'react';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CheckoutInformationForm } from '@/components/checkout/checkout-information-form';
import { AgentLocationSelector } from '@/components/checkout/agent-location-selector';
import { CheckoutPaymentForm } from '@/components/checkout/checkout-payment-form';
import { CheckoutConfirmation } from '@/components/checkout/checkout-confirmation';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getCart } from '@/actions/cart'; // Assuming getCart is needed for summary
import { getUserAddresses } from '@/actions/profile'; // Import address action
// Removed Supabase types import temporarily due to regeneration needed
// import type { Tables } from '@/types/supabase'; 

// Define Address type locally using 'any' until regenerated types confirm it
// REMINDER: Run npx supabase gen types... after adding Address table!
type AddressType = any; // Use 'any' temporarily

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

// Mock agent locations - replace with API call later
const mockAgents = [
    {
    id: '1',
    name: 'Campus Hub',
    location: 'Main Building',
    address: 'Room 101, First Floor, Main Campus Building',
    timing: 'Mon-Fri: 9am-5pm, Sat: 10am-2pm',
  },
  {
    id: '2',
    name: 'Student Center',
    location: 'Student Union',
    address: 'Student Union Building, Ground Floor, Near Cafeteria',
    timing: 'Mon-Fri: 8am-8pm, Sat-Sun: 10am-4pm',
  },
  {
    id: '3',
    name: 'Engineering Block',
    location: 'Engineering Department',
    address: 'Engineering Building, Room E204, Second Floor',
    timing: 'Mon-Fri: 9am-6pm',
  },
];

// Checkout steps
const CHECKOUT_STEPS = ['Information', 'Pickup Location', 'Payment', 'Confirmation'];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [contactInfo, setContactInfo] = useState<FormData | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [cartError, setCartError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressType[]>([]); // Use AddressType (any for now)
  const [addressError, setAddressError] = useState<string | null>(null); 
  
  // Fetch cart and addresses
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    if (status === 'authenticated') {
      let isMounted = true; // Flag to prevent state updates on unmounted component
      const fetchData = async () => {
        setIsLoading(true);
        setCartError(null);
        setAddressError(null);
        
        try {
          // Fetch cart
          const cartData = await getCart();
          if (isMounted) {
              if (cartData.success && cartData.cart?.items) {
                setCartItems(cartData.cart.items);
                 if (cartData.cart.items.length === 0) {
                    // Redirect to cart if it's empty
                    router.push('/cart?message=Cannot checkout with an empty cart');
                    return; 
                 }
              } else {
                setCartError(cartData.message || "Failed to load cart.");
                setCartItems([]);
              }
          }
          
          // Fetch addresses
          const addressData = await getUserAddresses();
          if (isMounted) {
              if (addressData.success) {
                  setAddresses(addressData.addresses || []);
              } else {
                  setAddressError(addressData.error || "Failed to load addresses.");
                  setAddresses([]);
              }
          }

        } catch (err: any) {
          console.error("Error fetching checkout data:", err);
           if (isMounted) {
               setCartError(err.message || "An error occurred loading cart.");
               setAddressError(err.message || "An error occurred loading addresses.");
           }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };
      
      fetchData();
      
      // Cleanup function
      return () => { isMounted = false; };
    }
  }, [status, router]);
  
  // Calculate totals from cart state
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  // TODO: Add discount, shipping, tax logic later
  const discount = 0; // Placeholder
  const shipping = 0.00; // Pickup is free
  const tax = subtotal * 0.0; // Placeholder tax rate
  const total = Math.max(0, subtotal + shipping + tax - discount);
  
  // Map cart items for the summary component
  const summaryItems = cartItems.map(item => ({
      id: item.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image || '/placeholder-product.jpg', // Provide fallback
      vendor: item.product.vendor || 'N/A' // Provide fallback
  })); 

  // Get the selected agent details
  const selectedAgent = mockAgents.find(agent => agent.id === selectedAgentId);
  
  // Handlers (keep existing logic for now)
  const handleInformationSubmit = (data: FormData) => {
    setContactInfo(data);
    handleNext(); // Move to next step after saving info
  };
  
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };
  
  const handlePaymentInit = () => {
    setIsLoading(true); // Show loading during payment processing
  };
  
  const handlePaymentComplete = (reference: string) => {
    // TODO: Replace mock order/pickup code generation with real API call
    // This should likely happen in a server action called by CheckoutPaymentForm
    setPaymentReference(reference);
    setOrderNumber(`ORD-${Math.floor(Math.random() * 10000)}`);
    setPickupCode(`${Math.floor(1000 + Math.random() * 9000)}`);
    setIsLoading(false);
    setCurrentStep(3); // Move to confirmation step
  };
  
  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, CHECKOUT_STEPS.length - 1));
  };
  
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Loading state
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
     return (
      <div className="container mx-auto p-4 py-8 text-center">
         <p>Loading checkout...</p>
         {/* Add Spinner component */} 
      </div>
    );
  }
  
  // Handle case where cart is empty after loading
   if (status === 'authenticated' && !isLoading && cartItems.length === 0 && !cartError) {
     // Redirect might have already happened, but double-check
      router.push('/cart?message=Your cart is empty');
      return (
           <div className="container mx-auto p-4 py-8 text-center">
             <p>Your cart is empty. Redirecting...</p>
           </div>
        );
   }
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold text-zervia-900 mb-8 text-center">Checkout</h1>
      
      <CheckoutStepper steps={CHECKOUT_STEPS} currentStep={currentStep} />
      
      {(cartError || addressError) && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
            <strong className="font-bold">Error:</strong>
            {cartError && <span className="block sm:inline"> {cartError}</span>}
            {addressError && <span className="block sm:inline"> {addressError}</span>}
          </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {/* Step 1: Information - Pass addresses */}
          {currentStep === 0 && (
            <CheckoutInformationForm 
              onSubmit={handleInformationSubmit} 
              // Remove onNext prop if submission automatically triggers next step
              addresses={addresses as any[]} // Pass addresses (cast to any[] temporarily)
            />
          )}
          
          {/* Step 2: Agent Location Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <AgentLocationSelector 
                agents={mockAgents} // Replace with fetched agents later
                selectedAgentId={selectedAgentId}
                onSelectAgent={handleAgentSelect}
              />
              
              <div className="flex justify-between mt-4">
                 <button 
                   onClick={handleBack}
                   className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                 >
                   Back
                 </button>
                 <button 
                   onClick={handleNext}
                   disabled={!selectedAgentId}
                   className={`px-4 py-2 rounded-md text-white ${
                     selectedAgentId 
                       ? 'bg-zervia-600 hover:bg-zervia-700' 
                       : 'bg-gray-400 cursor-not-allowed'
                   }`}
                 >
                   Continue to Payment
                 </button>
               </div>
            </div>
          )}
          
          {/* Step 3: Payment */}
          {currentStep === 2 && contactInfo && (
            <CheckoutPaymentForm 
              amount={total} // Pass calculated total
              email={contactInfo.get('email') as string}
              onPaymentInit={handlePaymentInit}
              onPaymentComplete={handlePaymentComplete}
              onBack={handleBack}
            />
          )}
          
          {/* Step 4: Confirmation */}
          {currentStep === 3 && contactInfo && selectedAgent && (
            <CheckoutConfirmation 
              orderNumber={orderNumber}
              pickupCode={pickupCode}
              agentLocation={selectedAgent.name}
              agentAddress={selectedAgent.address}
              customerEmail={contactInfo.get('email') as string}
            />
          )}
        </div>
        
        {/* Order Summary (always visible) */}
        <div className="lg:col-span-1">
           {/* Pass mapped items and calculated totals, including shipping */}
          <CheckoutSummary 
            items={summaryItems} 
            subtotal={subtotal} 
            discount={discount} 
            shipping={shipping} // Pass the shipping prop
            tax={tax} 
            total={total} 
           />
        </div>
      </div>
    </div>
  )
}