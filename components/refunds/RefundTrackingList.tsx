'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Clock, XCircle, ChevronDown, ExternalLink, Package } from 'lucide-react';

interface RefundTrackingListProps {
  refunds: any[];
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    case 'CANCELLED':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

export function RefundTrackingList({ refunds }: RefundTrackingListProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  if (refunds.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No refund requests</h3>
        <p className="mt-2 text-muted-foreground">
          You haven't requested any refunds yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {refunds.map((refund) => (
        <Card key={refund.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(refund.status)}
                Refund #{refund.id.slice(0, 8)}
              </CardTitle>
              <Badge variant={getStatusBadgeVariant(refund.status)}>
                {refund.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Product Info */}
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h4 className="font-medium">
                  {refund.orderItem?.product?.name || 'Product'}
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Quantity: {refund.orderItem?.quantity || 1}</p>
                  <p>Amount: {formatCurrency(refund.refund_amount)}</p>
                  <p>Vendor: {refund.vendor?.storeName || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-l-2 border-muted pl-4 ml-2 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Refund requested</span>
                <span className="text-muted-foreground">
                  {new Date(refund.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {refund.status !== 'PENDING' && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    refund.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>
                    {refund.status === 'APPROVED' ? 'Approved by vendor' : 'Rejected by vendor'}
                  </span>
                  {refund.return?.vendor_decision_date && (
                    <span className="text-muted-foreground">
                      {new Date(refund.return.vendor_decision_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {refund.status === 'APPROVED' && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  <span>Refund processing</span>
                  <span className="text-muted-foreground">3-5 business days</span>
                </div>
              )}
            </div>

            {/* Details */}
            <Collapsible open={openItems.includes(refund.id)}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleItem(refund.id)}
                  className="w-full justify-between"
                >
                  <span>View Details</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    openItems.includes(refund.id) ? 'rotate-180' : ''
                  }`} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Reason:</span>
                    <p className="text-muted-foreground">{refund.reason}</p>
                  </div>
                  <div>
                    <span className="font-medium">Order ID:</span>
                    <p className="text-muted-foreground">
                      {refund.order?.id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                
                {refund.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span>
                    <p className="text-muted-foreground">{refund.description}</p>
                  </div>
                )}
                
                {refund.vendor_response && (
                  <div className="text-sm">
                    <span className="font-medium">Vendor Response:</span>
                    <p className="text-muted-foreground">{refund.vendor_response}</p>
                  </div>
                )}
                
                {refund.admin_notes && (
                  <div className="text-sm">
                    <span className="font-medium">Admin Notes:</span>
                    <p className="text-muted-foreground">{refund.admin_notes}</p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Link
                    href={`/dashboard/orders/${refund.order?.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Order
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
