import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ChevronLeft, Package, Clock, CheckCircle, XCircle, TruckIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import OrderStatusActions from '@/components/vendor/order-status-actions';
import MarkReadyButtonWrapper from '@/components/vendor/MarkReadyButtonWrapper';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
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
    console.error('Error loading vendor data:', vendorError);
    return <div>Error loading vendor data</div>;
  }

  // Use service role client to bypass RLS recursion issues on Order table policies.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('OrderItem')
    .select(`
      id,
      product_id,
      price_at_purchase,
      quantity,
      status,
      created_at,
      updated_at,
      Product:product_id(
        name,
        slug,
        ProductImage(url)
      ),
      Order:order_id(
        id,
        created_at,
        status,
        payment_status,
        total_amount,
        ShippingAddress:shipping_address_id(
          address_line1,
          address_line2,
          city,
          state_province,
          postal_code,
          country,
          phone_number
        ),
        BillingAddress:billing_address_id(
          address_line1,
          address_line2,
          city,
          state_province,
          postal_code,
          country,
          phone_number
        ),
        Customer:customer_id(
          phone_number,
          User:user_id(
            name,
            email
          )
        ),
        dropoff_code
      )
    `)
    .eq('order_id', id)
    .eq('vendor_id', vendorData.id);

  if (orderItemsError || !orderItems || orderItems.length === 0) {
    console.error('Error fetching order items:', orderItemsError);
    return notFound();
  }

  // Get order information from the first item
  const orderData = Array.isArray(orderItems[0].Order) ? orderItems[0].Order[0] : orderItems[0].Order;
  if (!orderData) return notFound();

  // Calculate subtotal for this vendor's items
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.price_at_purchase * item.quantity);
  }, 0);

  let customer: { name: any; email: any; phone: any; } | null | undefined = null;
  const customerFromOrder = Array.isArray(orderData.Customer) ? orderData.Customer[0] : orderData.Customer;
  if (customerFromOrder) {
    const userFromCustomer = Array.isArray(customerFromOrder.User) ? customerFromOrder.User[0] : customerFromOrder.User;
    customer = {
      name: userFromCustomer?.name,
      email: userFromCustomer?.email,
      phone: customerFromOrder?.phone_number ?? null,
    };
  }

  // Determine if all items have the same status
  const allItemsHaveSameStatus = orderItems.every(item => item.status === orderItems[0].status);
  const commonStatus = allItemsHaveSameStatus ? orderItems[0].status : 'MIXED';

  // Format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to format address
  const formatAddress = (address: any) => {
    if (!address) return 'No address provided';
    const street = address.street || address.address_line1 || '';
    const state = address.state || address.state_province || '';
    return `${street}, ${address.city || ''}, ${state} ${address.postal_code || ''}, ${address.country || ''}`.replace(/ , |, $/g, '');
  };

  // Function to get status icon
  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'PROCESSING':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'SHIPPED':
        return <TruckIcon className="w-5 h-5 text-purple-500" />;
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link 
          href="/vendor/orders" 
          className="text-zervia-600 hover:text-zervia-700 flex items-center mr-4"
        >
          <ChevronLeft size={20} />
          <span>Back to Orders</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
      </div>

      {/* Order header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <div className="flex items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-900">Order #{orderData.id?.substring(0, 8)}</h2>
                {commonStatus !== 'MIXED' && (
                  <span className={`ml-3 px-3 py-1 inline-flex text-sm font-medium rounded-full items-center ${
                    commonStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    commonStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : 
                    commonStatus === 'SHIPPED' ? 'bg-purple-100 text-purple-800' : 
                    commonStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                    commonStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusIcon(commonStatus)}
                    <span className="ml-1">{commonStatus}</span>
                  </span>
                )}

                {/* Show mark ready button for vendor if order dropped off */}
                {orderData.status === 'DROPPED_OFF' && (
                  <div className="ml-4">
                    <MarkReadyButtonWrapper orderId={orderData.id} />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">Placed on {formatDate(orderData.created_at)}</p>
              {orderData.dropoff_code && (
                <p className="text-xs text-gray-500 mt-1">Drop-off Code: <span className="font-mono">{orderData.dropoff_code}</span></p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-sm text-gray-500">Payment Status</div>
              <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${getPaymentStatusColor(orderData.payment_status)}`}>
                {orderData.payment_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order content in a two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items & status management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Order Items</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {orderItems.map((item) => {
                const productData = Array.isArray(item.Product) ? item.Product[0] : item.Product;
                const productImage = productData?.ProductImage && Array.isArray(productData.ProductImage) && productData.ProductImage.length > 0 ? productData.ProductImage[0] : null;

                return (
                <div key={item.id} className="p-6">
                  <div className="flex flex-col sm:flex-row">
                    {/* Product image and details */}
                    <div className="flex-grow flex">
                      <div className="flex-shrink-0 h-24 w-24 bg-gray-100 rounded-md overflow-hidden relative">
                        {productImage ? (
                          <img 
                            src={productImage.url} 
                            alt={productData?.name || 'Product'} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gray-200">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">{productData?.name || 'Product'}</h4>
                        <div className="mt-1 flex text-sm">
                          <p className="text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900">₦{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                        <p className="mt-1 text-xs text-gray-500">Unit price: ₦{item.price_at_purchase.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* Item status and actions */}
                    <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col items-end justify-between">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        item.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : 
                        item.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' : 
                        item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                        item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                      
                      <OrderStatusActions 
                        orderItemId={item.id}
                        currentStatus={item.status}
                      />
                    </div>
                  </div>
                </div>
              )} )}
            </div>
            
            {/* Order summary */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900">Subtotal</span>
                <span className="font-medium text-gray-900">₦{subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Delivery Information</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Delivery Method</h4>
                <p className="text-sm text-gray-600">{'Standard Delivery'}</p>
              </div>
              {orderData.ShippingAddress && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Shipping Address</h4>
                  <p className="text-sm text-gray-600">{formatAddress(Array.isArray(orderData.ShippingAddress) ? orderData.ShippingAddress[0] : orderData.ShippingAddress)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Customer & Order Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Customer Information</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Contact Information</h4>
                <p className="text-sm text-gray-600">{customer?.name || 'Customer'}</p>
                <p className="text-sm text-gray-600">{customer?.email || 'No email provided'}</p>
                <p className="text-sm text-gray-600">{customer?.phone || 'No phone provided'}</p>
              </div>
              {orderData.BillingAddress && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Billing Address</h4>
                  <p className="text-sm text-gray-600">{formatAddress(Array.isArray(orderData.BillingAddress) ? orderData.BillingAddress[0] : orderData.BillingAddress)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Order timeline/history */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Order Notes</h3>
            </div>
            <div className="p-6">
              <textarea 
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                rows={4}
                placeholder="Add a note about this order (only visible to you)"
              ></textarea>
              <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500">
                Save Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 