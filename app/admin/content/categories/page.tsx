import React from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { getAllCategories } from '../../../../actions/content';
import type { Category } from '@/types';

export const metadata = {
  title: 'Categories Management | Zervia Admin',
  description: 'Manage product categories for your e-commerce platform',
};

export default async function CategoriesPage() {
  // Fetch all categories including their children for hierarchy display
  const categories: Category[] = await getAllCategories(true);

  // Helper: build hierarchy for display – simple root + children list
  const rootCategories = categories.filter((c) => !c.parent_id);
  const childByParent: Record<string, Category[]> = {};
  categories.forEach((cat) => {
    if (cat.parent_id) {
      (childByParent[cat.parent_id] ||= []).push(cat);
    }
  });

  return (
    <AdminLayout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Categories</h1>
          {/* Placeholder link – implement /new page later */}
          <Link href="/admin/content/categories/new">
            <Button className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Category
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {rootCategories.length > 0 ? (
            rootCategories.map((cat) => (
              <Card key={cat.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{cat.name}</h2>
                    <p className="text-sm text-gray-600">Slug: {cat.slug}</p>
                    {childByParent[cat.id]?.length ? (
                      <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                        {childByParent[cat.id].map((sub) => (
                          <li key={sub.id}>{sub.name}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/content/categories/${cat.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/admin/content/categories/${cat.id}/delete`}>
                      <Button variant="outline" size="sm" className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">No categories found. Create your first category to organize products.</p>
              <Link href="/admin/content/categories/new">
                <Button className="flex items-center mx-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Category
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 