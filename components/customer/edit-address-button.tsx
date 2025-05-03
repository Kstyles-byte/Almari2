"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface EditAddressButtonProps extends ButtonProps {
  addressId: string;
  onEdit: (id: string) => void;
}

export default function EditAddressButton({ addressId, onEdit, variant = "outline", ...props }: EditAddressButtonProps) {
  return (
    <Button 
      variant={variant} 
      className="h-8 w-8 p-0 text-zervia-600" 
      onClick={() => onEdit(addressId)}
      {...props}
    >
      <Edit2 className="h-4 w-4" />
      <span className="sr-only">Edit</span>
    </Button>
  );
} 