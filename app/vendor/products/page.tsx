import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Filter, ChevronDown, PencilIcon } from 'lucide-react';
import ProductActions from '@/components/vendor/product-actions';

export const dynamic = 'force-dynamic';

export default async function VendorProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  // Get vendor ID
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return <div>Error loading vendor data</div>;
  }

  // Get products with their primary image and category
  const { data: products, error: productsError } = await supabase
    .from('Product')
    .select(`
      id,
      name,
      slug,
      description,
      price,
      compare_at_price,
      inventory,
      is_published,
      created_at,
      ProductImage(url),
      Category(name)
    `)
    .eq('vendor_id', vendorData.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return <div>Error loading products</div>;
  }

  // Format products for display
  const formattedProducts = products.map(product => {
    const imageUrl = product.ProductImage && product.ProductImage[0]
      ? product.ProductImage[0].url
      : '/assets/placeholder-product.svg';
    
    const categoryName = product.Category ? product.Category.name : 'Uncategorized';
    
    return {
      ...product,
      imageUrl,
      categoryName
    };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Products</h1>
        <Link 
          href="/vendor/products/new" 
          className="bg-zervia-600 text-white px-4 py-2 rounded-md hover:bg-zervia-700 flex items-center text-sm"
        >
          <Plus size={16} className="mr-1" />
          Add New Product
        </Link>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                <Filter size={16} className="mr-2 text-gray-500" />
                Filter
                <ChevronDown size={16} className="ml-2 text-gray-500" />
              </button>
            </div>
            
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                Sort by
                <ChevronDown size={16} className="ml-2 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Grid/Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formattedProducts.length > 0 ? (
                formattedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <Image 
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="h-28 w-full rounded-md object-cover transition-transform hover:scale-105"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.inventory} in stock
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{product.price.toLocaleString()}
                      {product.compare_at_price && (
                        <div className="text-xs text-gray-500 line-through">₦{product.compare_at_price.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/vendor/products/${product.id}/edit`}
                          className="text-zervia-600 hover:text-zervia-800 p-1 rounded-full hover:bg-zervia-50"
                          title="Edit Product"
                        >
                          <PencilIcon size={16} />
                        </Link>
                        <ProductActions
                          productId={product.id}
                          productName={product.name}
                          productSlug={product.slug}
                          isPublished={product.is_published}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
                      <div className="mt-6">
                        <Link
                          href="/vendor/products/new"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
                        >
                          <Plus size={16} className="-ml-1 mr-2" />
                          New Product
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {formattedProducts.length > 0 && (
        <div className="mt-5">
          <nav className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-md">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{formattedProducts.length}</span> of{' '}
                <span className="font-medium">{formattedProducts.length}</span> results
              </p>
            </div>
            <div>
              <span className="relative z-0 inline-flex shadow-sm rounded-md">
                <button
                  disabled
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500"
                >
                  Previous
                </button>
                <button
                  disabled
                  className="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500"
                >
                  Next
                </button>
              </span>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
} 