import { getUserOrders } from '@/actions/orders';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'My Orders | Zervia',
  description: 'View and manage your orders',
};

// Define interface for order item
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

// Define interface for order
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  pickupCode?: string;
  pickupLocation?: string;
  pickupAddress?: string;
  expectedDeliveryDate?: string;
  deliveredDate?: string;
  returnEligible?: boolean;
  returnDeadline?: string;
}

export default async function CustomerOrdersPage(
  props: {
    searchParams: Promise<{ status?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const status = searchParams.status || 'all';
  const { orders = [], error } = await getUserOrders(status !== 'all' ? status : undefined);

  // Define tab options
  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Ready for Pickup' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zervia-900">My Orders</h1>
      </div>

      <Tabs defaultValue={status} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-8">
          {tabs.map((tab) => (
            <Link 
              key={tab.id} 
              href={`/customer/orders${tab.id === 'all' ? '' : `?status=${tab.id}`}`} 
              passHref
            >
              <TabsTrigger 
                value={tab.id}
                className="data-[state=active]:bg-zervia-100 data-[state=active]:text-zervia-800"
              >
                {tab.label}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>

        <TabsContent value={status} className="mt-0">
          {error ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-zervia-500">{error}</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-zervia-200 mb-3" />
                <p className="text-zervia-500">No orders found</p>
                <Link 
                  href="/products"
                  className="text-sm text-zervia-600 hover:text-zervia-700 hover:underline block mt-2"
                >
                  Start Shopping
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <Card key={order.id} className="overflow-hidden">
                  <div className="bg-zervia-50 px-6 py-4 flex justify-between items-center border-b">
                    <div>
                      <p className="font-medium text-sm text-zervia-900">Order #{order.orderNumber}</p>
                      <p className="text-xs text-zervia-500">
                        Placed {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-0">
                    <div className="px-6 py-4">
                      {/* Show first 2 items + count of remaining */}
                      <div className="space-y-3">
                        {order.items.slice(0, 2).map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-xs text-zervia-500">
                                Qty: {item.quantity} · ₦{item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {order.items.length > 2 && (
                          <p className="text-xs text-zervia-500 pl-14">
                            + {order.items.length - 2} more item(s)
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t px-6 py-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-zervia-600">Total</p>
                        <p className="text-lg font-semibold text-zervia-900">₦{order.total.toLocaleString()}</p>
                      </div>
                      <Link href={`/customer/orders/${order.id}`}>
                        <Button variant="outline" className="gap-1">
                          View Details <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 