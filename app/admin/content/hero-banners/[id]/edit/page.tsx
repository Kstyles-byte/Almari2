import AdminLayout from '@/components/layout/AdminLayout';
import { notFound } from 'next/navigation';
import { getHeroBannerById } from '@/actions/content';
import { AdminHeroImageForm } from '@/components/admin/content/AdminHeroImageForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Edit Hero Banner | Zervia Admin',
};

export default async function EditHeroBannerPage({ params }: Props) {
  const { id } = await params;

  const banner = await getHeroBannerById(id);

  if (!banner) notFound();

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Hero Banner</h1>
        <AdminHeroImageForm banner={banner as any} />
      </div>
    </AdminLayout>
  );
}