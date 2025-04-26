"use client"

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, PackageCheck, Truck, AlertCircle, Check, X, ArrowRight, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  reason: string;
}

interface ReturnRequest {
  id: string;
  orderNumber: string;
  orderDate: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  items: ReturnItem[];
  timeline: {
    status: string;
    date: string;
    description: string;
  }[];
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'failed';
  dropOffLocation?: string;
  dropOffAddress?: string;
  returnCode?: string;
  rejectionReason?: string;
}

// Mock return request data
const mockReturnRequests: Record<string, ReturnRequest> = {
  'rtn-001': {
    id: 'rtn-001',
    orderNumber: 'ZRV-54321',
    orderDate: '2023-10-15T12:00:00Z',
    requestDate: '2023-10-20T09:30:00Z',
    status: 'pending',
    items: [
      {
        id: 'ri-001',
        productId: 'prod1',
        productName: 'Premium Leather Wallet',
        productImage: '/images/products/wallet.jpg',
        quantity: 1,
        price: 59.99,
        reason: 'Damaged on arrival'
      }
    ],
    timeline: [
      {
        status: 'Request Submitted',
        date: '2023-10-20T09:30:00Z',
        description: 'Your return request has been submitted and is awaiting review'
      }
    ]
  },
  'rtn-002': {
    id: 'rtn-002',
    orderNumber: 'ZRV-65432',
    orderDate: '2023-09-05T14:00:00Z',
    requestDate: '2023-09-10T16:45:00Z',
    status: 'approved',
    items: [
      {
        id: 'ri-002',
        productId: 'prod3',
        productName: 'Silk Scarf - Blue Pattern',
        productImage: '/images/products/scarf.jpg',
        quantity: 1,
        price: 39.99,
        reason: 'Incorrect item received'
      }
    ],
    timeline: [
      {
        status: 'Request Submitted',
        date: '2023-09-10T16:45:00Z',
        description: 'Your return request has been submitted and is awaiting review'
      },
      {
        status: 'Request Approved',
        date: '2023-09-11T10:30:00Z',
        description: 'Your return request has been approved'
      }
    ],
    dropOffLocation: 'Zervia Store - Main Street',
    dropOffAddress: '123 Main St, City Center, 10001',
    returnCode: 'RTN-XYZ-789'
  },
  'rtn-003': {
    id: 'rtn-003',
    orderNumber: 'ZRV-76543',
    orderDate: '2023-08-20T10:30:00Z',
    requestDate: '2023-08-25T11:15:00Z',
    status: 'rejected',
    items: [
      {
        id: 'ri-003',
        productId: 'prod5',
        productName: 'Wireless Headphones',
        productImage: '/images/products/headphones.jpg',
        quantity: 1,
        price: 79.99,
        reason: 'Changed my mind'
      }
    ],
    timeline: [
      {
        status: 'Request Submitted',
        date: '2023-08-25T11:15:00Z',
        description: 'Your return request has been submitted and is awaiting review'
      },
      {
        status: 'Request Rejected',
        date: '2023-08-26T14:20:00Z',
        description: 'Your return request has been rejected'
      }
    ],
    rejectionReason: 'Return policy does not cover change of mind after 14 days of purchase'
  },
  'rtn-004': {
    id: 'rtn-004',
    orderNumber: 'ZRV-87654',
    orderDate: '2023-07-10T09:00:00Z',
    requestDate: '2023-07-15T13:45:00Z',
    status: 'completed',
    items: [
      {
        id: 'ri-004',
        productId: 'prod8',
        productName: 'Vintage Leather Backpack',
        productImage: '/images/products/backpack.jpg',
        quantity: 1,
        price: 89.99,
        reason: 'Defective item'
      }
    ],
    timeline: [
      {
        status: 'Request Submitted',
        date: '2023-07-15T13:45:00Z',
        description: 'Your return request has been submitted and is awaiting review'
      },
      {
        status: 'Request Approved',
        date: '2023-07-16T10:20:00Z',
        description: 'Your return request has been approved'
      },
      {
        status: 'Item Received',
        date: '2023-07-20T16:30:00Z',
        description: 'Your returned item has been received and is being inspected'
      },
      {
        status: 'Return Completed',
        date: '2023-07-22T11:15:00Z',
        description: 'Your return has been completed and refund has been processed'
      }
    ],
    refundAmount: 89.99,
    refundStatus: 'processed'
  }
};

