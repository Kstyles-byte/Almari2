import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { BarChart3, BoxIcon, DollarSign, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import RecentOrdersWidget from '@/components/vendor/RecentOrdersWidget';

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

  // Use service-role key to bypass RLS for vendor's own aggregated stats
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // We are only reading with the service role so cookie helpers can be no-ops
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  );

  // Get stats (service role ensures visibility even if RLS policies change)
  const { data: products } = await supabaseAdmin
    .from('Product')
    .select('id')
    .eq('vendor_id', vendorData.id);

  const { data: pendingOrders } = await supabaseAdmin
    .from('OrderItem')
    .select('id')
    .eq('vendor_id', vendorData.id)
    .eq('status', 'PENDING');

  // Calculate revenue from orders (simplified version)
  const { data: revenue } = await supabaseAdmin
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
      <RecentOrdersWidget />
      
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