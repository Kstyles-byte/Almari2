'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createProduct, saveProductImage } from '@/actions/vendor-products';

interface Category {
  value: string;
  label: string;
}

interface ProductFormProps {
  categories: Category[];
  vendorId: string;
  mode: 'create' | 'edit';
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    compare_at_price?: number | null;
    category_id: string;
    inventory: number;
    is_published: boolean;
    slug: string;
    images?: { id: string; url: string }[];
  };
}

// Form schema
const formSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  price: z.coerce.number().positive('Price must be positive'),
  compare_at_price: z.coerce.number().positive('Compare at price must be positive').nullable().optional(),
  category_id: z.string().min(1, 'Please select a category'),
  inventory: z.coerce.number().nonnegative('Inventory must be zero or positive'),
  is_published: z.boolean(),
  slug: z.string().min(3, 'Slug must be at least 3 characters long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ProductForm({ categories, vendorId, mode, product }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>(product?.images || []);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  // Form setup
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<FormData>({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      compare_at_price: product?.compare_at_price || null,
      category_id: product?.category_id || '',
      inventory: product?.inventory || 0,
      is_published: product?.is_published === undefined ? false : product.is_published,
      slug: product?.slug || '',
    },
    resolver: zodResolver(formSchema),
  });

  const watchName = watch('name');

  const handleGenerateSlug = () => {
    if (!watchName) return;
    
    setIsGeneratingSlug(true);
    
    // Generate slug from name
    const slug = watchName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    setValue('slug', slug);
    setIsGeneratingSlug(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      // Release the object URL to avoid memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsSubmitting(true);

      // Debug: Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Client Debug - Session exists:', !!session);
      console.log('Client Debug - User ID:', session?.user?.id);
      console.log('Client Debug - Vendor ID being used:', vendorId);

      // Always ensure slug is set
      if (!data.slug) {
        data.slug = data.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }

      let productId = product?.id;

      if (!productId) {
        // Create new product using server action
        console.log('Creating new product via server action');
        const result = await createProduct({
          name: data.name,
          description: data.description,
          price: parseFloat(data.price.toString()),
          compare_at_price: data.compare_at_price ? parseFloat(data.compare_at_price.toString()) : null,
          category_id: data.category_id,
          inventory: parseInt(data.inventory.toString()),
          is_published: data.is_published,
          slug: data.slug
        });

        if (!result.success) {
          toast.error(`Failed to create product: ${result.error}`);
          return;
        }
        
        productId = result.productId;
        toast.success("Product created successfully!");
      } else {
        // Handle product update logic (we'll implement this later)
        toast.info("Product update not yet implemented");
      }

      // Now handle image uploads if we have a product ID
      if (productId && uploadedImages.length > 0) {
        console.log(`Processing ${uploadedImages.length} images for product ${productId}`);
        
        // Upload each image to Cloudinary
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i];
          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('upload_preset', 'zerviaupload');
          formData.append('api_key', '912496661793575');
          formData.append('timestamp', Math.round(new Date().getTime() / 1000).toString());
          
          try {
            console.log(`Uploading image ${i+1}/${uploadedImages.length} to Cloudinary`);
            
            let imageUrl = '';
            try {
              const cloudName = 'dfnjmiv3';
              console.log('Attempting Cloudinary upload with new API key...');
              
              const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                  method: 'POST',
                  body: formData
                }
              );
              
              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error(`Cloudinary upload failed: ${errorText}`);
                
                // Fall back to a placeholder URL since Cloudinary failed
                // For development only: create a data URL from the image file
                try {
                  // Try to create a data URL from the actual uploaded image
                  const reader = new FileReader();
                  const dataUrlPromise = new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(image.file);
                  });
                  
                  // Wait for the FileReader to complete
                  const dataUrl = await dataUrlPromise;
                  console.log('Created data URL from uploaded image');
                  imageUrl = dataUrl as string;
                } catch (dataUrlError) {
                  console.error('Failed to create data URL:', dataUrlError);
                  // If creating data URL fails, use the static SVG
                  imageUrl = `/assets/placeholder-product.svg`;
                  console.log(`Using placeholder image: ${imageUrl}`);
                }
              } else {
                try {
                  const imageData = await uploadResponse.json();
                  imageUrl = imageData.secure_url;
                  console.log(`Image ${i+1} uploaded successfully to Cloudinary:`, imageData.secure_url);
                } catch (parseError) {
                  console.error('Error parsing Cloudinary response:', parseError);
                  imageUrl = `/assets/placeholder-product.svg`;
                }
              }
            } catch (error) {
              console.error(`Error in Cloudinary upload: ${error}`);
              // Fall back to a placeholder URL
              imageUrl = `/assets/placeholder-product.svg`;
              console.log(`Using placeholder image: ${imageUrl}`);
            }
            
            // Save image URL to database using server action
            const isPrimary = i === 0; // First image is primary
            const saveResult = await saveProductImage({
              productId,
              imageUrl,
              isPrimary
            });
            
            if (!saveResult.success) {
              console.error(`Failed to save image ${i+1} to database: ${saveResult.error}`);
              toast.error(`Failed to save image ${i+1} to database`);
            } else {
              console.log(`Image ${i+1} saved to database`);
            }
          } catch (error) {
            console.error(`Error processing image ${i+1}:`, error);
            toast.error(`Error processing image ${i+1}`);
          }
        }
      }
      
      // Redirect to the product's page or back to the listing
      router.push('/vendor/products');
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred while saving the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name*
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              rows={5}
              {...register('description')}
              className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₦)*
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
                className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>

            <div>
              <label htmlFor="compare_at_price" className="block text-sm font-medium text-gray-700 mb-1">
                Compare At Price (₦)
              </label>
              <input
                id="compare_at_price"
                type="number"
                step="0.01"
                {...register('compare_at_price')}
                className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
              />
              {errors.compare_at_price && <p className="mt-1 text-sm text-red-600">{errors.compare_at_price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category_id"
                {...register('category_id')}
                className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>}
            </div>

            <div>
              <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                Inventory*
              </label>
              <input
                id="inventory"
                type="number"
                {...register('inventory')}
                className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
              />
              {errors.inventory && <p className="mt-1 text-sm text-red-600">{errors.inventory.message}</p>}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              URL Slug
            </label>
            <div className="flex">
              <input
                id="slug"
                type="text"
                {...register('slug')}
                className="block w-full px-3 py-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
                placeholder="product-url-slug"
              />
              <button
                type="button"
                onClick={handleGenerateSlug}
                disabled={isGeneratingSlug || !watchName}
                className="px-4 py-2 bg-gray-100 border border-gray-200 border-l-0 rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
              >
                {isGeneratingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
              </button>
            </div>
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
            <p className="text-xs text-gray-500">
              This will be used for the product URL. Leave empty to auto-generate from name.
            </p>
          </div>

          <div className="flex items-center">
            <input
              id="is_published"
              type="checkbox"
              {...register('is_published')}
              className="h-4 w-4 text-zervia-600 focus:ring-zervia-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
              Publish this product
            </label>
          </div>
        </div>

        {/* Images Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Images
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-zervia-600 hover:text-zervia-500 focus-within:outline-none"
                  >
                    <span>Upload images</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Preview of existing images */}
          {existingImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                      <Image 
                        src={image.url}
                        alt="Product"
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview of newly uploaded images */}
          {uploadedImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                      <Image 
                        src={image.preview}
                        alt="Product"
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(index)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/vendor/products')}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>{mode === 'create' ? 'Create Product' : 'Update Product'}</>
          )}
        </button>
      </div>
    </form>
  );
} 