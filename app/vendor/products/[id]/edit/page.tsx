import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import ProductForm from '@/components/vendor/product-form';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get the product data on the server side
export default async function EditProductPage(props: Props) {
  // Extract ID directly from props without destructuring params
  const productId = (await props.params).id;
  
  if (!productId) {
    return redirect('/vendor/products');
  }
  
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

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("User authentication error:", userError.message);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="font-medium text-red-800">Authentication Error</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">
          There was a problem authenticating your session. Please try signing in again.
        </p>
        <div className="mt-4">
          <Link href="/login" className="text-sm font-medium text-red-700 hover:text-red-800">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return redirect('/login?redirectTo=/vendor/products');
  }

  // Get vendor ID
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('id, is_approved')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    console.error("Vendor fetch error:", vendorError?.message);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="font-medium text-red-800">Vendor Profile Not Found</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">
          Unable to locate your vendor profile. Please contact support if you believe this is an error.
        </p>
        <div className="mt-4">
          <Link href="/vendor/products" className="text-sm font-medium text-red-700 hover:text-red-800">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  // Check if vendor is approved
  if (!vendorData.is_approved) {
    return redirect('/account/vendor-pending');
  }

  // Fetch the product data with more detailed error handling
  const { data: product, error: productError } = await supabase
    .from('Product')
    .select(`
      id,
      name,
      description,
      price,
      compare_at_price,
      category_id,
      inventory,
      is_published,
      slug
    `)
    .eq('id', productId)
    .eq('vendor_id', vendorData.id)
    .single();

  if (productError) {
    console.error('Error fetching product:', productError.message);
    
    if (productError.code === 'PGRST116') {
      // No rows returned means product not found or not owned by this vendor
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h3 className="font-medium text-yellow-800">Product Not Found</h3>
          </div>
          <p className="mt-2 text-sm text-yellow-700">
            The product you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <div className="mt-4">
            <Link href="/vendor/products" className="text-sm font-medium text-yellow-700 hover:text-yellow-800">
              Return to Your Products
            </Link>
          </div>
        </div>
      );
    }
    
    // Other database errors
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="font-medium text-red-800">Database Error</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">
          Unable to fetch product information. Please try again later.
        </p>
        <div className="mt-4">
          <Link href="/vendor/products" className="text-sm font-medium text-red-700 hover:text-red-800">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    console.error('No product found for ID:', productId);
    return notFound();
  }

  // Fetch the product images with proper error handling
  const { data: productImages, error: imagesError } = await supabase
    .from('ProductImage')
    .select('id, url, display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  if (imagesError) {
    console.error('Error fetching product images:', imagesError.message);
    // Continue with empty images array rather than failing completely
  }

  // Fetch categories for dropdown
  const { data: categories, error: categoriesError } = await supabase
    .from('Category')
    .select('id, name')
    .order('name');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError.message);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="font-medium text-red-800">Failed to Load Categories</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">
          Unable to fetch product categories. Please try again later.
        </p>
        <div className="mt-4">
          <Link href="/vendor/products" className="text-sm font-medium text-red-700 hover:text-red-800">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  const formattedCategories = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  // Process images to determine which one is primary based on display_order
  const processedImages = productImages ? productImages.map(img => ({
    id: img.id,
    url: img.url,
    // Indicate primary status based on display_order (-1 means primary)
    isPrimary: img.display_order === -1
  })) : [];

  // Prepare product data with processed images
  const productWithImages = {
    ...product,
    images: processedImages || []
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link 
          href="/vendor/products" 
          className="text-zervia-600 hover:text-zervia-700 flex items-center mr-4"
        >
          <ChevronLeft size={20} />
          <span>Back to Products</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Product Information</h2>
        </div>
        <div className="p-6">
          <ProductForm 
            categories={formattedCategories} 
            vendorId={vendorData.id} 
            mode="edit"
            product={productWithImages}
          />
        </div>
      </div>
    </div>
  );
} 