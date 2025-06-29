'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Trash2, Star, StarOff, AlertTriangle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createProduct, saveProductImage, updateProduct, deleteProductImage } from '@/actions/vendor-products';

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
    images?: { id: string; url: string; isPrimary?: boolean }[];
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
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; isPrimary?: boolean }[]>(product?.images || []);
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Form setup
  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors, isDirty } 
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

  // Effect to check for unsaved changes before leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || uploadedImages.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, uploadedImages.length]);

  const handleGenerateSlug = () => {
    if (!watchName) return;
    
    setIsGeneratingSlug(true);
    
    // Generate slug from name
    const slug = watchName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    setValue('slug', slug, { shouldDirty: true });
    setIsGeneratingSlug(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log(`Selected ${files.length} files for upload`);
    
    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File "${file.name}" is not a supported image type`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds the 10MB size limit`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    const newImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
    }));

    console.log('Created previews:', newImages.map(img => img.preview));
    
    setUploadedImages(prev => [...prev, ...newImages]);
    
    // Reset the input value to allow selecting the same file again if needed
    e.target.value = '';
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

  const removeExistingImage = async (imageId: string) => {
    try {
      // Call the server action to delete the image
      const result = await deleteProductImage(imageId);
      
      if (result.success) {
        // Update the local state to remove the image
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        toast.success('Image removed successfully');
      } else {
        console.error('Failed to delete image:', result.error);
        toast.error(`Failed to remove image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('An unexpected error occurred while removing the image');
    }
  };

  // Add new function to set an image as primary
  const setImageAsPrimary = async (imageId: string) => {
    try {
      // First update local state to show immediate feedback
      setExistingImages(prev => 
        prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }))
      );

      // Update in database using saveProductImage with isPrimary=true
      // This will handle updating other images to not be primary
      const productId = product?.id;
      if (!productId) return;

      // Find the image URL from our state
      const imageToUpdate = existingImages.find(img => img.id === imageId);
      if (!imageToUpdate) return;

      // Save the image again with primary flag
      const result = await saveProductImage({
        productId,
        imageUrl: imageToUpdate.url,
        isPrimary: true
      });

      if (!result.success) {
        console.error('Failed to set image as primary:', result.error);
        toast.error('Failed to set image as primary');
        
        // Revert the local state change on error
        setExistingImages(prev => [...prev]);
      } else {
        toast.success('Primary image updated');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('An error occurred while setting primary image');
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

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
      let result;

      if (!productId) {
        // Create new product using server action
        console.log('Creating new product via server action');
        result = await createProduct({
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
          setFormError(`Failed to create product: ${result.error}`);
          toast.error(`Failed to create product: ${result.error}`);
          return;
        }
        
        productId = result.productId;
        toast.success("Product created successfully!");
      } else {
        // Update existing product using server action
        console.log(`Updating product ${productId} via server action`);
        result = await updateProduct(productId, {
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
          setFormError(`Failed to update product: ${result.error}`);
          toast.error(`Failed to update product: ${result.error}`);
          return;
        }
        
        toast.success("Product updated successfully!");
      }

      // Now handle image uploads if we have a product ID
      if (productId && uploadedImages.length > 0) {
        console.log(`Processing ${uploadedImages.length} images for product ${productId}`);
        toast.info(`Uploading ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}...`);
        
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
            setUploadProgress(prev => ({ ...prev, [i]: 10 }));
            
            let imageUrl = '';
            try {
              const cloudName = 'dfnjmiv3';
              console.log('Attempting Cloudinary upload with new API key...');
              setUploadProgress(prev => ({ ...prev, [i]: 30 }));
              
              const uploadResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                  method: 'POST',
                  body: formData
                }
              );
              
              setUploadProgress(prev => ({ ...prev, [i]: 60 }));
              
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
                  setUploadProgress(prev => ({ ...prev, [i]: 80 }));
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
                  setUploadProgress(prev => ({ ...prev, [i]: 80 }));
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
            const isPrimary = i === 0 && existingImages.length === 0; // First image is primary if no existing images
            
            setUploadProgress(prev => ({ ...prev, [i]: 90 }));
            
            const saveResult = await saveProductImage({
              productId,
              imageUrl,
              isPrimary
            });
            
            setUploadProgress(prev => ({ ...prev, [i]: 100 }));
            
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
      toast.success(`Product ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
        description: 'Redirecting to products page...',
        duration: 3000,
      });
      
      setTimeout(() => {
        router.push('/vendor/products');
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError('An unexpected error occurred while saving the product.');
      toast.error('An unexpected error occurred while saving the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">There was a problem submitting the form</p>
            <p className="text-sm text-red-700 mt-1">{formError}</p>
          </div>
        </div>
      )}
      
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
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-zervia-500 transition-colors">
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
                <div className="flex justify-center text-sm text-gray-600">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-zervia-600 hover:text-zervia-500 focus-within:outline-none"
                  >
                    <span className="px-2 py-1 hover:bg-zervia-50 rounded transition-colors">Upload images</span>
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
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className={`bg-gray-100 rounded-md overflow-hidden h-32 ${image.isPrimary ? 'ring-2 ring-zervia-500' : ''}`}>
                      <img 
                        src={image.url}
                        alt="Current product"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setImageAsPrimary(image.id)}
                        disabled={image.isPrimary}
                        className={`p-1.5 bg-white rounded-full shadow-md ${image.isPrimary ? 'bg-zervia-50' : 'hover:bg-zervia-50'} transition-colors`}
                        title={image.isPrimary ? "Primary image" : "Set as primary image"}
                      >
                        {image.isPrimary ? (
                          <Star size={16} className="text-zervia-500 fill-zervia-500" />
                        ) : (
                          <StarOff size={16} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                    {image.isPrimary && (
                      <div className="absolute bottom-2 left-2 bg-zervia-100 text-zervia-700 text-xs px-1.5 py-0.5 rounded-md">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview of newly uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                New Images 
                {uploadedImages.length > 0 && existingImages.length === 0 && (
                  <span className="text-xs ml-2 text-zervia-500">
                    (First image will be set as primary)
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className={`bg-gray-100 rounded-md overflow-hidden h-32 ${index === 0 && existingImages.length === 0 ? 'ring-2 ring-zervia-500' : ''}`}>
                      <img 
                        src={image.preview}
                        alt={`Product preview ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                      {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-zervia-600 h-2.5 rounded-full" 
                              style={{ width: `${uploadProgress[index]}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-100 hover:bg-red-50 transition-colors"
                      disabled={isSubmitting}
                      title="Remove image"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                    {index === 0 && existingImages.length === 0 && (
                      <div className="absolute bottom-2 left-2 bg-zervia-100 text-zervia-700 text-xs px-1.5 py-0.5 rounded-md">
                        Primary
                      </div>
                    )}
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