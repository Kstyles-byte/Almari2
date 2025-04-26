import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param file - The file to upload
 * @param folder - The folder to store the image in
 * @returns The Cloudinary upload result
 */
export async function uploadImage(
  file: string,
  folder: string = 'almari'
) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns The Cloudinary deletion result
 */
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

/**
 * Generate a Cloudinary URL with transformations
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns The transformed Cloudinary URL
 */
export function getImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    crop?: string;
    format?: string;
  } = {}
) {
  const {
    width,
    height,
    quality = 80,
    crop = 'fill',
    format = 'auto',
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    quality,
    crop,
    format,
    secure: true,
  });
} 