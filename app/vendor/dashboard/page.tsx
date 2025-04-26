'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  ArrowUpRight, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight, 
  ChevronUp,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function VendorDashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zervia-900">Vendor Dashboard</h1>
          <p className="text-zervia-500">Welcome back, Emporium Elegance</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            href="/vendor/products/new" 
            className="inline-flex items-center px-4 py-2 bg-zervia-600 text-white rounded-md hover:bg-zervia-700"
          >
            <Plus size={18} className="mr-1" /> Add New Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <Card className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-zervia-500">Total Orders</p>
              <h3 className="text-3xl font-bold text-zervia-900 mt-1">256</h3>
            </div>
            <div className="p-3 bg-zervia-100 rounded-full text-zervia-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="flex items-center text-green-600">
              <ChevronUp size={14} className="mr-1" />
              16%
            </span>
            <span className="text-zervia-500 ml-2">from last month</span>
          </div>
        </Card>
        
        {/* Pending Orders */}
        <Card className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-zervia-500">Pending Orders</p>
              <h3 className="text-3xl font-bold text-zervia-900 mt-1">24</h3>
            </div>
            <div className="p-3 bg-zervia-100 rounded-full text-zervia-600">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="flex items-center text-green-600">
              <ChevronUp size={14} className="mr-1" />
              8%
            </span>
            <span className="text-zervia-500 ml-2">from last week</span>
          </div>
        </Card>
        
        {/* Low Stock Items */}
        <Card className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-zervia-500">Low Stock Items</p>
              <h3 className="text-3xl font-bold text-zervia-900 mt-1">12</h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="flex items-center text-red-600">
              <ChevronUp size={14} className="mr-1" />
              5
            </span>
            <span className="text-zervia-500 ml-2">more than last week</span>
          </div>
        </Card>
        
        {/* Revenue */}
        <Card className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-zervia-500">Revenue</p>
              <h3 className="text-3xl font-bold text-zervia-900 mt-1">$12,568</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="flex items-center text-green-600">
              <ChevronUp size={14} className="mr-1" />
              23%
            </span>
            <span className="text-zervia-500 ml-2">from last month</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-zervia-900">Recent Orders</h2>
              <Link href="/vendor/orders" className="text-sm text-zervia-500 hover:text-zervia-600 flex items-center">
                View All <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zervia-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-zervia-50 text-left text-xs font-medium text-zervia-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 bg-zervia-50 text-left text-xs font-medium text-zervia-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 bg-zervia-50 text-left text-xs font-medium text-zervia-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 bg-zervia-50 text-left text-xs font-medium text-zervia-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 bg-zervia-50 text-left text-xs font-medium text-zervia-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 bg-zervia-50 text-right text-xs font-medium text-zervia-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zervia-200">
                  {[
                    {id: "ORD-12345", customer: "John Smith", date: "Apr 23, 2023", status: "Processing", amount: 189.99},
                    {id: "ORD-12344", customer: "Emily Johnson", date: "Apr 22, 2023", status: "Shipped", amount: 49.99},
                    {id: "ORD-12343", customer: "Michael Williams", date: "Apr 22, 2023", status: "Delivered", amount: 129.98},
                    {id: "ORD-12342", customer: "Jessica Brown", date: "Apr 21, 2023", status: "Completed", amount: 234.96},
                    {id: "ORD-12341", customer: "David Miller", date: "Apr 21, 2023", status: "Completed", amount: 99.98},
                  ].map((order, index) => (
                    <tr key={index} className="hover:bg-zervia-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zervia-900">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zervia-500">
                        {order.customer}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zervia-500">
                        {order.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Shipped' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'Delivered' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zervia-900 font-medium">
                        ${order.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-zervia-600 hover:text-zervia-900">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Low Stock Products */}
        <div className="lg:col-span-1">
          <Card className="bg-white p-6 rounded-xl shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-zervia-900">Low Stock Alert</h2>
              <Link href="/vendor/inventory" className="text-sm text-zervia-500 hover:text-zervia-600 flex items-center">
                View All <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {[
                {name: "Premium Wool Blend Coat", sku: "COAT-001", stock: 3, image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=100&h=100&fit=crop"},
                {name: "Cashmere Blend Scarf", sku: "SCARF-003", stock: 5, image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=100&h=100&fit=crop"},
                {name: "Leather Gloves", sku: "GLOVE-002", stock: 2, image: "https://images.unsplash.com/photo-1613666584591-7d11dcef511b?w=100&h=100&fit=crop"},
                {name: "Winter Boots", sku: "BOOT-005", stock: 4, image: "https://images.unsplash.com/photo-1542840843-3349799cded6?w=100&h=100&fit=crop"},
              ].map((product, index) => (
                <div key={index} className="flex items-center p-3 bg-zervia-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-white">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-zervia-500">SKU: {product.sku}</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.stock <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {product.stock} left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Popular Products */}
      <Card className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-zervia-900">Popular Products</h2>
          <Link href="/vendor/products" className="text-sm text-zervia-500 hover:text-zervia-600 flex items-center">
            View All <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {name: "Premium Cotton T-Shirt", price: 29.99, sold: 128, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop"},
            {name: "Classic Denim Jacket", price: 89.99, sold: 75, image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=300&h=300&fit=crop"},
            {name: "Vintage Leather Backpack", price: 120.00, sold: 62, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop"},
            {name: "Slim Fit Chino Pants", price: 45.99, sold: 54, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop"},
          ].map((product, index) => (
            <Card key={index} className="overflow-hidden border rounded-lg">
              <div className="w-full h-48 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-zervia-900 font-bold">${product.price.toFixed(2)}</span>
                  <span className="text-xs text-zervia-500">{product.sold} sold</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
} 