'use client';

import React from 'react';
import { Card } from "@/components/ui/card";
import { Package, Calendar, Heart, User } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Package className="w-8 h-8 text-zervia-500" />
            <div>
              <p className="text-sm text-zervia-600">Active Orders</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-zervia-500" />
            <div>
              <p className="text-sm text-zervia-600">Past Orders</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Heart className="w-8 h-8 text-zervia-500" />
            <div>
              <p className="text-sm text-zervia-600">Wishlist Items</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <User className="w-8 h-8 text-zervia-500" />
            <div>
              <p className="text-sm text-zervia-600">Saved Addresses</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {/* Mock recent orders */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">#ORD-2024-001</p>
                <p className="text-sm text-zervia-600">2 items • $129.99</p>
              </div>
              <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                Delivered
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">#ORD-2024-002</p>
                <p className="text-sm text-zervia-600">1 item • $59.99</p>
              </div>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                Processing
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">#ORD-2024-003</p>
                <p className="text-sm text-zervia-600">3 items • $89.95</p>
              </div>
              <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                Ready for Pickup
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <Link href="/customer/orders" className="text-sm text-zervia-600 hover:text-zervia-700 inline-flex items-center">
              View All Orders
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Wishlist</h2>
          <div className="space-y-4">
            {/* Mock wishlist items */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop" 
                  alt="Premium Cotton T-Shirt" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">Premium Cotton T-Shirt</p>
                <p className="text-sm text-zervia-600">$29.99</p>
              </div>
              <button className="text-zervia-600 hover:text-zervia-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=300&h=300&fit=crop" 
                  alt="Classic Denim Jacket" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">Classic Denim Jacket</p>
                <p className="text-sm text-zervia-600">$89.99</p>
              </div>
              <button className="text-zervia-600 hover:text-zervia-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <Link href="/customer/wishlist" className="text-sm text-zervia-600 hover:text-zervia-700 inline-flex items-center">
              View Wishlist
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Personal Information</h3>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Name:</dt>
                  <dd className="text-sm">John Doe</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Email:</dt>
                  <dd className="text-sm">john.doe@example.com</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Phone:</dt>
                  <dd className="text-sm">+234 800 000 0000</dd>
                </div>
              </dl>
              <Link href="/customer/profile" className="text-sm text-zervia-600 hover:text-zervia-700 inline-flex items-center mt-2">
                Edit Profile
              </Link>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Default Address</h3>
              <address className="not-italic text-sm">
                123 Campus Street<br />
                Main Building, Room 456<br />
                University Campus<br />
                Lagos, Nigeria
              </address>
              <Link href="/customer/addresses" className="text-sm text-zervia-600 hover:text-zervia-700 inline-flex items-center mt-2">
                Manage Addresses
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 