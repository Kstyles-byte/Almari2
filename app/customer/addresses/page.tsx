'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Address, AddressCard } from "@/components/customer/address-card";
import { AddressForm } from "@/components/customer/address-form";
import { Home, PlusCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Mock addresses data
const mockAddressesData: Address[] = [
  {
    id: "1",
    name: "John Doe",
    street: "123 Campus Street, Room 456",
    city: "University City",
    state: "Lagos",
    zipCode: "100001",
    country: "Nigeria",
    phone: "+234 800 000 0001",
    isDefault: true
  },
  {
    id: "2",
    name: "John Doe",
    street: "456 Office Building, Floor 3",
    city: "Business District",
    state: "Lagos",
    zipCode: "100002",
    country: "Nigeria",
    phone: "+234 800 000 0002",
    isDefault: false
  }
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddressesData);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddAddress = (newAddress: Omit<Address, 'id'>) => {
    // Create a new address with a unique ID
    const id = `address-${Date.now()}`;
    const addressToAdd: Address = { id, ...newAddress };
    
    // If this is the first address or set as default, update other addresses
    if (newAddress.isDefault || addresses.length === 0) {
      const updatedAddresses = addresses.map(address => ({
        ...address,
        isDefault: false
      }));
      setAddresses([...updatedAddresses, addressToAdd]);
    } else {
      setAddresses([...addresses, addressToAdd]);
    }
    
    setIsAddDialogOpen(false);
    showNotification('success', 'Address added successfully');
  };

  const handleEditAddress = (addressData: Omit<Address, 'id'>) => {
    if (!addressToEdit) return;
    
    let updatedAddresses = addresses.map(address => {
      if (address.id === addressToEdit.id) {
        return { ...address, ...addressData };
      }
      
      // If we're setting this address as default, unset others
      if (addressData.isDefault && address.id !== addressToEdit.id) {
        return { ...address, isDefault: false };
      }
      
      return address;
    });
    
    setAddresses(updatedAddresses);
    setIsEditDialogOpen(false);
    setAddressToEdit(null);
    showNotification('success', 'Address updated successfully');
  };

  const handleDeleteAddress = (id: string) => {
    // Check if we're deleting the default address
    const isDefaultAddress = addresses.find(address => address.id === id)?.isDefault;
    
    // Filter out the address to delete
    const filteredAddresses = addresses.filter(address => address.id !== id);
    
    // If we deleted the default address and we have other addresses, set the first one as default
    if (isDefaultAddress && filteredAddresses.length > 0) {
      filteredAddresses[0].isDefault = true;
    }
    
    setAddresses(filteredAddresses);
    showNotification('success', 'Address deleted successfully');
  };

  const handleSetDefaultAddress = (id: string) => {
    const updatedAddresses = addresses.map(address => ({
      ...address,
      isDefault: address.id === id
    }));
    
    setAddresses(updatedAddresses);
    showNotification('success', 'Default address updated');
  };
  
  const handleEditButtonClick = (id: string) => {
    const address = addresses.find(address => address.id === id);
    if (address) {
      setAddressToEdit(address);
      setIsEditDialogOpen(true);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Addresses</h1>
          <p className="text-zervia-500">{addresses.length} {addresses.length === 1 ? 'address' : 'addresses'}</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zervia-600 hover:bg-zervia-700">
              <PlusCircle className="h-4 w-4 mr-2" /> Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm 
              onSubmit={handleAddAddress} 
              onCancel={() => setIsAddDialogOpen(false)} 
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification */}
      {notification && (
        <div 
          className={`p-3 rounded-md mb-4 ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {addressToEdit && (
            <AddressForm 
              address={addressToEdit} 
              onSubmit={handleEditAddress} 
              onCancel={() => setIsEditDialogOpen(false)} 
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(address => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEditButtonClick}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
            />
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <EmptyState
            icon={<Home className="h-12 w-12 text-zervia-300" />}
            title="No addresses saved"
            description="Add an address to make checkout faster."
            action={
              <Button 
                className="bg-zervia-600 hover:bg-zervia-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add Address
              </Button>
            }
          />
        </Card>
      )}
    </div>
  );
} 