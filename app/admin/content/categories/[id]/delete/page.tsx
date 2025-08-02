import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { getCategoryById, deleteCategory } from '../../../../../../actions/content';

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Delete Category | Zervia Admin' };

export default async function DeleteCategoryPage(props: Props) {
  const params = await props.params;
  const { id } = await Promise.resolve(params);
  const category = await getCategoryById(id);
  if (!category) redirect('/admin/content/categories');

  async function handleDelete() {
    'use server';
    await deleteCategory(id);
    redirect('/admin/content/categories');
  }

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-md py-20 text-center space-y-6">
        <h1 className="text-2xl font-bold">Delete Category</h1>
        <p>Are you sure you want to delete <strong>{category.name}</strong>? This action cannot be undone.</p>
        <form action={handleDelete} className="flex justify-center gap-4">
          <Button type="submit" className="bg-red-600 hover:bg-red-700">Yes, Delete</Button>
          <Button variant="outline" asChild>
            <a href="/admin/content/categories">Cancel</a>
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
} 