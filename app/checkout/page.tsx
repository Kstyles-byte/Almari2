'use client';

import React, { useState, useEffect } from 'react';
import { CheckoutStepper } from '@/components/checkout/checkout-stepper';
import { CheckoutInformationForm } from '@/components/checkout/checkout-information-form';
import { AgentLocationSelector } from '@/components/checkout/agent-location-selector';
import { CheckoutPaymentForm } from '@/components/checkout/checkout-payment-form';
import { CheckoutConfirmation } from '@/components/checkout/checkout-confirmation';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';

// Mock cart items data - in a real app, this would come from the cart state/API
const mockCartItems = [
  {
    id: '1',
    name: 'Premium Cotton T-Shirt',
    price: 29.99,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    vendor: 'Fashion Emporium',
  },
  {
    id: '2',
    name: 'Classic Denim Jeans',
    price: 59.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
    vendor: 'Urban Outfitters',
  },
];

// Mock agent locations - in a real app, this would come from the API
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
  const [currentStep, setCurrentStep] = useState(0);
  const [contactInfo, setContactInfo] = useState<FormData | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate the total amount for the order
  const subtotal = mockCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 5.00;
  const tax = subtotal * 0.075;
  const total = subtotal + shipping + tax;
  
  // Get the selected agent details
  const selectedAgent = mockAgents.find(agent => agent.id === selectedAgentId);
  
  // Handle the information step submission
  const handleInformationSubmit = (data: FormData) => {
    setContactInfo(data);
  };
  
  // Handle the agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };
  
  // Handle the payment initialization
  const handlePaymentInit = () => {
    setIsLoading(true);
  };
  
  // Handle the payment completion
  const handlePaymentComplete = (reference: string) => {
    setPaymentReference(reference);
    setOrderNumber(`ORD-${Math.floor(Math.random() * 10000)}`);
    setPickupCode(`${Math.floor(1000 + Math.random() * 9000)}`);
    setIsLoading(false);
    setCurrentStep(3); // Move to confirmation step
  };
  
  // Handle navigation to next step
  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, CHECKOUT_STEPS.length - 1));
  };
  
  // Handle navigation to previous step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold text-zervia-900 mb-8 text-center">Checkout</h1>
      
      <CheckoutStepper steps={CHECKOUT_STEPS} currentStep={currentStep} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {/* Step 1: Information */}
          {currentStep === 0 && (
            <CheckoutInformationForm 
              onSubmit={handleInformationSubmit}
              onNext={handleNext}
            />
          )}
          
          {/* Step 2: Agent Location Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <AgentLocationSelector 
                agents={mockAgents}
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
              amount={total}
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
          <CheckoutSummary items={mockCartItems} />
        </div>
      </div>
    </div>
  )
}