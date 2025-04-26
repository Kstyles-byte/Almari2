import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import HeroBannerForm from '@/components/admin/HeroBannerForm';

export const metadata = {
  title: 'Add New Hero Banner | Zervia Admin',
  description: 'Create a new hero banner for your e-commerce platform',
};

export default function NewHeroBannerPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Hero Banner</h1>
        <HeroBannerForm />
      </div>
    </AdminLayout>
  );
}
