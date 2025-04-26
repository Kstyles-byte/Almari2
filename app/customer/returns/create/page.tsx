"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toast } from '@/components/ui/toast';
import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  PackageOpen, 
  ShoppingBag
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CheckoutStepper } from '../../../../components/checkout/checkout-stepper';

// Form schema validation
const returnItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  productImage: z.string(),
  isSelected: z.boolean(),
  quantity: z.number().min(1),
  maxQuantity: z.number(),
  reason: z.string().optional(),
  condition: z.string().optional(),
  additionalInfo: z.string().optional(),
});

const returnFormSchema = z.object({
  orderNumber: z.string(),
  items: z.array(returnItemSchema),
  returnMethod: z.enum(['refund', 'exchange', 'store_credit']),
  returnReason: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

// Mock order data
const mockOrders = [
  {
    id: 'ord-001',
    orderNumber: 'ZRV-67890',
    date: '2023-09-25T16:45:00Z',
    total: 129.99,
    items: [
      {
        id: 'item-001',
        productId: 'prod-123',
        name: 'Women\'s Cashmere Sweater - Gray',
        image: '/images/products/sweater.jpg',
        price: 89.99,
        quantity: 1,
        maxQuantity: 1,
      },
      {
        id: 'item-002',
        productId: 'prod-124',
        name: 'Designer Jeans - Blue',
        image: '/images/products/jeans.jpg',
        price: 39.99,
        quantity: 1,
        maxQuantity: 1,
      }
    ]
  },
  {
    id: 'ord-002',
    orderNumber: 'ZRV-45678',
    date: '2023-09-18T12:30:00Z',
    total: 64.99,
    items: [
      {
        id: 'item-003',
        productId: 'prod-125',
        name: 'Running Shoes - Black/Red',
        image: '/images/products/shoes.jpg',
        price: 64.99,
        quantity: 1,
        maxQuantity: 1,
      }
    ]
  }
];

// Return reasons
const returnReasons = [
  { value: "wrong_size", label: "Wrong size" },
  { value: "wrong_item", label: "Received wrong item" },
  { value: "defective", label: "Item is defective/damaged" },
  { value: "not_as_described", label: "Item not as described" },
  { value: "unwanted", label: "No longer wanted" },
  { value: "other", label: "Other reason" }
];

// Return condition options
const itemConditions = [
  { value: "unworn", label: "Unworn with tags" },
  { value: "opened", label: "Opened but unused" },
  { value: "used", label: "Used" },
  { value: "damaged", label: "Damaged" }
];

export default function CreateReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initialize form with default values
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      orderNumber: '',
      items: [],
      returnMethod: 'refund',
      returnReason: '',
    },
  });

  // Find order from URL param
  useEffect(() => {
    if (orderId) {
      const order = mockOrders.find(o => o.id === orderId);
      if (order) {
        handleOrderSelect(order);
      }
    }
  }, [orderId]);

  // Handle order selection
  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order);
    
    // Map order items to form structure
    const formItems = order.items.map((item: any) => ({
      id: item.id,
      productName: item.name,
      productImage: item.image,
      isSelected: false,
      quantity: 1,
      maxQuantity: item.quantity,
      reason: '',
      condition: 'unworn',
      additionalInfo: '',
    }));
    
    form.reset({
      orderNumber: order.orderNumber,
      items: formItems,
      returnMethod: 'refund',
      returnReason: '',
    });
  };

  // Handle next step
  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate order selection
      if (!selectedOrder) {
        setToastMessage('Please select an order to return');
        setShowToast(true);
        return;
      }
      setCurrentStep(1);
    } 
    else if (currentStep === 1) {
      // Check if at least one item is selected
      const selectedItems = form.getValues().items.filter(item => item.isSelected);
      if (selectedItems.length === 0) {
        setToastMessage('Please select at least one item to return');
        setShowToast(true);
        return;
      }
      setCurrentStep(2);
    }
    else if (currentStep === 2) {
      // Validate all selected items have reasons
      const items = form.getValues().items.filter(item => item.isSelected);
      const allHaveReasons = items.every(item => item.reason && item.reason.trim() !== '');
      if (!allHaveReasons) {
        setToastMessage('Please provide a reason for all selected items');
        setShowToast(true);
        return;
      }
      setCurrentStep(3);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const onSubmit = (data: ReturnFormValues) => {
    console.log('Return request submitted:', data);
    // Only include selected items
    const filteredData = {
      ...data,
      items: data.items.filter(item => item.isSelected),
    };
    
    // Here you would normally send this to your API
    console.log('Filtered data:', filteredData);
    
    // Redirect to success page or return dashboard
    router.push('/customer/returns/success?id=new-return-id');
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/customer/returns" className="flex items-center text-zervia-600 hover:text-zervia-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Returns Dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-2">Create Return Request</h1>
        <p className="text-zervia-500">Return or exchange items from your recent orders</p>
      </div>
      
      {/* Stepper */}
      <CheckoutStepper currentStep={currentStep} steps={['Select Order', 'Select Items', 'Return Details', 'Review & Submit']} />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Select Order */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select an Order to Return</CardTitle>
                </CardHeader>
                <CardContent>
                  {mockOrders.length > 0 ? (
                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedOrder?.id === order.id 
                              ? 'border-zervia-600 bg-zervia-50' 
                              : 'border-gray-200 hover:border-zervia-300'
                          }`}
                          onClick={() => handleOrderSelect(order)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                              <p className="text-sm text-zervia-500">
                                Ordered on {format(new Date(order.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className="text-zervia-700 font-semibold mr-3">
                                ${order.total.toFixed(2)}
                              </span>
                              {selectedOrder?.id === order.id && (
                                <div className="h-5 w-5 rounded-full bg-zervia-600 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center space-x-3">
                                <div className="relative h-12 w-12 flex-shrink-0">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm line-clamp-1">{item.name}</p>
                                  <p className="text-xs text-zervia-500">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-zervia-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Recent Orders</h3>
                      <p className="text-zervia-500 mb-6">
                        You don't have any recent orders that are eligible for returns.
                      </p>
                      <Button asChild>
                        <Link href="/products">Shop Now</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Select Items */}
          {currentStep === 1 && selectedOrder && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Select Items to Return from Order #{selectedOrder.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.getValues().items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`border rounded-lg p-4 transition-all ${
                          form.getValues().items[index].isSelected
                            ? 'border-zervia-600 bg-zervia-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <FormField
                            control={form.control}
                            name={`items.${index}.isSelected`}
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex-1">
                                  <div className="flex space-x-4">
                                    <div className="relative h-16 w-16 flex-shrink-0">
                                      <Image
                                        src={item.productImage}
                                        alt={item.productName}
                                        fill
                                        className="object-cover rounded-md"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">{item.productName}</p>
                                      <p className="text-sm text-zervia-500 mt-1">
                                        Max Quantity: {item.maxQuantity}
                                      </p>
                                    </div>
                                  </div>
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {form.getValues().items[index].isSelected && (
                          <div className="mt-4 pl-7">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Quantity to Return</FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value.toString()}
                                      onValueChange={(value) => field.onChange(parseInt(value))}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Select quantity" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from(
                                          { length: item.maxQuantity },
                                          (_, i) => i + 1
                                        ).map((qty) => (
                                          <SelectItem key={qty} value={qty.toString()}>
                                            {qty}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Return Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Return Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {form.getValues().items
                      .filter(item => item.isSelected)
                      .map((item, originalIndex) => {
                        // Find the original index of this item in the full items array
                        const index = form.getValues().items.findIndex(i => i.id === item.id);
                        
                        return (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <div className="relative h-16 w-16 flex-shrink-0">
                                <Image
                                  src={item.productImage}
                                  alt={item.productName}
                                  fill
                                  className="object-cover rounded-md"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-zervia-500 mt-1">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 space-y-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.reason`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Reason for Return</FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {returnReasons.map((reason) => (
                                            <SelectItem 
                                              key={reason.value} 
                                              value={reason.value}
                                            >
                                              {reason.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`items.${index}.condition`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Item Condition</FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {itemConditions.map((condition) => (
                                            <SelectItem 
                                              key={condition.value} 
                                              value={condition.value}
                                            >
                                              {condition.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`items.${index}.additionalInfo`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Additional Details (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Please provide any additional information that will help us process your return"
                                        className="resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                      
                    <FormField
                      control={form.control}
                      name="returnMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Return Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="refund" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Refund to original payment method
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="exchange" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Exchange for a different size/color
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="store_credit" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Store credit (valid for 1 year)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Your Return Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Order Information</h3>
                      <p className="text-sm">Order Number: {form.getValues().orderNumber}</p>
                      <p className="text-sm">Order Date: {
                        selectedOrder 
                          ? format(new Date(selectedOrder.date), 'MMM d, yyyy') 
                          : 'N/A'
                      }</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Items to Return</h3>
                      <div className="space-y-4">
                        {form.getValues().items
                          .filter(item => item.isSelected)
                          .map((item) => (
                            <div key={item.id} className="flex space-x-4">
                              <div className="relative h-16 w-16 flex-shrink-0">
                                <Image
                                  src={item.productImage}
                                  alt={item.productName}
                                  fill
                                  className="object-cover rounded-md"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-zervia-500">Quantity: {item.quantity}</p>
                                <div className="mt-1 text-sm">
                                  <span className="text-zervia-600">Reason:</span> {
                                    returnReasons.find(r => r.value === item.reason)?.label || item.reason
                                  }
                                </div>
                                <div className="text-sm">
                                  <span className="text-zervia-600">Condition:</span> {
                                    itemConditions.find(c => c.value === item.condition)?.label || item.condition
                                  }
                                </div>
                                {item.additionalInfo && (
                                  <div className="text-sm mt-1">
                                    <span className="text-zervia-600">Additional Info:</span> {item.additionalInfo}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Return Method</h3>
                      <p className="text-sm">{
                        form.getValues().returnMethod === 'refund'
                          ? 'Refund to original payment method'
                          : form.getValues().returnMethod === 'exchange'
                            ? 'Exchange for a different size/color'
                            : 'Store credit (valid for 1 year)'
                      }</p>
                    </div>
                    
                    <div className="bg-zervia-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Next Steps</h3>
                      <ol className="list-decimal ml-5 text-sm space-y-1">
                        <li>After submitting your request, you'll receive a confirmation email within 24 hours.</li>
                        <li>Once approved, you'll receive a return shipping label to print.</li>
                        <li>Pack the items in their original packaging if possible.</li>
                        <li>Attach the shipping label and drop off at any authorized shipping location.</li>
                        <li>We'll process your return within 5-7 business days of receiving your items.</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit">
                Submit Return Request
              </Button>
            )}
          </div>
        </form>
      </Form>
      
      {/* Toast Notification */}
      {showToast && (
        <Toast
          title="Error"
          variant="destructive"
        >
          {toastMessage}
        </Toast>
      )}
    </div>
  );
} 