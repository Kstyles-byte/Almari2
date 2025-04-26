import React from 'react';
import Link from 'next/link';
import { Users, ShoppingCart, TrendingUp, Package, ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Admin Dashboard | Zervia',
  description: 'Manage your Zervia multi-vendor e-commerce platform',
};

export default function AdminDashboard() {
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
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Total Orders</p>
                <p className="text-2xl font-bold">856</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Revenue</p>
                <p className="text-2xl font-bold">$45,678</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-zervia-500" />
              <div>
                <p className="text-sm text-zervia-600">Products</p>
                <p className="text-2xl font-bold">432</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 col-span-2">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-4">
              {/* Mock recent orders */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">#ORD-2024-001</p>
                  <p className="text-sm text-zervia-600">John Doe • $129.99</p>
                </div>
                <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">#ORD-2024-002</p>
                  <p className="text-sm text-zervia-600">Jane Smith • $89.99</p>
                </div>
                <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>
            </div>
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
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 