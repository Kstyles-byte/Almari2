"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PackageOpen, 
  Clock, 
  Plus, 
  History, 
  ChevronRight, 
  RefreshCw,
  Truck,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  reason: string;
}

interface ReturnRequest {
  id: string;
  orderNumber: string;
  orderDate: string;
  requestDate: string;
  status: 'pending' | 'approved';
  items: ReturnItem[];
  timeline: {
    status: string;
    date: string;
    message: string;
  }[];
}

// Mock active return request data
const activeReturns: ReturnRequest[] = [
  {
    id: 'rtn-001',
    orderNumber: 'ZRV-12345',
    orderDate: '2023-09-15T14:30:00Z',
    requestDate: '2023-09-20T10:15:00Z',
    status: 'pending',
    items: [
      {
        id: 'ri-001',
        productId: 'prod1',
        productName: 'Men\'s Classic Oxford Shirt - Blue',
        productImage: '/images/products/shirt.jpg',
        quantity: 1,
        reason: 'Wrong size'
      }
    ],
    timeline: [
      {
        status: 'requested',
        date: '2023-09-20T10:15:00Z',
        message: 'Return request submitted'
      }
    ]
  },
  {
    id: 'rtn-002',
    orderNumber: 'ZRV-54321',
    orderDate: '2023-09-01T11:45:00Z',
    requestDate: '2023-09-10T09:30:00Z',
    status: 'approved',
    items: [
      {
        id: 'ri-002',
        productId: 'prod3',
        productName: 'Leather Ankle Boots - Brown',
        productImage: '/images/products/boots.jpg',
        quantity: 1,
        reason: 'Defective item'
      },
      {
        id: 'ri-002b',
        productId: 'prod4',
        productName: 'Cotton T-Shirt - Black',
        productImage: '/images/products/tshirt.jpg',
        quantity: 2,
        reason: 'Wrong color'
      }
    ],
    timeline: [
      {
        status: 'requested',
        date: '2023-09-10T09:30:00Z',
        message: 'Return request submitted'
      },
      {
        status: 'approved',
        date: '2023-09-12T15:20:00Z',
        message: 'Return request approved'
      }
    ]
  }
];

// Recent orders that can be returned
const recentOrders = [
  {
    id: 'ord-001',
    orderNumber: 'ZRV-67890',
    date: '2023-09-25T16:45:00Z',
    total: 129.99,
    items: [
      {
        id: 'item-001',
        name: 'Women\'s Cashmere Sweater - Gray',
        image: '/images/products/sweater.jpg',
        price: 89.99,
        quantity: 1
      },
      {
        id: 'item-002',
        name: 'Designer Jeans - Blue',
        image: '/images/products/jeans.jpg',
        price: 39.99,
        quantity: 1
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
        name: 'Running Shoes - Black/Red',
        image: '/images/products/shoes.jpg',
        price: 64.99,
        quantity: 1
      }
    ]
  }
];

const statusIcons: Record<string, React.ReactNode> = {
  requested: <Clock className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  received: <Package className="h-4 w-4" />,
  processing: <RefreshCw className="h-4 w-4" />,
};

