import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';
import { ImageIcon, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Content Management | Zervia Admin',
  description: 'Manage hero banners, categories and other content blocks',
};

export default function ContentIndex() {
  return (
    <AdminLayout>
      <div className="container mx-auto space-y-6 py-6">
        <h1 className="text-2xl font-bold">Content Management</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/content/hero-banners">
            <Button variant="outline" className="w-full flex items-center justify-between">
              <span className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4" /> Hero Banners
              </span>
            </Button>
          </Link>

          <Link href="/admin/content/categories">
            <Button variant="outline" className="w-full flex items-center justify-between">
              <span className="flex items-center">
                <Package className="mr-2 h-4 w-4" /> Categories
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
} 