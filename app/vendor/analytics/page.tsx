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

  // Get vendor ID for current user
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return <div>Error loading vendor data</div>;
  }

  // Use service-role key for unrestricted reads (aggregations)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  );

  // Define periods for growth comparison (last 30 days vs previous 30 days)
  const now = new Date();
  const startCurrent = new Date();
  startCurrent.setDate(now.getDate() - 30);
  const startPrev = new Date();
  startPrev.setDate(now.getDate() - 60);

  // Fetch order items for the last 60 days (for revenue + product breakdown)
  const { data: orderItemsLast60 } = await supabaseAdmin
    .from('OrderItem')
    .select('order_id, price_at_purchase, quantity, created_at, product_id, Product:product_id(name), status')
    .eq('vendor_id', vendorData.id)
    .not('status', 'eq', 'CANCELLED')
    .gte('created_at', startPrev.toISOString());

  // We only need the last 60 days for analytics below; no need to fetch all historical rows here

  // Fetch corresponding orders to determine customers & status
  const orderIdsLast60 = Array.from(new Set((orderItemsLast60 || []).map((i: any) => i.order_id)));
  const { data: ordersLast60 } = orderIdsLast60.length
    ? await supabaseAdmin
        .from('Order')
        .select('id, customer_id, created_at, status')
        .in('id', orderIdsLast60)
    : { data: [] as any[] } as any;

  // Helper to split current vs previous period
  const splitByPeriod = <T extends { created_at: string }>(rows: T[]) => {
    const current: T[] = [];
    const prev: T[] = [];
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      if (d >= startCurrent) current.push(r);
      else prev.push(r);
    });
    return { current, prev };
  };

  // Revenue calculations
  const { current: orderCurr, prev: orderPrev } = splitByPeriod(orderItemsLast60 || []);

  const sumRevenue = (items: any[]) => items.reduce((acc, i) => acc + i.price_at_purchase * i.quantity, 0);
  const revenueCurrent = sumRevenue(orderCurr);
  const revenuePrev = sumRevenue(orderPrev);

  const revenueChange = revenuePrev === 0 ? 0 : ((revenueCurrent - revenuePrev) / revenuePrev) * 100;

  // Orders metric
  const ordersSplit = splitByPeriod((ordersLast60 || []) as any[]);
  const ordersCurrentCount = ordersSplit.current.length;
  const ordersPrevCount = ordersSplit.prev.length;
  const ordersChange = ordersPrevCount === 0 ? 0 : ((ordersCurrentCount - ordersPrevCount) / ordersPrevCount) * 100;

  // Customers metric (unique customer_id)
  const uniqueCustomers = (orders: any[]) => new Set(orders.map((o) => o.customer_id)).size;
  const customersCurrent = uniqueCustomers(ordersSplit.current);
  const customersPrev = uniqueCustomers(ordersSplit.prev);
  const customersChange = customersPrev === 0 ? 0 : ((customersCurrent - customersPrev) / customersPrev) * 100;

  // Conversion rate (completed / total), based on current period
  const completedStatuses = ['DELIVERED', 'COMPLETED'];
  const convCurrentOrders = ordersSplit.current;
  const convPrevOrders = ordersSplit.prev;
  const convRateCurr = convCurrentOrders.length === 0 ? 0 : (convCurrentOrders.filter((o) => completedStatuses.includes(o.status)).length / convCurrentOrders.length) * 100;
  const convRatePrev = convPrevOrders.length === 0 ? 0 : (convPrevOrders.filter((o) => completedStatuses.includes(o.status)).length / convPrevOrders.length) * 100;
  const convChange = convRatePrev === 0 ? 0 : ((convRateCurr - convRatePrev) / convRatePrev) * 100;

  const trend = (val: number) => (val >= 0 ? 'up' : 'down');

  const metrics = [
    {
      label: 'Total Sales',
      value: `₦${revenueCurrent.toLocaleString()}`,
      change: `${Math.abs(revenueChange).toFixed(1)}%`,
      trend: trend(revenueChange),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Orders',
      value: ordersCurrentCount.toString(),
      change: `${Math.abs(ordersChange).toFixed(1)}%`,
      trend: trend(ordersChange),
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      label: 'Customers',
      value: customersCurrent.toString(),
      change: `${Math.abs(customersChange).toFixed(1)}%`,
      trend: trend(customersChange),
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      label: 'Conversion Rate',
      value: `${convRateCurr.toFixed(1)}%`,
      change: `${Math.abs(convChange).toFixed(1)}%`,
      trend: trend(convChange),
      icon: convChange >= 0 ? TrendingUp : TrendingDown,
      color: convChange >= 0 ? 'bg-green-500' : 'bg-red-500',
    },
  ];

  // Top products (current 30 days)
  const productMap: Record<string, { name: string; sales: number; revenue: number }> = {};
  orderCurr.forEach((item: any) => {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = { name: item.Product?.name || 'Product', sales: 0, revenue: 0 };
    }
    productMap[item.product_id].sales += item.quantity;
    productMap[item.product_id].revenue += item.price_at_purchase * item.quantity;
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map((p) => ({ ...p, revenueFormatted: `₦${p.revenue.toLocaleString()}` }));

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
                    {product.revenueFormatted}
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