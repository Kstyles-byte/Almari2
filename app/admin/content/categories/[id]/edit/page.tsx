import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButtonHeader } from '@/components/ui/back-button';
import { getCategoryById, getAllCategories, updateCategory } from '../../../../../../actions/content';
import type { Category } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Category | Zervia Admin',
};

export default async function EditCategoryPage(props: Props) {
  const params = await props.params;
  // Next.js requires awaiting params for dynamic usage
  const { id } = await Promise.resolve(params);
  const category = await getCategoryById(id);
  if (!category) {
    redirect('/admin/content/categories');
  }

  const categories = await getAllCategories();
  const parentOptions = categories.filter((c: Category) => c.id !== id && !c.parent_id);

  async function handleSubmit(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const parentIdRaw = formData.get('parent_id') as string;
    const parentId = parentIdRaw === '' ? null : parentIdRaw;

    let iconUrl: string | undefined = undefined; // undefined means keep existing
    const emojiInput = (formData.get('icon_emoji') as string) || '';
    const iconFile = formData.get('icon_file') as File | null;

    if (iconFile && iconFile.size > 0) {
      const bytes = await iconFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      const uploadRes = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'category_icons' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        });
        stream.end(buffer);
      });
      iconUrl = uploadRes.secure_url;
    } else if (emojiInput.trim() !== '') {
      iconUrl = emojiInput.trim();
    }

    await updateCategory(id, { name, iconUrl, parentId });
    redirect('/admin/content/categories');
  }

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-lg py-10">
        <BackButtonHeader
          title="Edit Category"
          subtitle={category.name}
          href="/admin/content/categories"
          backLabel="Back to Categories"
          className="mb-6"
        />

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input type="text" name="name" defaultValue={category.name} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Icon Emoji</label>
              <Input type="text" name="icon_emoji" placeholder="😀" defaultValue={category.icon_url?.length === 1 ? category.icon_url : ''} maxLength={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Icon</label>
              <input type="file" name="icon_file" accept="image/*" className="w-full text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Category</label>
            <select
              name="parent_id"
              defaultValue={category.parent_id || ''}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {parentOptions.map((opt: Category) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </div>
    </AdminLayout>
  );
} 