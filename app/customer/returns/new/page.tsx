"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Undo2, AlertCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  quantity: number;
  price: number;
  vendor: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  total: number;
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    id: 'ord1',
    orderNumber: 'ZRV-54321',
    orderDate: '2023-10-15T12:00:00Z',
    items: [
      {
        id: 'item1',
        productId: 'prod1',
        productName: 'Premium Leather Wallet',
        productImage: '/images/products/wallet.jpg',
        productSlug: 'premium-leather-wallet',
        quantity: 1,
        price: 59.99,
        vendor: 'LeatherCraft Co.'
      },
      {
        id: 'item2',
        productId: 'prod2',
        productName: 'Cotton T-Shirt - Black',
        productImage: '/images/products/tshirt.jpg',
        productSlug: 'cotton-tshirt-black',
        quantity: 2,
        price: 24.99,
        vendor: 'Urban Apparel'
      }
    ],
    total: 109.97
  },
  {
    id: 'ord2',
    orderNumber: 'ZRV-65432',
    orderDate: '2023-09-05T14:00:00Z',
    items: [
      {
        id: 'item3',
        productId: 'prod3',
        productName: 'Silk Scarf - Blue Pattern',
        productImage: '/images/products/scarf.jpg',
        productSlug: 'silk-scarf-blue',
        quantity: 1,
        price: 39.99,
        vendor: 'Fashion Emporium'
      }
    ],
    total: 39.99
  }
];

const returnReasons = [
  'Damaged on arrival',
  'Defective item',
  'Incorrect item received',
  'Item not as described',
  'Size/fit issues',
  'Changed my mind',
  'Other (please specify)'
];

