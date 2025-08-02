import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getVendors } from '@/actions/admin-vendors';
import { redirect } from 'next/navigation';
import { VendorsTable } from './vendors-table';

interface SearchParams {
  page?: string;
  q?: string;
  status?: string; // 'approved' | 'pending'
}

const PAGE_SIZE = 10;

async function VendorsPageContent({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.q ?? '';
  const status = searchParams.status ?? '';

  const { success, vendors, pagination, error } = await getVendors({
    page,
    limit: PAGE_SIZE,
    search,
    approvedFilter: status === 'approved' ? 'approved' : status === 'pending' ? 'pending' : '',
  });

  if (!success) {
    console.error('Failed to fetch vendors', error);
    redirect('/error?message=Failed to fetch vendors');
  }

  const processedVendors = (vendors ?? []).map((vendor: any) => ({
    ...vendor,
    ownerEmail: vendor.User 
      ? (Array.isArray(vendor.User) ? vendor.User[0]?.email ?? '-' : vendor.User.email ?? '-')
      : '-',
  }));

  return <VendorsTable vendors={processedVendors} pagination={pagination} searchParams={searchParams} />;
}

export default async function VendorsPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading vendors...</div>}>
        <VendorsPageContent searchParams={searchParams} />
      </Suspense>
    </AdminLayout>
  );
}
