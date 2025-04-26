"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, PackageCheck, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  completedDate?: string;
  status: 'completed' | 'rejected' | 'cancelled';
  items: ReturnItem[];
  refundAmount?: number;
  refundStatus?: 'processed' | 'failed';
  rejectionReason?: string;
}

// Mock return request data
const completedReturns: ReturnRequest[] = [
  {
    id: 'rtn-004',
    orderNumber: 'ZRV-87654',
    orderDate: '2023-07-10T09:00:00Z',
    requestDate: '2023-07-15T13:45:00Z',
    completedDate: '2023-07-22T11:15:00Z',
    status: 'completed',
    items: [
      {
        id: 'ri-004',
        productId: 'prod8',
        productName: 'Vintage Leather Backpack',
        productImage: '/images/products/backpack.jpg',
        quantity: 1,
        reason: 'Defective item'
      }
    ],
    refundAmount: 89.99,
    refundStatus: 'processed'
  },
  {
    id: 'rtn-005',
    orderNumber: 'ZRV-98765',
    orderDate: '2023-06-05T08:15:00Z',
    requestDate: '2023-06-10T10:00:00Z',
    completedDate: '2023-06-18T16:30:00Z',
    status: 'completed',
    items: [
      {
        id: 'ri-005',
        productId: 'prod9',
        productName: 'Cashmere Sweater - Gray',
        productImage: '/images/products/sweater.jpg',
        quantity: 1,
        reason: 'Wrong size'
      }
    ],
    refundAmount: 129.99,
    refundStatus: 'processed'
  },
  {
    id: 'rtn-003',
    orderNumber: 'ZRV-76543',
    orderDate: '2023-08-20T10:30:00Z',
    requestDate: '2023-08-25T11:15:00Z',
    completedDate: '2023-08-26T14:20:00Z',
    status: 'rejected',
    items: [
      {
        id: 'ri-003',
        productId: 'prod5',
        productName: 'Wireless Headphones',
        productImage: '/images/products/headphones.jpg',
        quantity: 1,
        reason: 'Changed my mind'
      }
    ],
    rejectionReason: 'Return policy does not cover change of mind after 14 days of purchase'
  },
  {
    id: 'rtn-006',
    orderNumber: 'ZRV-12345',
    orderDate: '2023-05-01T09:00:00Z',
    requestDate: '2023-05-10T16:20:00Z',
    completedDate: '2023-05-12T14:10:00Z',
    status: 'cancelled',
    items: [
      {
        id: 'ri-006',
        productId: 'prod10',
        productName: 'Designer Sunglasses',
        productImage: '/images/products/sunglasses.jpg',
        quantity: 1,
        reason: 'Found better price elsewhere'
      }
    ]
  }
];

const statusConfig: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: <PackageCheck className="h-4 w-4" />
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: <X className="h-4 w-4" />
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800',
    icon: <X className="h-4 w-4" />
  }
};

const refundStatusColors: Record<string, string> = {
  processed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export default function ReturnHistoryPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('newest');

  // Filter and sort returns
  const filteredReturns = React.useMemo(() => {
    let filtered = [...completedReturns];
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(ret => 
        ret.orderNumber.toLowerCase().includes(searchLower) ||
        ret.id.toLowerCase().includes(searchLower) ||
        ret.items.some(item => item.productName.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ret => ret.status === filterStatus);
    }
    
    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.completedDate || b.requestDate).getTime() - new Date(a.completedDate || a.requestDate).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.completedDate || a.requestDate).getTime() - new Date(b.completedDate || b.requestDate).getTime());
    } else if (sortBy === 'highValue') {
      filtered.sort((a, b) => (b.refundAmount || 0) - (a.refundAmount || 0));
    } else if (sortBy === 'lowValue') {
      filtered.sort((a, b) => (a.refundAmount || 0) - (b.refundAmount || 0));
    }
    
    return filtered;
  }, [search, filterStatus, sortBy]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Link href="/customer/returns" className="inline-flex items-center text-zervia-600 hover:text-zervia-700 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Return History</h1>
        <p className="text-zervia-500">View the status and details of your past returns</p>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zervia-400 h-4 w-4" />
          <Input
            placeholder="Search by order or product"
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highValue">Highest Value</SelectItem>
              <SelectItem value="lowValue">Lowest Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Returns List */}
      <div className="space-y-4">
        {filteredReturns.length > 0 ? (
          filteredReturns.map((returnRequest) => (
            <Card key={returnRequest.id} className="overflow-hidden">
              <div className="border-l-4 h-full" style={{ 
                borderColor: returnRequest.status === 'completed' 
                  ? '#10b981' 
                  : returnRequest.status === 'rejected' 
                    ? '#ef4444' 
                    : '#9ca3af' 
              }}>
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">Return #{returnRequest.id}</h3>
                          <Badge className={statusConfig[returnRequest.status].color}>
                            <span className="flex items-center">
                              {statusConfig[returnRequest.status].icon}
                              <span className="ml-1">{statusConfig[returnRequest.status].label}</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-zervia-500 mt-1">
                          {returnRequest.completedDate 
                            ? `Completed on ${format(new Date(returnRequest.completedDate), 'MMM d, yyyy')}`
                            : `Requested on ${format(new Date(returnRequest.requestDate), 'MMM d, yyyy')}`
                          }
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
                    
                    {/* Status specific information */}
                    {returnRequest.status === 'completed' && returnRequest.refundAmount && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Refund Amount:</span>
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
                    
                    {returnRequest.status === 'rejected' && returnRequest.rejectionReason && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium">Rejection Reason:</span>
                            <p className="text-sm text-zervia-600 mt-1">{returnRequest.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {returnRequest.status === 'cancelled' && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start">
                          <X className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium">Return Request Cancelled</span>
                            <p className="text-sm text-zervia-500 mt-1">This return request was cancelled.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-10">
            <CardContent className="flex flex-col items-center justify-center text-center p-4">
              <div className="bg-zervia-50 p-3 rounded-full mb-4">
                <PackageCheck className="h-6 w-6 text-zervia-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Returns Found</h3>
              <p className="text-zervia-500 max-w-md mb-6">
                {search || filterStatus !== 'all' 
                  ? "No returns match your search or filter criteria. Try adjusting your filters."
                  : "You don't have any completed, rejected, or cancelled returns yet."
                }
              </p>
              {search || filterStatus !== 'all' ? (
                <Button variant="outline" onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                }}>
                  Clear Filters
                </Button>
              ) : (
                <Link href="/customer/returns">
                  <Button className="bg-zervia-600 hover:bg-zervia-700">
                    Return to Dashboard
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 