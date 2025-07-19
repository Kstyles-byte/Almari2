import React from 'react';
import Link from 'next/link';
import { Users, ShoppingCart, TrendingUp, Package, ImageIcon, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/actions/admin-dashboard';
import { getOrders } from '@/actions/admin-orders';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Dashboard | Zervia',
  description: 'Manage your Zervia multi-vendor e-commerce platform',
};

export default async function AdminDashboard() {
  const statsResult = await getDashboardStats();

  if (!statsResult.success) {
    console.error('Failed to fetch dashboard stats', statsResult.error);
    redirect('/error?message=Failed to fetch dashboard statistics');
  }

  const { userCount, orderCount, productCount, totalRevenue } = statsResult.data;

  // Fetch the five most recent orders
  const ordersRes = await getOrders({ limit: 5 });
  const recentOrders = ordersRes.success ? ordersRes.orders : [];

  return (
    <AdminLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Total Users</p>
                <p className="text-2xl font-bold">{userCount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Completed Orders</p>
                <p className="text-2xl font-bold">{orderCount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Revenue</p>
                <p className="text-2xl font-bold">₦{(totalRevenue / 100).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Products</p>
                <p className="text-2xl font-bold">{productCount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 col-span-2">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">#{order.id.substring(0, 8)}</p>
                      <p className="text-sm text-zervia-600">₦{Number(order.total_amount).toLocaleString()}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        order.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent orders found.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Content Management</h2>
            </div>
            <div className="space-y-4">
              <Link href="/admin/content/hero-banners">
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span className="flex items-center">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Hero Banners
                  </span>
                  <span className="text-xs bg-zervia-100 text-zervia-700 px-2 py-1 rounded-full">3 Active</span>
                </Button>
              </Link>
              
              <Link href="/admin/content/categories">
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Categories
                  </span>
                  <span className="text-xs bg-zervia-100 text-zervia-700 px-2 py-1 rounded-full">5 Active</span>
                </Button>
              </Link>

              {/* Coupons Link */}
              <Link href="/admin/coupons">
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span className="flex items-center">
                    <Percent className="mr-2 h-4 w-4" />
                    Coupons
                  </span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 