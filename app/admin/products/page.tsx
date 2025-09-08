import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getProducts } from '@/actions/admin-products';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

interface SearchParams {
  page?: string;
  q?: string;
  filter?: string; // 'published' | 'unpublished'
}

const PAGE_SIZE = 10;

type ProductRow = {
  id: string;
  name: string;
  is_published: boolean;
  created_at: string;
  vendor_name?: string;
};

// Dynamically import the client table – no SSR in app router by default for client components
const ProductsTableClient = dynamic(() => import('@/components/admin/products/products-table-client'));

async function ProductsTable({ searchParams }: { searchParams: SearchParams }) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const search = searchParams.q ?? '';
  const filter = searchParams.filter ?? '';

  const { success, products, pagination, error } = await getProducts({
    page,
    limit: PAGE_SIZE,
    search,
    publishedFilter: filter,
  });

  if (!success) {
    console.error('Failed to fetch products', error);
    redirect('/error?message=Failed to fetch products');
  }

  // Prepare rows with vendor name for serialization simplicity
  const rows: ProductRow[] = (products ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    is_published: p.is_published,
    created_at: p.created_at,
    vendor_name: p.Vendor?.User?.name || '-',
  }));

  const toQueryString = (params: Record<string, any>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'string' && v.length > 0) sp.set(k, v);
    });
    return sp.toString();
  };

  const prevPageUrl = page > 1 ? `?${toQueryString({ ...searchParams, page: String(page - 1) })}` : null;
  const nextPageUrl = pagination!.totalPages > page ? `?${toQueryString({ ...searchParams, page: String(page + 1) })}` : null;

  return (
    <ProductsTableClient
      products={rows}
      pagination={{
        currentPage: pagination!.currentPage,
        totalPages: pagination!.totalPages,
        pageSize: pagination!.pageSize,
      }}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
    />
  );
}

export default async function ProductsPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  return (
    <AdminLayout>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductsTable searchParams={searchParams} />
      </Suspense>
    </AdminLayout>
  );
} 