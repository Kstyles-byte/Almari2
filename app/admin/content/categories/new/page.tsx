import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButtonHeader } from '@/components/ui/back-button';
import { createCategory, getAllCategories } from '../../../../../actions/content';
import type { Category } from '@/types';

export const metadata = { title: 'New Category | Zervia Admin' };
export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  const categories = await getAllCategories();
  const parentOptions = categories.filter((c: Category) => !c.parent_id);

  async function handleSubmit(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const parentIdRaw = formData.get('parent_id') as string;
    const parentId = parentIdRaw === '' ? null : parentIdRaw;

    let iconUrl: string | null = null;

    // emoji text field
    const emoji = (formData.get('icon_emoji') as string) || '';

    const iconFile = formData.get('icon_file') as File | null;
    if (iconFile && iconFile.size > 0) {
      // upload to Cloudinary
      const bytes = await iconFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'category_icons' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        });
        stream.end(buffer);
      });
      iconUrl = uploadResult.secure_url;
    } else if (emoji.trim() !== '') {
      iconUrl = emoji.trim();
    }

    await createCategory({ name, iconUrl, parentId });
    redirect('/admin/content/categories');
  }

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-lg py-10">
        <BackButtonHeader
          title="Add New Category"
          href="/admin/content/categories"
          backLabel="Back to Categories"
          className="mb-6"
        />

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input type="text" name="name" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Icon Emoji</label>
              <Input type="text" name="icon_emoji" placeholder="😀" maxLength={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Icon (PNG/SVG)</label>
              <input type="file" name="icon_file" accept="image/*" className="w-full text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Category</label>
            <select name="parent_id" className="w-full border rounded px-3 py-2 text-sm">
              <option value="">None</option>
              {parentOptions.map((opt: Category) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Create Category</Button>
        </form>
      </div>
    </AdminLayout>
  );
} 