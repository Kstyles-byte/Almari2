import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VendorAnalyticsPage() {
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

  const metrics = [
    { 
      label: 'Total Sales', 
      value: '₦175,500', 
      change: '12%', 
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    { 
      label: 'Orders', 
      value: '42', 
      change: '8%', 
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    { 
      label: 'Customers', 
      value: '28', 
      change: '5%', 
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    { 
      label: 'Conversion Rate', 
      value: '2.4%', 
      change: '0.5%', 
      trend: 'down',
      icon: TrendingDown,
      color: 'bg-red-500'
    }
  ];

  const topProducts = [
    { name: 'Wireless Earbuds', sales: 24, revenue: '₦48,000' },
    { name: 'Smart Watch X2', sales: 18, revenue: '₦36,000' },
    { name: 'Bluetooth Speaker', sales: 15, revenue: '₦30,000' },
    { name: 'USB-C Fast Charger', sales: 12, revenue: '₦24,000' },
    { name: 'Phone Case', sales: 10, revenue: '₦20,000' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div 
            key={metric.label} 
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg text-white`}>
                <metric.icon size={20} />
              </div>
              {metric.trend === 'up' ? (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <TrendingUp size={16} className="mr-1" />
                  {metric.change}
                </div>
              ) : (
                <div className="flex items-center text-red-600 text-sm font-medium">
                  <TrendingDown size={16} className="mr-1" />
                  {metric.change}
                </div>
              )}
            </div>
            <div className="text-sm font-medium text-gray-500">{metric.label}</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{metric.value}</div>
          </div>
        ))}
      </div>
      
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Sales Overview</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-zervia-100 text-zervia-600 rounded-md">Day</button>
              <button className="px-3 py-1 text-xs bg-zervia-600 text-white rounded-md">Week</button>
              <button className="px-3 py-1 text-xs bg-zervia-100 text-zervia-600 rounded-md">Month</button>
            </div>
          </div>
          <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <LineChart size={48} className="mx-auto text-gray-300" />
              <p className="mt-2">Sales chart data will be shown here</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-6">Revenue by Category</h2>
          <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <PieChart size={48} className="mx-auto text-gray-300" />
              <p className="mt-2">Category distribution will be shown here</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sales} units
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.revenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-6">Order Status Distribution</h2>
          <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto text-gray-300" />
              <p className="mt-2">Order status chart will be shown here</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-6">Sales by Time of Day</h2>
          <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto text-gray-300" />
              <p className="mt-2">Time distribution chart will be shown here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 