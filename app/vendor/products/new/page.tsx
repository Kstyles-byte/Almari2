import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { BackButtonHeader } from '@/components/ui/back-button';
import ProductForm from '@/components/vendor/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
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

  // Fetch categories for dropdown
  const { data: categories, error: categoriesError } = await supabase
    .from('Category')
    .select('id, name')
    .order('name');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    return <div>Error loading categories</div>;
  }

  const formattedCategories = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  return (
    <div>
      <BackButtonHeader
        title="Add New Product"
        href="/vendor/products"
        backLabel="Back to Products"
        className="mb-6"
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Product Information</h2>
        </div>
        <div className="p-6">
          <ProductForm 
            categories={formattedCategories} 
            vendorId={vendorData.id} 
            mode="create"
          />
        </div>
      </div>
    </div>
  );
} 