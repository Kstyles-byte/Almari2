import React from 'react';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { getAllHeroBannersAdmin } from '../../../../actions/content';

export const metadata = {
  title: 'Hero Banners Management | Zervia Admin',
  description: 'Manage hero banners for your e-commerce platform',
};

export default async function HeroBannersPage() {
  // Fetch all hero banners
  const heroBanners = await getAllHeroBannersAdmin();

  return (
    <AdminLayout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hero Banners</h1>
          <Link href="/admin/content/hero-banners/new">
            <Button className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Banner
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {heroBanners.length > 0 ? (
            heroBanners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative h-40 md:h-full">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 md:col-span-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{banner.title}</h2>
                        <span className={`px-2 py-1 text-xs rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{banner.subtitle}</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Button Text:</span>
                          <p className="font-medium">{banner.buttonText || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Button Link:</span>
                          <p className="font-medium truncate">{banner.buttonLink || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Priority:</span>
                          <p className="font-medium">{banner.priority}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Active Dates:</span>
                          <p className="font-medium">
                            {banner.startDate || banner.endDate ? 
                              `${banner.startDate ? new Date(banner.startDate).toLocaleDateString() : 'Always'} - ${banner.endDate ? new Date(banner.endDate).toLocaleDateString() : 'No end'}` : 
                              'Always active'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 self-end">
                      <Link href={`/admin/content/hero-banners/${banner.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <Eye className="mr-1 h-4 w-4" />
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/admin/content/hero-banners/${banner.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/admin/content/hero-banners/${banner.id}/delete`}>
                        <Button variant="outline" size="sm" className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">No hero banners found. Create your first banner to enhance your homepage.</p>
              <Link href="/admin/content/hero-banners/new">
                <Button className="flex items-center mx-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Banner
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}