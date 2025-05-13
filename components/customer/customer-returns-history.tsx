'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface ReturnItem {
  id: string;
  orderId: string;
  orderDate: string;
  productName: string;
  productImage: string;
  status: string;
  requestDate: string;
  refundAmount: string;
  refundStatus: string;
  reason: string;
  processDate?: string;
}

interface CustomerReturnsHistoryProps {
  returns: ReturnItem[];
}

// Return status badge mapping
const returnStatusConfig: Record<string, { color: string; label: string }> = {
  REQUESTED: { color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'Requested' },
  APPROVED: { color: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Approved' },
  REJECTED: { color: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Rejected' },
  COMPLETED: { color: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Completed' },
};

// Refund status badge mapping
const refundStatusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'Pending' },
  PROCESSED: { color: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Processed' },
  REJECTED: { color: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Rejected' },
};

export default function CustomerReturnsHistory({ returns }: CustomerReturnsHistoryProps) {
  // State for accordion item open/close status
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleAccordionChange = (value: string[]) => {
    setOpenItems(value);
  };

  return (
    <div className="space-y-4">
      {returns.map((returnItem) => (
        <Card key={returnItem.id} className="overflow-hidden">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Return for Order #{returnItem.orderId.substring(0, 8)}...
                </CardTitle>
                <CardDescription>
                  Requested on {returnItem.requestDate}
                </CardDescription>
              </div>
              <Badge 
                className={returnStatusConfig[returnItem.status]?.color || 'bg-gray-100 text-gray-800'}
                variant="outline"
              >
                {returnStatusConfig[returnItem.status]?.label || returnItem.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                <Image
                  src={returnItem.productImage}
                  alt={returnItem.productName}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {returnItem.productName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Order Date: {returnItem.orderDate}
                </p>
                <p className="text-sm font-medium text-zervia-700">
                  Refund: {returnItem.refundAmount} • 
                  <Badge 
                    className={`ml-2 ${refundStatusConfig[returnItem.refundStatus]?.color || 'bg-gray-100 text-gray-800'}`}
                    variant="outline"
                  >
                    {refundStatusConfig[returnItem.refundStatus]?.label || returnItem.refundStatus}
                  </Badge>
                </p>
              </div>
            </div>
            
            <Accordion 
              type="multiple" 
              value={openItems}
              onValueChange={(value) => handleAccordionChange(value)}
              className="mt-3"
            >
              <AccordionItem value={returnItem.id} className="border-b-0">
                <AccordionTrigger className="py-2 text-sm">
                  Return Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4 font-medium">Reason for Return:</div>
                      <div className="col-span-8">{returnItem.reason}</div>
                    </div>
                    
                    {returnItem.processDate && (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4 font-medium">Processed Date:</div>
                        <div className="col-span-8">{returnItem.processDate}</div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4 font-medium">Status:</div>
                      <div className="col-span-8">
                        {returnStatusConfig[returnItem.status]?.label || returnItem.status}
                        {returnItem.status === 'REQUESTED' && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Awaiting vendor approval)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4 font-medium">Refund Status:</div>
                      <div className="col-span-8">
                        {refundStatusConfig[returnItem.refundStatus]?.label || returnItem.refundStatus}
                        {returnItem.refundStatus === 'PENDING' && returnItem.status === 'APPROVED' && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Processing refund)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          
          <CardFooter className="border-t bg-muted/20 px-6 py-3">
            <div className="flex justify-between w-full text-sm">
              <Link 
                href={`/customer/orders/${returnItem.orderId}`} 
                className="text-zervia-600 hover:text-zervia-700 font-medium flex items-center"
              >
                <Icons.externalLink className="mr-1 h-3 w-3" />
                View Order
              </Link>
              
              {returnItem.status === 'REQUESTED' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 bg-white border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 