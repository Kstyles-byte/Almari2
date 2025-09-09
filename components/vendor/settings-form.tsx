"use client";

import { useState } from "react";
import Image from "next/image";
import { Save, UploadCloud } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import { updateStoreDetails } from "../../actions/vendor-settings";

type VendorData = {
  id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  whatsapp_phone: string | null;
  User?: { name: string | null; email: string | null; }[];
};

type FormSectionProps = {
  vendorData: VendorData;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function StoreDetailsForm({ vendorData, onSuccess, onError }: FormSectionProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(vendorData.logo_url);
  const [bannerPreview, setBannerPreview] = useState<string | null>(vendorData.banner_url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a preview URL for immediate UI feedback
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
      
      // Clean up the URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a preview URL for immediate UI feedback
      const objectUrl = URL.createObjectURL(file);
      setBannerPreview(objectUrl);
      
      // Clean up the URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Ensure vendorId and section are added
    formData.append("vendorId", vendorData.id);
    formData.append("section", "store-details");

    try {
      const result = await updateStoreDetails(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Store details updated successfully",
          variant: "default",
        });
        if (onSuccess) onSuccess("Store details updated successfully");
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred while updating store details",
          variant: "destructive",
        });
        if (onError) onError(result.error || "Failed to update store details");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      if (onError) onError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
          Store Name
        </label>
        <input
          type="text"
          id="storeName"
          name="storeName"
          defaultValue={vendorData.store_name}
          required
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Store Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={vendorData.description || ''}
          placeholder="Tell customers about your store, products, and what makes you unique..."
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
        />
      </div>

      <div>
        <label htmlFor="whatsappPhone" className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp Phone Number
        </label>
        <input
          type="tel"
          id="whatsappPhone"
          name="whatsappPhone"
          defaultValue={vendorData.whatsapp_phone || ''}
          placeholder="+234 XXX XXX XXXX"
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Customers can contact you directly on WhatsApp for order inquiries</p>
      </div>
      
      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
          Store Logo
        </label>
        <div className="flex items-center mt-2">
          <div className="flex-shrink-0 h-16 w-16 relative bg-gray-100 rounded-md overflow-hidden">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Store Logo"
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                <span className="text-xs">No Logo</span>
              </div>
            )}
          </div>
          <label
            htmlFor="logo-upload"
            className="ml-5 cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
          >
            <UploadCloud size={16} className="inline mr-1" />
            Change
            <input 
              id="logo-upload" 
              name="logo" 
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoChange}
            />
          </label>
        </div>
      </div>
      
      <div>
        <label htmlFor="banner" className="block text-sm font-medium text-gray-700 mb-1">
          Store Banner
        </label>
        <div className="flex items-center mt-2">
          <div className="flex-shrink-0 h-24 w-full max-w-md relative bg-gray-100 rounded-md overflow-hidden">
            {bannerPreview ? (
              <Image
                src={bannerPreview}
                alt="Store Banner"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                <span className="text-xs">No Banner</span>
              </div>
            )}
          </div>
        </div>
        <label
          htmlFor="banner-upload"
          className="mt-3 cursor-pointer inline-block bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500"
        >
          <UploadCloud size={16} className="inline mr-1" />
          Upload Banner
          <input 
            id="banner-upload" 
            name="banner" 
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleBannerChange}
          />
        </label>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function PaymentInfoForm({ vendorData, onSuccess, onError }: FormSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Ensure vendorId and section are added
    formData.append("vendorId", vendorData.id);
    formData.append("section", "payment-info");

    try {
      const result = await updateStoreDetails(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Payment information updated successfully",
          variant: "default",
        });
        if (onSuccess) onSuccess("Payment information updated successfully");
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred while updating payment information",
          variant: "destructive",
        });
        if (onError) onError(result.error || "Failed to update payment information");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      if (onError) onError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
          Account Holder Name
        </label>
        <input
          type="text"
          id="accountName"
          name="accountName"
          defaultValue={vendorData.account_name || ''}
          placeholder="Full name as it appears on your bank account"
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Name
          </label>
          <input
            type="text"
            id="bankName"
            name="bankName"
            defaultValue={vendorData.bank_name || ''}
            placeholder="e.g., First Bank of Nigeria"
            className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Account Number
          </label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            defaultValue={vendorData.account_number || ''}
            placeholder="10-digit account number"
            className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          />
        </div>
      </div>
      
      <div>
        <div className="flex items-center">
          <div className="bg-yellow-50 rounded-md p-4 w-full">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Commission Information
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This bank account information will be used for all payouts from the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function SecurityForm({ vendorData, onSuccess, onError }: FormSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Ensure vendorId and section are added
    formData.append("vendorId", vendorData.id);
    formData.append("section", "security");

    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Basic validation
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await updateStoreDetails(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Security settings updated successfully",
          variant: "default",
        });
        
        // Reset the form if password was updated
        if (newPassword) {
          form.reset();
        }
        
        if (onSuccess) onSuccess(result.message || "Security settings updated successfully");
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred while updating security settings",
          variant: "destructive",
        });
        if (onError) onError(result.error || "Failed to update security settings");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      if (onError) onError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="block w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500 text-sm"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={vendorData.User?.[0]?.email || ''}
          disabled
          className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Contact admin to change your email address</p>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zervia-600 hover:bg-zervia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zervia-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Update Password
            </>
          )}
        </button>
      </div>
    </form>
  );
}