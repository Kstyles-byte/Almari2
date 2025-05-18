import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { BarChart3, BoxIcon, DollarSign, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
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
    return <div>Error loading vendor data</div>;
  }

  // Get stats
  const { data: products } = await supabase
    .from('Product')
    .select('id')
    .eq('vendor_id', vendorData.id);

  const { data: pendingOrders } = await supabase
    .from('OrderItem')
    .select('id')
    .eq('vendor_id', vendorData.id)
    .eq('status', 'PENDING');

  const { data: recentOrders } = await supabase
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
      Order:order_id(customer_id, created_at)
    `)
    .eq('vendor_id', vendorData.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate revenue from orders (simplified version)
  const { data: revenue } = await supabase
    .from('OrderItem')
    .select('price_at_purchase, quantity')
    .eq('vendor_id', vendorData.id)
    .not('status', 'eq', 'CANCELLED');

  const totalRevenue = revenue?.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0) || 0;

  const stats = [
    { name: 'Total Products', value: products?.length || 0, icon: ShoppingBag, color: 'bg-blue-500' },
    { name: 'Pending Orders', value: pendingOrders?.length || 0, icon: Package, color: 'bg-yellow-500' },
    { name: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
    { name: 'Sales Growth', value: '↑ 12%', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <Link 
          href="/vendor/products/new" 
          className="bg-zervia-600 text-white px-4 py-2 rounded-md hover:bg-zervia-700 flex items-center text-sm justify-center sm:justify-start"
        >
          <span className="mr-2">+</span>
          Add New Product
        </Link>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 flex items-center"
          >
            <div className={`${stat.color} p-3 rounded-lg text-white mr-4 flex-shrink-0`}>
              <stat.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/vendor/orders" className="text-sm text-zervia-600 hover:text-zervia-700">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-zervia-600">
                      <Link href={`/vendor/orders/${order.order_id}`}>
                        #{order.order_id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {order.Product?.[0]?.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ₦{(order.price_at_purchase * order.quantity).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-zervia-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
            <ShoppingBag className="text-zervia-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Manage Products</h3>
          <p className="text-sm text-gray-500 mb-4">Add, edit or delete your products and manage inventory.</p>
          <Link 
            href="/vendor/products" 
            className="block text-center text-sm bg-white border border-zervia-600 text-zervia-600 px-4 py-2 rounded-md hover:bg-zervia-50"
          >
            View Products
          </Link>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-zervia-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
            <BoxIcon className="text-zervia-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Process Orders</h3>
          <p className="text-sm text-gray-500 mb-4">View and manage customer orders and update their status.</p>
          <Link 
            href="/vendor/orders" 
            className="block text-center text-sm bg-white border border-zervia-600 text-zervia-600 px-4 py-2 rounded-md hover:bg-zervia-50"
          >
            View Orders
          </Link>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-zervia-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
            <BarChart3 className="text-zervia-600" size={20} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">View Analytics</h3>
          <p className="text-sm text-gray-500 mb-4">Track your sales performance and customer insights.</p>
          <Link 
            href="/vendor/analytics" 
            className="block text-center text-sm bg-white border border-zervia-600 text-zervia-600 px-4 py-2 rounded-md hover:bg-zervia-50"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
} 