import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, Filter, ChevronDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Define a type for the items that will be displayed in the order card
interface OrderDisplayItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  status: string;
}

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = await cookies(); // Ensures cookies() is awaited
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  // Get vendor ID
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return <div>Error loading vendor data</div>;
  }

  // Get orders for this vendor
  const { data: orderItems, error: ordersError } = await supabase
    .from('OrderItem')
    .select(`
      id,
      order_id,
      product_id,
      quantity,
      price_at_purchase,
      status,
      created_at,
      Product:product_id(name),
      Order:order_id(
        status, 
        total_amount, 
        payment_status, 
        created_at,
        dropoff_code,
        Customer:customer_id(
          User:user_id(name, email)
        )
      )
    `)
    .eq('vendor_id', vendorData.id)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return <div>Error loading orders</div>;
  }

  // Group order items by order_id for display
  const orderMap = new Map();
  orderItems?.forEach(item => {
    if (!orderMap.has(item.order_id)) {
      orderMap.set(item.order_id, {
        orderId: item.order_id,
        orderStatus: item.Order?.[0]?.status, // Corrected access
        paymentStatus: item.Order?.[0]?.payment_status, // Corrected access
        createdAt: item.Order?.[0]?.created_at, // Corrected access
        totalAmount: item.Order?.[0]?.total_amount, // Corrected access
        dropoffCode: item.Order?.[0]?.dropoff_code,
        customerName: item.Order?.[0]?.Customer?.[0]?.User?.[0]?.name || 'Unknown', // Corrected access
        customerEmail: item.Order?.[0]?.Customer?.[0]?.User?.[0]?.email || 'Unknown', // Corrected access
        items: []
      });
    }
    
    orderMap.get(item.order_id).items.push({
      id: item.id,
      productName: item.Product?.[0]?.name || 'Unknown Product', // Corrected access
      quantity: item.quantity,
      price: item.price_at_purchase,
      status: item.status
    });
  });
  
  const orders = Array.from(orderMap.values());

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Orders</h1>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                <Filter size={16} className="mr-2 text-gray-500" />
                Filter
                <ChevronDown size={16} className="ml-2 text-gray-500" />
              </button>
            </div>
            
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                Status
                <ChevronDown size={16} className="ml-2 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Orders List */}
      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.orderId} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between">
                <div className="mb-2 sm:mb-0">
                  <div className="flex items-center">
                    <Link 
                      href={`/vendor/orders/${order.orderId}`}
                      className="text-md font-medium text-zervia-600 hover:text-zervia-900"
                    >
                      Order #{order.orderId.substring(0, 8)}
                    </Link>
                    <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.orderStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                        order.orderStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  {order.dropoffCode && (
                    <div className="text-xs text-gray-500 mt-1">Drop-off Code: <span className="font-mono">{order.dropoffCode}</span></div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Customer</div>
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Payment</div>
                    <div className={`text-sm font-medium ${
                      order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 
                      order.paymentStatus === 'FAILED' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Amount</div>
                    <div className="text-sm font-medium text-gray-900">₦{order.totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 mb-2">Items</div>
                <div className="space-y-2">
                  {order.items.map((item: OrderDisplayItem) => ( // Typed item
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <span className="ml-2 text-sm text-gray-500">×{item.quantity}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 mr-4">₦{(item.price * item.quantity).toLocaleString()}</div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                            item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-3 bg-gray-50 text-right">
                <Link
                  href={`/vendor/orders/${order.orderId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                >
                  Manage Order
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't received any orders yet.</p>
          </div>
        )}
      </div>
      
      {orders.length > 0 && (
        <div className="mt-6">
          <nav className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-md">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{orders.length}</span> of{' '}
                <span className="font-medium">{orders.length}</span> results
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <button disabled className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                Previous
              </button>
              <button disabled className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                Next
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
} 