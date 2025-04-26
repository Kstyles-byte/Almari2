"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'returned':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Mock orders data
const mockOrders = [
  {
    id: "order1",
    orderNumber: "ZRV-12345",
    status: "delivered",
    createdAt: "2023-10-15T12:00:00Z",
    total: 114.97,
    items: [
      {
        productName: "Premium Leather Wallet",
        productImage: "/images/products/wallet.jpg",
        quantity: 1,
        price: 59.99
      },
      {
        productName: "Cotton T-Shirt - Black",
        productImage: "/images/products/tshirt.jpg",
        quantity: 2,
        price: 24.99
      }
    ]
  },
  {
    id: "order2",
    orderNumber: "ZRV-12346",
    status: "shipped",
    createdAt: "2023-10-10T09:30:00Z",
    total: 79.99,
    items: [
      {
        productName: "Running Shoes - White",
        productImage: "/images/products/shoes.jpg",
        quantity: 1,
        price: 79.99
      }
    ]
  },
  {
    id: "order3",
    orderNumber: "ZRV-12347",
    status: "processing",
    createdAt: "2023-10-18T16:45:00Z",
    total: 129.98,
    items: [
      {
        productName: "Designer Sunglasses",
        productImage: "/images/products/sunglasses.jpg",
        quantity: 1,
        price: 129.98
      }
    ]
  },
  {
    id: "order4",
    orderNumber: "ZRV-12348",
    status: "cancelled",
    createdAt: "2023-09-30T14:20:00Z",
    total: 45.50,
    items: [
      {
        productName: "Scented Candle Set",
        productImage: "/images/products/candles.jpg",
        quantity: 1,
        price: 45.50
      }
    ]
  },
  {
    id: "order5",
    orderNumber: "ZRV-12349",
    status: "returned",
    createdAt: "2023-09-25T11:10:00Z",
    total: 89.99,
    items: [
      {
        productName: "Wireless Headphones",
        productImage: "/images/products/headphones.jpg",
        quantity: 1,
        price: 89.99
      }
    ]
  }
];

export default function OrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Filter orders based on search query and filters
  const filteredOrders = mockOrders.filter(order => {
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      order.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Time filter (simplified - in a real app, use proper date comparison)
    let matchesTime = true;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    
    if (timeFilter === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      matchesTime = orderDate >= thirtyDaysAgo;
    } else if (timeFilter === 'last6months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      matchesTime = orderDate >= sixMonthsAgo;
    }
    
    return matchesSearch && matchesStatus && matchesTime;
  });
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" onClick={() => setStatusFilter('all')}>All</TabsTrigger>
          <TabsTrigger value="processing" onClick={() => setStatusFilter('processing')}>Processing</TabsTrigger>
          <TabsTrigger value="shipped" onClick={() => setStatusFilter('shipped')}>Shipped</TabsTrigger>
          <TabsTrigger value="delivered" onClick={() => setStatusFilter('delivered')}>Delivered</TabsTrigger>
          <TabsTrigger value="cancelled" onClick={() => setStatusFilter('cancelled')}>Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by order number or product..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last6months">Last 6 months</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-gray-700 mb-2">No orders found</p>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || timeFilter !== 'all' 
                ? "Try changing your search or filters"
                : "You haven't placed any orders yet"}
            </p>
            <Button onClick={() => router.push('/products')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                    <CardDescription>
                      Placed on {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center py-2 border-b last:border-0">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 mr-3">
                        {/* Placeholder for product image */}
                        <div className="w-full h-full bg-gray-200"></div>
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold">${order.total.toFixed(2)}</p>
                  </div>
                  
                  <Link href={`/customer/orders/${order.id}`} legacyBehavior>
                    <Button variant="outline" className="text-zervia-600" size="sm">
                      View Details <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 