export default function NewReturnRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');
  
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [otherReasons, setOtherReasons] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [step, setStep] = useState(1);
  
  // Get the selected order
  const selectedOrder = mockOrders.find(order => order.id === selectedOrderId);
  
  // Initialize quantities when order is selected
  useEffect(() => {
    if (selectedOrder) {
      const initialQuantities: Record<string, number> = {};
      const initialSelectedItems: Record<string, boolean> = {};
      
      selectedOrder.items.forEach(item => {
        initialQuantities[item.id] = 1; // Default to 1
        initialSelectedItems[item.id] = false; // Default to not selected
      });
      
      setQuantities(initialQuantities);
      setSelectedItems(initialSelectedItems);
    }
  }, [selectedOrder]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleQuantityChange = (itemId: string, value: number, maxQuantity: number) => {
    const newValue = Math.min(Math.max(1, value), maxQuantity);
    setQuantities(prev => ({ ...prev, [itemId]: newValue }));
  };

  const handleReasonSelect = (itemId: string, reason: string) => {
    setReturnReasons(prev => ({ ...prev, [itemId]: reason }));
    
    // Clear "Other reason" if a standard reason is selected
    if (reason !== 'Other (please specify)') {
      setOtherReasons(prev => {
        const newReasons = { ...prev };
        delete newReasons[itemId];
        return newReasons;
      });
    }
  };

  const handleOtherReasonChange = (itemId: string, reason: string) => {
    setOtherReasons(prev => ({ ...prev, [itemId]: reason }));
  };

  const goToNextStep = () => {
    if (step === 1) {
      if (!selectedOrder) {
        toast({
          title: "No order selected",
          description: "Please select an order to continue.",
          variant: "destructive"
        });
        return;
      }
      
      const hasSelectedItems = Object.values(selectedItems).some(selected => selected);
      if (!hasSelectedItems) {
        toast({
          title: "No items selected",
          description: "Please select at least one item to return.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (step === 2) {
      // Check if all selected items have reasons
      const selectedItemIds = Object.entries(selectedItems)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);
      
      const allHaveReasons = selectedItemIds.every(id => 
        returnReasons[id] && 
        (returnReasons[id] !== 'Other (please specify)' || otherReasons[id])
      );
      
      if (!allHaveReasons) {
        toast({
          title: "Missing return reasons",
          description: "Please provide a reason for each selected item.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setStep(prev => prev + 1);
  };

  const goToPreviousStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    // In a real application, you would submit the return request data to your API
    toast({
      title: "Return request submitted",
      description: "Your return request has been successfully submitted.",
    });
    
    router.push('/customer/returns');
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Link href="/customer/returns" className="inline-flex items-center text-zervia-600 hover:text-zervia-700 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Create Return Request</h1>
      
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
            step >= 1 ? 'bg-zervia-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`h-1 flex-1 mx-2 ${
            step >= 2 ? 'bg-zervia-600' : 'bg-gray-200'
          }`}></div>
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
            step >= 2 ? 'bg-zervia-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`h-1 flex-1 mx-2 ${
            step >= 3 ? 'bg-zervia-600' : 'bg-gray-200'
          }`}></div>
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
            step >= 3 ? 'bg-zervia-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-zervia-500">
          <span>Select Items</span>
          <span>Return Reasons</span>
          <span>Review & Submit</span>
        </div>
      </div>
      
      {/* Step 1: Select Items */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Items to Return</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Selection */}
            {!preselectedOrderId && (
              <div className="mb-6">
                <Label htmlFor="order-select">Select Order</Label>
                <Select 
                  value={selectedOrderId} 
                  onValueChange={handleOrderSelect}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.orderNumber} - {format(new Date(order.orderDate), 'MMMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Display Order Items */}
            {selectedOrder && (
              <div>
                <div className="bg-zervia-50 p-3 rounded-md mb-4">
                  <h3 className="font-medium">Order #{selectedOrder.orderNumber}</h3>
                  <p className="text-sm text-zervia-500">
                    Ordered on {format(new Date(selectedOrder.orderDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-start p-3 border border-gray-200 rounded-md">
                      <div className="mr-3 mt-1">
                        <Checkbox 
                          id={`item-${item.id}`} 
                          checked={selectedItems[item.id] || false}
                          onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                        />
                      </div>
                      
                      <div className="relative w-16 h-16 flex-shrink-0 mr-4">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <Label 
                          htmlFor={`item-${item.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {item.productName}
                        </Label>
                        <p className="text-sm text-zervia-500 mt-1">
                          Vendor: {item.vendor}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm">${item.price.toFixed(2)}</p>
                          
                          {selectedItems[item.id] && (
                            <div className="flex items-center">
                              <Label htmlFor={`quantity-${item.id}`} className="text-sm mr-2">
                                Qty to Return:
                              </Label>
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1, item.quantity)}
                                  disabled={(quantities[item.id] || 1) <= 1}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{quantities[item.id] || 1}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1, item.quantity)}
                                  disabled={(quantities[item.id] || 1) >= item.quantity}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={goToNextStep}
              className="bg-zervia-600 hover:bg-zervia-700"
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 2: Return Reasons */}
      {step === 2 && selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Return Reasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Please provide the reason for returning each item. This helps us process your return more efficiently.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {selectedOrder.items
                .filter(item => selectedItems[item.id])
                .map(item => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex items-start mb-4">
                      <div className="relative w-12 h-12 flex-shrink-0 mr-3">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.productName}</h3>
                        <p className="text-sm text-zervia-500">
                          Quantity to return: {quantities[item.id] || 1}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium mb-2 block">Reason for Return</Label>
                        <RadioGroup 
                          value={returnReasons[item.id] || ''} 
                          onValueChange={(value) => handleReasonSelect(item.id, value)}
                          className="space-y-2"
                        >
                          {returnReasons.map((reason) => (
                            <div key={reason} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={reason} 
                                id={`${item.id}-${reason.replace(/\s+/g, '-').toLowerCase()}`} 
                              />
                              <Label 
                                htmlFor={`${item.id}-${reason.replace(/\s+/g, '-').toLowerCase()}`}
                                className="cursor-pointer"
                              >
                                {reason}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      {returnReasons[item.id] === 'Other (please specify)' && (
                        <div>
                          <Label htmlFor={`other-reason-${item.id}`} className="font-medium mb-2 block">
                            Please specify
                          </Label>
                          <Textarea 
                            id={`other-reason-${item.id}`} 
                            placeholder="Please provide details..."
                            value={otherReasons[item.id] || ''}
                            onChange={(e) => handleOtherReasonChange(item.id, e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div>
              <Label htmlFor="general-notes" className="font-medium mb-2 block">
                Additional Notes (Optional)
              </Label>
              <Textarea 
                id="general-notes" 
                placeholder="Any additional information about your return..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
            >
              Back
            </Button>
            <Button 
              onClick={goToNextStep}
              className="bg-zervia-600 hover:bg-zervia-700"
            >
              Review Request
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 3: Review & Submit */}
      {step === 3 && selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Return Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-zervia-50 p-3 rounded-md mb-4">
              <h3 className="font-medium">Order #{selectedOrder.orderNumber}</h3>
              <p className="text-sm text-zervia-500">
                Ordered on {format(new Date(selectedOrder.orderDate), 'MMMM d, yyyy')}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Items to Return</h3>
              <div className="space-y-4">
                {selectedOrder.items
                  .filter(item => selectedItems[item.id])
                  .map(item => (
                    <div key={item.id} className="flex items-start p-3 border border-gray-200 rounded-md">
                      <div className="relative w-16 h-16 flex-shrink-0 mr-4">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-zervia-500 mt-1">
                          Vendor: {item.vendor}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <p className="text-sm">Quantity: {quantities[item.id] || 1}</p>
                            <p className="text-sm">
                              Subtotal: ${((item.price * (quantities[item.id] || 1)).toFixed(2))}
                            </p>
                          </div>
                          <Badge className="bg-zervia-100 text-zervia-800">
                            {returnReasons[item.id] === 'Other (please specify)' 
                              ? 'Other Reason' 
                              : returnReasons[item.id]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {Object.values(otherReasons).some(reason => reason) && (
              <div>
                <h3 className="font-medium mb-3">Custom Reasons</h3>
                <div className="space-y-3">
                  {Object.entries(otherReasons)
                    .filter(([_, reason]) => reason)
                    .map(([itemId, reason]) => {
                      const item = selectedOrder.items.find(i => i.id === itemId);
                      if (!item) return null;
                      
                      return (
                        <div key={itemId} className="bg-gray-50 p-3 rounded-md">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-sm text-zervia-600 mt-1">{reason}</p>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}
            
            {generalNotes && (
              <div>
                <h3 className="font-medium mb-3">Additional Notes</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">{generalNotes}</p>
                </div>
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <ShoppingBag className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Next steps after submission:</p>
                  <ol className="list-decimal pl-5 mt-1 space-y-1">
                    <li>Your return request will be reviewed within 24-48 hours</li>
                    <li>Once approved, you'll receive return instructions</li>
                    <li>Return the items to the nearest agent location</li>
                    <li>Your refund will be processed after items are received and inspected</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
            >
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-zervia-600 hover:bg-zervia-700"
            >
              Submit Return Request
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 