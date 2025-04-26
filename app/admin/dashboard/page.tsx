import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Dashboard stats component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue 
}: { 
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zervia-600">{title}</p>
            <h3 className="mt-1 text-2xl font-bold">{value}</h3>
            <div className="mt-1 flex items-center">
              {trend === 'up' && (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              )}
              {trend === 'down' && (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {trendValue}
              </span>
            </div>
          </div>
          <div className="rounded-full bg-zervia-50 p-3">
            <Icon className="h-6 w-6 text-zervia-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Order status badge component
function OrderStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  
  const status_key = status.toLowerCase() as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

// User type badge component
function UserTypeBadge({ type }: { type: string }) {
  const typeStyles = {
    admin: 'bg-purple-100 text-purple-800',
    vendor: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    agent: 'bg-yellow-100 text-yellow-800',
  };
  
  const type_key = type.toLowerCase() as keyof typeof typeStyles;
  const style = typeStyles[type_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {type}
    </span>
  );
}

// Mock data for dashboard stats
const mockUserCount = 1250;
const mockOrderCount = 320;
const mockRevenue = 45250.75;
const mockProductCount = 180;

// Mock data for recent orders
const mockRecentOrders = [
  { id: 'ord-00123', user: { name: 'John Doe' }, totalAmount: 129.99, status: 'COMPLETED' },
  { id: 'ord-00124', user: { name: 'Jane Smith' }, totalAmount: 89.50, status: 'PROCESSING' },
  { id: 'ord-00125', user: { name: 'Mike Johnson' }, totalAmount: 249.99, status: 'PENDING' },
  { id: 'ord-00126', user: { name: 'Sarah Williams' }, totalAmount: 59.99, status: 'COMPLETED' },
  { id: 'ord-00127', user: { name: 'Alex Brown' }, totalAmount: 179.00, status: 'CANCELLED' },
];

// Mock data for new users
const mockNewUsers = [
  { id: 'usr-001', name: 'Emily Davis', email: 'emily.davis@example.com', image: '/images/placeholder.jpg', role: 'CUSTOMER', createdAt: new Date() },
  { id: 'usr-002', name: 'Tom Wilson', email: 'tom.wilson@example.com', image: '/images/placeholder.jpg', role: 'VENDOR', createdAt: new Date() },
  { id: 'usr-003', name: 'Lisa Anderson', email: 'lisa.anderson@example.com', image: '/images/placeholder.jpg', role: 'CUSTOMER', createdAt: new Date() },
  { id: 'usr-004', name: 'Mark Taylor', email: 'mark.taylor@example.com', image: '/images/placeholder.jpg', role: 'AGENT', createdAt: new Date() },
  { id: 'usr-005', name: 'Anna Martinez', email: 'anna.martinez@example.com', image: '/images/placeholder.jpg', role: 'ADMIN', createdAt: new Date() },
];

// Mock formatCurrency function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default async function AdminDashboardPage() {
  // Using mock data instead of database calls
  const userCount = mockUserCount;
  const orderCount = mockOrderCount;
  const revenue = mockRevenue;
  const productCount = mockProductCount;
  const recentOrders = mockRecentOrders;
  const newUsers = mockNewUsers;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={userCount} 
          icon={Users}
          trend="up"
          trendValue="+12.5% from last month"
        />
        <StatCard 
          title="Total Orders" 
          value={orderCount} 
          icon={ShoppingCart}
          trend="up"
          trendValue="+8.2% from last month"
        />
        <StatCard 
          title="Revenue" 
          value={formatCurrency(revenue)} 
          icon={TrendingUp}
          trend="down"
          trendValue="-3.1% from last month"
        />
        <StatCard 
          title="Products" 
          value={productCount} 
          icon={Package}
          trend="up"
          trendValue="+4.7% from last month"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <a href="/admin/orders" className="text-sm text-zervia-600 hover:text-zervia-900">View all</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order: { id: string; user: { name: string }; totalAmount: number; status: string }) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="font-medium">#{order.id.substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Unknown'} • {formatCurrency(order.totalAmount)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              ))}
              
              {recentOrders.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-gray-500">No orders yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* New Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>New Users</CardTitle>
            <a href="/admin/users" className="text-sm text-zervia-600 hover:text-zervia-900">View all</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {newUsers.map((user: { id: string; name: string; email: string; image: string; role: string }) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-zervia-300"></div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <UserTypeBadge type={user.role} />
                </div>
              ))}
              
              {newUsers.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-gray-500">No new users</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 