export default function ReturnDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const returnId = params.id as string;
  
  // Get return request data
  const returnRequest = mockReturnRequests[returnId];
  
  // If return request not found
  if (!returnRequest) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/customer/returns" className="inline-flex items-center text-zervia-600 hover:text-zervia-700 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns
        </Link>
        
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Return Request Not Found</h2>
              <p className="text-zervia-500 mb-6">The return request you're looking for doesn't exist or has been removed.</p>
              <Link href="/customer/returns">
                <Button className="bg-zervia-600 hover:bg-zervia-700">
                  View All Returns
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status configuration
  const statusConfigs: Record<string, { color: string, icon: React.ReactNode }> = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-4 w-4" /> 
    },
    approved: { 
      color: 'bg-blue-100 text-blue-800', 
      icon: <Check className="h-4 w-4" /> 
    },
    rejected: { 
      color: 'bg-red-100 text-red-800', 
      icon: <X className="h-4 w-4" /> 
    },
    completed: { 
      color: 'bg-green-100 text-green-800', 
      icon: <PackageCheck className="h-4 w-4" /> 
    },
    cancelled: { 
      color: 'bg-gray-100 text-gray-800', 
      icon: <X className="h-4 w-4" /> 
    }
  };

  const refundStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Link href="/customer/returns" className="inline-flex items-center text-zervia-600 hover:text-zervia-700 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Return Request Details</h1>
          <p className="text-zervia-500">
            Return #{returnRequest.id} for Order #{returnRequest.orderNumber}
          </p>
        </div>
        <div className="mt-2 md:mt-0">
          <Badge className={`flex items-center space-x-1 ${statusConfigs[returnRequest.status].color}`}>
            {statusConfigs[returnRequest.status].icon}
            <span className="ml-1">{returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}</span>
          </Badge>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Return Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Timeline */}
              <div className="relative space-y-4 py-2 ml-4">
                {returnRequest.timeline.map((event, index) => (
                  <div key={index} className="relative pb-8 last:pb-0">
                    <div className="absolute left-0 top-0 h-full w-px bg-zervia-100 -ml-4" />
                    <div className={`absolute left-0 top-1 h-2 w-2 rounded-full -ml-[5px] ${
                      index === 0 ? 'bg-zervia-600 ring-4 ring-zervia-100' : 'bg-zervia-300'
                    }`} />
                    
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="font-medium text-zervia-900">{event.status}</h4>
                        {index === 0 && (
                          <Badge className="ml-2 bg-zervia-100 text-zervia-700 hover:bg-zervia-100">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zervia-500">
                        {format(new Date(event.date), 'MMM d, yyyy - h:mm a')}
                      </p>
                      <p className="text-sm text-zervia-700 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Next Steps */}
              {returnRequest.status === 'pending' && (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
                  <div className="flex">
                    <Clock className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Your return request is being reviewed</p>
                      <p className="text-xs text-blue-600 mt-1">
                        We'll notify you once your request has been processed, typically within 24-48 hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {returnRequest.status === 'approved' && (
                <div className="bg-green-50 border border-green-100 rounded-md p-4 mt-4">
                  <div className="flex">
                    <PackageCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Your return request is approved</p>
                      <p className="text-xs text-green-600 mt-1">
                        Please drop off your return at the designated agent location with your return code.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {returnRequest.status === 'rejected' && returnRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-md p-4 mt-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Your return request was rejected</p>
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {returnRequest.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {returnRequest.status === 'completed' && returnRequest.refundStatus && (
                <div className="bg-green-50 border border-green-100 rounded-md p-4 mt-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Your return is completed</p>
                      <p className="text-xs text-green-600 mt-1">
                        Refund of ${returnRequest.refundAmount?.toFixed(2)} has been {returnRequest.refundStatus}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Return Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Items Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {returnRequest.items.map((item) => (
                <div key={item.id} className="flex items-start border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
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
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-zervia-500">Reason:</span>
                        <span>{item.reason}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zervia-500">Quantity:</span>
                        <span>{item.quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zervia-500">Price:</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-zervia-500">Subtotal:</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {returnRequest.refundAmount && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Refund Amount:</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">${returnRequest.refundAmount.toFixed(2)}</span>
                      {returnRequest.refundStatus && (
                        <Badge className={refundStatusColors[returnRequest.refundStatus]}>
                          {returnRequest.refundStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Return Instructions */}
        {returnRequest.status === 'approved' && returnRequest.dropOffLocation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Return Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zervia-900 mb-2">Return Code</h3>
                  <div className="bg-zervia-50 p-3 rounded-md inline-block">
                    <code className="font-mono text-lg font-semibold">{returnRequest.returnCode}</code>
                  </div>
                  <p className="text-xs text-zervia-500 mt-2">
                    Please show this code to the agent when dropping off your return.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-zervia-900 mb-2">Drop-off Location</h3>
                  <p className="text-sm">{returnRequest.dropOffLocation}</p>
                  <p className="text-sm text-zervia-500">{returnRequest.dropOffAddress}</p>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Return Guidelines</p>
                      <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-1">
                        <li>Package the items securely in their original packaging if possible</li>
                        <li>Include all accessories, tags, and manuals that came with the items</li>
                        <li>Present your return code to the agent at drop-off</li>
                        <li>Your refund will be processed after the items are inspected</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <Link href={`/customer/orders/${returnRequest.orderNumber}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              View Original Order
            </Button>
          </Link>
          
          {returnRequest.status === 'rejected' && (
            <Link href="/customer/support">
              <Button className="w-full sm:w-auto bg-zervia-600 hover:bg-zervia-700">
                Contact Support
              </Button>
            </Link>
          )}
          
          {returnRequest.status === 'completed' && returnRequest.refundStatus === 'failed' && (
            <Button className="w-full sm:w-auto bg-zervia-600 hover:bg-zervia-700">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry Refund
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 