export default function ReturnsDashboard() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Returns & Exchanges</h1>
        <p className="text-zervia-500">Manage your product returns and track return status</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Link href="/customer/returns/create" className="flex-1">
          <Card className="h-full transition-all hover:border-zervia-500 hover:shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-zervia-50 p-3 rounded-full mb-4">
                <Plus className="h-6 w-6 text-zervia-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Create New Return</h3>
              <p className="text-zervia-500 text-center text-sm">Return or exchange items from your recent orders</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/customer/returns/history" className="flex-1">
          <Card className="h-full transition-all hover:border-zervia-500 hover:shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="bg-zervia-50 p-3 rounded-full mb-4">
                <History className="h-6 w-6 text-zervia-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">View Return History</h3>
              <p className="text-zervia-500 text-center text-sm">See your completed and past returns</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <Tabs defaultValue="active" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Returns ({activeReturns.length})</TabsTrigger>
          <TabsTrigger value="eligible">Eligible for Return</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {activeReturns.length > 0 ? (
            <div className="space-y-4">
              {activeReturns.map((returnRequest) => (
                <Card key={returnRequest.id} className="overflow-hidden">
                  <div className="border-l-4 h-full" style={{ 
                    borderColor: returnRequest.status === 'approved' ? '#10b981' : '#f59e0b' 
                  }}>
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">Return #{returnRequest.id}</h3>
                              <Badge className={
                                returnRequest.status === 'pending' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-green-100 text-green-800'
                              }>
                                <span className="flex items-center">
                                  {returnRequest.status === 'pending' 
                                    ? <Clock className="h-4 w-4 mr-1" /> 
                                    : <CheckCircle2 className="h-4 w-4 mr-1" />
                                  }
                                  {returnRequest.status === 'pending' ? 'Pending' : 'Approved'}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-zervia-500 mt-1">
                              Requested on {format(new Date(returnRequest.requestDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          
                          <div className="mt-2 sm:mt-0">
                            <Link href={`/customer/returns/${returnRequest.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-sm text-zervia-500 mb-2">Order #{returnRequest.orderNumber}</div>
                          <div className="flex flex-col sm:flex-row gap-4">
                            {returnRequest.items.map((item) => (
                              <div key={item.id} className="flex items-center space-x-3">
                                <div className="relative w-14 h-14 flex-shrink-0">
                                  <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                                  <p className="text-xs text-zervia-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-3">Return Progress</h4>
                          <ol className="relative border-l border-gray-200">
                            {returnRequest.timeline.map((event, index) => (
                              <li key={index} className="mb-4 ml-4">
                                <div className="absolute w-3 h-3 bg-zervia-600 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                                <time className="mb-1 text-xs font-normal leading-none text-zervia-500">
                                  {format(new Date(event.date), 'MMM d, yyyy')}
                                </time>
                                <p className="text-sm flex items-center">
                                  {statusIcons[event.status] && (
                                    <span className="mr-1">{statusIcons[event.status]}</span>
                                  )}
                                  {event.message}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </div>
                        
                        {returnRequest.status === 'approved' && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="p-3 bg-green-50 rounded-md">
                              <p className="text-sm text-green-800 flex items-start">
                                <Package className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                <span>Your return has been approved. Please follow the instructions in the email to ship your items back.</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-10">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="bg-zervia-50 p-3 rounded-full mb-4">
                  <PackageOpen className="h-6 w-6 text-zervia-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Returns</h3>
                <p className="text-zervia-500 max-w-md mb-6">
                  You don't have any active return requests at the moment.
                  Need to return something? Start a new return request.
                </p>
                <Link href="/customer/returns/create">
                  <Button className="bg-zervia-600 hover:bg-zervia-700">
                    Create New Return
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="eligible">
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">Order #{order.orderNumber}</CardTitle>
                        <CardDescription>
                          Ordered on {format(new Date(order.date), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <span className="text-zervia-700 font-semibold">${order.total.toFixed(2)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="relative w-14 h-14 flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-zervia-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/customer/orders/${order.id}`}>
                        View Order
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/customer/returns/create?order=${order.id}`}>
                        Return Items
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="py-10">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="bg-zervia-50 p-3 rounded-full mb-4">
                    <Package className="h-6 w-6 text-zervia-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Recent Orders</h3>
                  <p className="text-zervia-500 max-w-md mb-6">
                    You don't have any recent orders that are eligible for return.
                    Orders are typically eligible for return within 30 days of delivery.
                  </p>
                  <Link href="/products">
                    <Button className="bg-zervia-600 hover:bg-zervia-700">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Return Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>We want you to be completely satisfied with your purchase. If you're not, we're here to help.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Returns are accepted within 30 days of purchase for most items</li>
            <li>Items must be unworn, unwashed, and undamaged with all original tags attached</li>
            <li>Refunds will be processed back to the original payment method</li>
            <li>Shipping fees are non-refundable unless the return is due to our error</li>
          </ul>
          <p>For more information, please read our full <Link href="/customer-service/return-policy" className="text-zervia-600 hover:underline">Return Policy</Link>.</p>
        </CardContent>
      </Card>
    </div>
  );
} 