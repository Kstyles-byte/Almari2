"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Truck, MapPin, Copy, ShoppingBag, Star, ArrowDownToLine, 
  FileText, ClipboardCheck, Check, CalendarClock, AlertTriangle,
  Clock, PackageOpen
} from 'lucide-react';
import { formatDistanceToNow, format, isAfter, isBefore } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  quantity: number;
  price: number;
  vendor: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  pickupCode: string;
  pickupLocation: string;
  pickupAddress: string;
  expectedDeliveryDate?: string;
  deliveredDate?: string;
  returnEligible: boolean;
  returnDeadline?: string;
  trackingEvents?: OrderTrackingEvent[];
}

export interface OrderTrackingEvent {
  status: string;
  timestamp: string;
  description: string;
}

interface OrderDetailProps {
  order: Order;
  onTrackOrder?: () => void;
  onRequestReturn?: (orderId: string) => void;
  onWriteReview?: (productId: string) => void;
  onDownloadInvoice?: (orderId: string) => void;
}

export function OrderDetail({ 
  order, 
  onTrackOrder, 
  onRequestReturn, 
  onWriteReview,
  onDownloadInvoice
}: OrderDetailProps) {
  const [activeTab, setActiveTab] = useState('items');
  const isDelivered = order.status === 'delivered';
  const canRequestReturn = isDelivered && order.returnEligible;
  const isReturnDeadlineExpired = order.returnDeadline ? 
    isAfter(new Date(), new Date(order.returnDeadline)) : false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(order.pickupCode);
    // You could show a toast notification here
  };

  const orderStatusMap = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', progress: 25 },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', progress: 50 },
    shipped: { label: 'Ready for Pickup', color: 'bg-purple-100 text-purple-800', progress: 75 },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', progress: 100 },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', progress: 0 }
  };

  // Default tracking events if none provided
  const trackingEvents = order.trackingEvents || [
    {
      status: 'Order Placed',
      timestamp: order.createdAt,
      description: 'Your order has been received and is being processed'
    },
    ...(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? [{
      status: 'Processing',
      timestamp: new Date(new Date(order.createdAt).getTime() + 3600000).toISOString(),
      description: 'Your order is being prepared for dispatch'
    }] : []),
    ...(order.status === 'shipped' || order.status === 'delivered' ? [{
      status: 'Ready for Pickup',
      timestamp: order.expectedDeliveryDate || new Date(new Date(order.createdAt).getTime() + 86400000).toISOString(),
      description: 'Your order is ready for pickup at the agent location'
    }] : []),
    ...(order.status === 'delivered' ? [{
      status: 'Delivered',
      timestamp: order.deliveredDate || new Date(new Date(order.createdAt).getTime() + 172800000).toISOString(),
      description: 'Your order has been successfully delivered'
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Order Header & Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zervia-900">Order #{order.orderNumber}</h2>
                <Badge className={orderStatusMap[order.status].color}>
                  {orderStatusMap[order.status].label}
                </Badge>
              </div>
              <p className="text-sm text-zervia-500 mt-1">
                Placed {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              {onTrackOrder && (
                <Button 
                  variant="outline" 
                  className="text-zervia-600"
                  onClick={onTrackOrder}
                >
                  <Truck className="h-4 w-4 mr-2" /> Track Order
                </Button>
              )}
              
              {onDownloadInvoice && (
                <Button 
                  variant="outline" 
                  className="text-zervia-600"
                  onClick={() => onDownloadInvoice(order.id)}
                >
                  <FileText className="h-4 w-4 mr-2" /> Invoice
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          {order.status !== 'cancelled' && (
            <div className="mt-2 space-y-2">
              <Progress value={orderStatusMap[order.status].progress} className="h-2" />
              <div className="flex justify-between text-xs text-zervia-500">
                <span>Order Placed</span>
                <span>Processing</span>
                <span>Ready for Pickup</span>
                <span>Delivered</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="items" className="flex-1">Order Items</TabsTrigger>
          <TabsTrigger value="pickup" className="flex-1">Pickup Details</TabsTrigger>
          <TabsTrigger value="tracking" className="flex-1">Order Timeline</TabsTrigger>
        </TabsList>
        
        {/* Order Items Tab */}
        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-zervia-500" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="relative w-16 h-16 flex-shrink-0 mr-4">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <Link href={`/product/${item.productSlug}`} className="hover:text-zervia-600 transition-colors">
                            <h4 className="font-medium">{item.productName}</h4>
                          </Link>
                          <p className="text-sm text-zervia-500 mt-0.5">Vendor: {item.vendor}</p>
                          <p className="text-sm mt-1">
                            ${item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          
                          {isDelivered && onWriteReview && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 text-zervia-600 h-7 px-2 text-xs"
                              onClick={() => onWriteReview(item.productId)}
                            >
                              <Star className="h-3 w-3 mr-1" /> Write Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium mt-3 pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pickup Details Tab */}
        <TabsContent value="pickup" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-zervia-500" /> Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zervia-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-zervia-600 font-medium">Pickup Code</p>
                  <div className="flex items-center mt-1">
                    <code className="relative rounded bg-muted px-[0.5rem] py-[0.2rem] font-mono text-lg font-semibold">
                      {order.pickupCode}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-7 w-7 p-0"
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-3.5 w-3.5 text-zervia-500" />
                      <span className="sr-only">Copy code</span>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-zervia-600 font-medium">Pickup Location</p>
                  <p className="text-sm mt-1">{order.pickupLocation}</p>
                  <p className="text-sm text-zervia-500">{order.pickupAddress}</p>
                </div>
                
                {order.expectedDeliveryDate && (
                  <div>
                    <p className="text-sm text-zervia-600 font-medium">Expected Ready Date</p>
                    <p className="text-sm mt-1">{format(new Date(order.expectedDeliveryDate), 'MMMM d, yyyy')}</p>
                  </div>
                )}
                
                {order.deliveredDate && (
                  <div>
                    <p className="text-sm text-zervia-600 font-medium">Picked Up On</p>
                    <p className="text-sm mt-1">{format(new Date(order.deliveredDate), 'MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>
              
              {/* Agent Hours */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-zervia-900">Agent Hours</h4>
                <div className="mt-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-zervia-900">Agent Contact</h4>
                <p className="text-sm mt-2">Phone: +234 123 456 7890</p>
                <p className="text-sm">Email: agent@zervia.com</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Order Timeline Tab */}
        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-zervia-500" /> Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4 py-2">
                  {trackingEvents.map((event, index) => (
                    <div key={index} className="relative pl-6 pb-8 last:pb-0">
                      <div className="absolute left-0 top-0 h-full w-px bg-zervia-100" />
                      <div className={`absolute left-[-4px] top-1 h-2 w-2 rounded-full ${
                        index === 0 ? 'bg-zervia-600 ring-4 ring-zervia-100' : 'bg-zervia-300'
                      }`} />
                      
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <h4 className="font-medium text-zervia-900">{event.status}</h4>
                          {index === 0 && (
                            <Badge className="ml-2 bg-zervia-100 text-zervia-700 hover:bg-zervia-100">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zervia-500">
                          {format(new Date(event.timestamp), 'MMM d, yyyy - h:mm a')}
                        </p>
                        <p className="text-sm text-zervia-700">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Return Information */}
      {canRequestReturn && (
        <Card className={`border-dashed border-2 ${isReturnDeadlineExpired ? 'border-red-200 bg-red-50' : 'border-zervia-200'}`}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-full ${
                isReturnDeadlineExpired ? 'bg-red-100 text-red-600' : 'bg-zervia-100 text-zervia-600'
              }`}>
                {isReturnDeadlineExpired ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <ArrowDownToLine className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-zervia-900">
                  {isReturnDeadlineExpired ? 'Return Deadline Expired' : 'Return Eligible'}
                </h3>
                <p className={`text-sm mt-1 ${
                  isReturnDeadlineExpired ? 'text-red-600' : 'text-zervia-600'
                }`}>
                  {isReturnDeadlineExpired ? (
                    'The return window for this order has expired'
                  ) : (
                    `You can request a return until ${format(new Date(order.returnDeadline || ''), 'MMMM d, yyyy')}`
                  )}
                </p>
                
                {!isReturnDeadlineExpired && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-zervia-900">Return Policy:</h4>
                    <ul className="mt-1 text-sm text-zervia-600 list-disc list-inside space-y-1">
                      <li>Items must be in original condition</li>
                      <li>Include original packaging and tags</li>
                      <li>Returns must be initiated within 7 days of delivery</li>
                    </ul>
                  </div>
                )}
              </div>
              {onRequestReturn && !isReturnDeadlineExpired && (
                <Button 
                  className="bg-zervia-600 hover:bg-zervia-700"
                  onClick={() => onRequestReturn(order.id)}
                >
                  Request Return
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 