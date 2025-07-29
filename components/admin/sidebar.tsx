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
  Percent,
  Shield,
  ChevronDown
} from 'lucide-react';
import { Icons } from '../icons';

const navSections = [
  {
    header: null,
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    header: 'Users',
    items: [
      { name: 'Admins', href: '/admin/users?role=ADMIN', icon: Shield },
      { name: 'Agents', href: '/admin/agents', icon: UserCog },
      { name: 'Vendors', href: '/admin/vendors', icon: Store },
      { name: 'Customers', href: '/admin/users?role=CUSTOMER', icon: Users },
    ],
  },
  {
    header: null,
    items: [
      { name: 'Products', href: '/admin/products', icon: Package },
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Content', href: '/admin/content', icon: FileText },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Returns', href: '/admin/returns', icon: RefreshCw },
      { name: 'Coupons', href: '/admin/coupons', icon: Percent },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  const renderLink = (item: { name: string; href: string; icon: any }) => (
    <Link
      key={item.name}
      href={item.href}
      className={cn(
        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        pathname === item.href.split('?')[0]
          ? 'bg-zervia-50 text-zervia-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-zervia-900'
      )}
    >
      <item.icon className="mr-3 h-4 w-4" />
      {item.name}
    </Link>
  );

  return (
    <aside className="fixed left-0 top-0 z-20 h-full w-64 border-r border-gray-200 bg-white shadow-sm md:relative md:flex md:w-64 md:flex-col">
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-6">
        <Link href="/admin" className="flex items-center">
          <Icons.logo className="h-8 w-auto" />
          <span className="ml-2 text-lg font-semibold text-zervia-900">Admin</span>
        </Link>
      </div>
      <div className="flex flex-col space-y-1 p-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.header ?? Math.random()} className="mb-2">
            {section.header && (
              <div className="flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <Users className="mr-3 h-4 w-4" />
                {section.header}
              </div>
            )}
            <div className="ml-1 flex flex-col space-y-1">
              {section.items.map(renderLink)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
} 