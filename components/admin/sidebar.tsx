'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings, 
  UserCog,
  RefreshCw,
  Percent
} from 'lucide-react';
import { Icons } from '../icons';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Vendors', href: '/admin/vendors', icon: Store },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Agents', href: '/admin/agents', icon: UserCog },
  { name: 'Returns', href: '/admin/returns', icon: RefreshCw },
  { name: 'Coupons', href: '/admin/coupons', icon: Percent },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 h-full w-64 border-r border-gray-200 bg-white shadow-sm md:relative md:flex md:w-64 md:flex-col">
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-6">
        <Link href="/admin" className="flex items-center">
          <Icons.logo className="h-8 w-auto" />
          <span className="ml-2 text-lg font-semibold text-zervia-900">Admin</span>
        </Link>
      </div>
      <div className="flex flex-col space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-zervia-50 text-zervia-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-zervia-900'
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
} 