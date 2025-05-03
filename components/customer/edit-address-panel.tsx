"use client";

import React, { useState } from 'react';
import { deleteAddress, setDefaultAddress, updateAddress } from '@/actions/profile';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddressForm } from './address-form';
import { AddressCard, Address as FormattedAddress } from './address-card';

// Type for raw address data from Supabase
interface SupabaseAddress {
  id: string;
  customer_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone_number: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface EditAddressPanelProps {
  addresses: SupabaseAddress[]; // Expect raw addresses data
}

export default function EditAddressPanel({ addresses }: EditAddressPanelProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<FormattedAddress | null>(null);

  // Map the database addresses to the format expected by AddressCard
  const formattedAddresses = addresses.map(address => ({
    id: address.id,
    name: 'Home Address', // Use a default label for now
    street: address.address_line1 + (address.address_line2 ? `, ${address.address_line2}` : ''),
    city: address.city,
    state: address.state_province,
    zipCode: address.postal_code,
    country: address.country,
    phone: address.phone_number || '',
    isDefault: address.is_default
  }));

  // Handler for edit button click
  const handleEdit = (addressId: string) => {
    const addressToEdit = formattedAddresses.find(addr => addr.id === addressId);
    if (addressToEdit) {
      setEditingAddress(addressToEdit);
      setCurrentAddressId(addressId); // Keep track of the original ID
      setIsEditDialogOpen(true);
    }
  };

  // Handler for delete button click
  const handleDelete = (addressId: string) => {
    setCurrentAddressId(addressId);
    setIsDeleteDialogOpen(true);
  };

  // Handler for set default button click
  const handleSetDefault = async (addressId: string) => {
    const formData = new FormData();
    formData.append('addressId', addressId);
    
    try {
      const result = await setDefaultAddress(formData);
      
      if (result.success) {
        toast({
          title: "Address Updated",
          description: "Default address has been updated successfully.",
        });
        window.location.reload(); // Consider optimistic update instead
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update default address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Handler for confirming deletion
  const handleConfirmDelete = async () => {
    if (!currentAddressId) return;
    
    const formData = new FormData();
    formData.append('addressId', currentAddressId);
    
    try {
      const result = await deleteAddress(formData);
      
      if (result.success) {
        toast({
          title: "Address Deleted",
          description: "Address has been deleted successfully.",
        });
        setIsDeleteDialogOpen(false);
        window.location.reload(); // Consider optimistic update
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Handler for submitting edited address
  const handleEditSubmit = async (editedAddressData: Omit<FormattedAddress, 'id'>) => {
    if (!currentAddressId) return;

    // Re-map the form data back to the Supabase schema
    const formData = new FormData();
    formData.append('addressId', currentAddressId);
    formData.append('address_line1', editedAddressData.street.split(',')[0].trim()); // Basic split, might need improvement
    // Handle address_line2 if present
    const streetParts = editedAddressData.street.split(',');
    if (streetParts.length > 1) {
      formData.append('address_line2', streetParts.slice(1).join(',').trim());
    }
    formData.append('city', editedAddressData.city);
    formData.append('state_province', editedAddressData.state);
    formData.append('postal_code', editedAddressData.zipCode);
    formData.append('country', editedAddressData.country);
    formData.append('phone_number', editedAddressData.phone);
    formData.append('is_default', editedAddressData.isDefault.toString());
    // We don't update the 'name' as it's not in the schema

    try {
      const result = await updateAddress(formData);
      if (result.success) {
        toast({
          title: "Address Updated",
          description: "Your address has been updated successfully.",
        });
        setIsEditDialogOpen(false);
        window.location.reload(); // Consider optimistic update
      } else {
        toast({
          title: "Error Updating Address",
          description: result.error || "Failed to update address. Please check the details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating address:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the address.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {formattedAddresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      ))}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your address from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Make changes to your address below.
            </DialogDescription>
          </DialogHeader>
          {editingAddress && (
            <AddressForm 
              address={editingAddress}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 