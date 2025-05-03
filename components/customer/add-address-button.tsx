"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddressForm } from "@/components/customer/address-form";

interface AddAddressButtonProps extends ButtonProps {}

export function AddAddressButton({ variant = "outline", ...props }: AddAddressButtonProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-1" {...props}>
          <PlusCircle className="h-4 w-4" />
          Add New Address
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogDescription>
            Fill in the details for your new address.
          </DialogDescription>
        </DialogHeader>
        <AddressForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
} 