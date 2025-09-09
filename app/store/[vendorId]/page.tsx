import StoreHeader from '@/components/store/StoreHeader';
import StoreCategories from '@/components/store/StoreCategories';
import { getVendorStoreMeta, getVendorStoreProducts } from '@/actions/store';
import { ProductGrid } from '@/components/products/product-grid';
import { BackButton } from '@/components/ui/back-button';

interface StorePageProps {
  params: Promise<{ vendorId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function StorePage(props: StorePageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const vendorId = params.vendorId;
  const categorySlug = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;

  // Fetch meta and products in parallel
  const [meta, productData] = await Promise.all([
    getVendorStoreMeta(vendorId),
    getVendorStoreProducts(vendorId, {
      categorySlug,
      page,
      limit: 12,
      sortBy: 'newest',
    }),
  ]);

  if (!meta) {
    return <div className="p-8 text-center text-red-600">Vendor not found or unavailable.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <BackButton href="/vendors" label="Back to All Stores" variant="minimal" />
      </div>
      
      <StoreHeader
        vendor={meta.vendor}
        averageRating={meta.averageRating}
        reviewsCount={meta.reviewsCount}
      />

      <StoreCategories categories={meta.categories} />

      <ProductGrid products={productData.products} />

      {/* TODO: Pagination controls */}
      {productData.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: productData.totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const params = new URLSearchParams(searchParams as any);
            params.set('page', String(pageNum));
            const href = `?${params.toString()}`;
            const isActive = pageNum === page;
            return (
              <a
                key={pageNum}
                href={href}
                className={`px-3 py-1 rounded border text-sm ${
                  isActive ? 'bg-zervia-600 text-white border-zervia-600' : 'border-zervia-300 text-zervia-700 hover:bg-zervia-50'
                }`}
              >
                {pageNum}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
} 