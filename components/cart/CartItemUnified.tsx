"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

export interface CartItemData {
  productId: string;
  qty: number;
  name: string;
  slug: string;
  price: number;
  inventory: number;
  image?: string | null;
  vendorName?: string | null;
}

interface CartItemUnifiedProps {
  item: CartItemData;
  onUpdateQty: (productId: string, qty: number) => void | Promise<void>;
  onRemove: (productId: string) => void | Promise<void>;
}

export const CartItemUnified: React.FC<CartItemUnifiedProps> = ({ item, onUpdateQty, onRemove }) => {
  const [pending, setPending] = useState(false);

  const handleChangeQty = async (newQty: number) => {
    if (newQty < 1 || newQty > item.inventory) {
      toast.warning(`Quantity must be between 1 and ${item.inventory}`);
      return;
    }
    setPending(true);
    try {
      await onUpdateQty(item.productId, newQty);
      toast.success("Quantity updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    } finally {
      setPending(false);
    }
  };

  const handleRemove = async () => {
    setPending(true);
    try {
      await onRemove(item.productId);
      toast.success("Item removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-24 sm:h-24 h-32 w-full relative mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
          <Image
            src={item.image || "/placeholder-product.jpg"}
            alt={item.name}
            fill
            className="object-cover rounded-md"
          />
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <div>
              <Link
                href={`/product/${item.slug}`}
                className="font-medium text-zervia-900 hover:text-zervia-600 line-clamp-2"
              >
                {item.name}
              </Link>
              <p className="text-sm text-zervia-500 mt-1">Vendor: {item.vendorName || "N/A"}</p>
            </div>
            <div className="mt-2 sm:mt-0 sm:text-right">
              <div className="font-medium text-zervia-900">₦{item.price.toFixed(2)}</div>
              {item.qty > 1 && (
                <div className="text-xs text-zervia-500 mt-1">(₦{item.price.toFixed(2)} each)</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
                disabled={item.qty <= 1 || pending}
                onClick={() => handleChangeQty(item.qty - 1)}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 h-8 text-center flex items-center justify-center text-sm">{item.qty}</span>
              <button
                className="w-8 h-8 flex items-center justify-center text-zervia-600 hover:bg-zervia-50 disabled:opacity-50"
                disabled={item.qty >= item.inventory || pending}
                onClick={() => handleChangeQty(item.qty + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Remove */}
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:bg-red-50 h-8 w-8"
              onClick={handleRemove}
              disabled={pending}
              aria-label="Remove item"
            >
              {pending ? <span className="animate-spin h-4 w-4">...</span> : <Trash2 size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 