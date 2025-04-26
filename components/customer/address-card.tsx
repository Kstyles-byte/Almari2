"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <Card className="p-4 border border-gray-200 hover:border-zervia-200 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-zervia-900">{address.name}</h3>
            {address.isDefault && (
              <Badge className="bg-zervia-100 text-zervia-800 hover:bg-zervia-200">Default</Badge>
            )}
          </div>
          <p className="text-sm text-zervia-700 mt-1">{address.street}</p>
          <p className="text-sm text-zervia-700">{`${address.city}, ${address.state} ${address.zipCode}`}</p>
          <p className="text-sm text-zervia-700">{address.country}</p>
          <p className="text-sm text-zervia-600 mt-2">{address.phone}</p>
        </div>
        
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-zervia-600"
            onClick={() => onEdit(address.id)}
          >
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-600"
            onClick={() => onDelete(address.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      
      {!address.isDefault && (
        <Button
          variant="link"
          className="mt-3 px-0 text-sm text-zervia-600 hover:text-zervia-800"
          onClick={() => onSetDefault(address.id)}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Set as default address
        </Button>
      )}
    </Card>
  );
} 