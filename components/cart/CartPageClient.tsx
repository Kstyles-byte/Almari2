"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart, useCartActions } from "@/components/providers/CartProvider";
import { getProductsByIds, BasicProduct } from "@/lib/services/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CouponInputForm } from "@/components/cart/CouponInputForm";
import { CartItemUnified } from "@/components/cart/CartItemUnified";
import { toast } from "sonner";
import { PageTransitionLoader } from "@/components/ui/loader";

export const CartPageClient: React.FC = () => {
  const cartItems = useCart();
  const { updateQty, remove, clear } = useCartActions();

  const [hydrated, setHydrated] = useState(false);
  const [productMap, setProductMap] = useState<Record<string, BasicProduct>>({});
  const [isClearing, startClear] = useTransition();
  const [discount, setDiscount] = useState(0);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // Fetch product details
  useEffect(() => {
    (async () => {
      const idsToFetch = cartItems
        .filter((i) => !productMap[i.productId])
        .map((i) => i.productId);
      if (idsToFetch.length) {
        const products = await getProductsByIds(idsToFetch);
        const newMap: Record<string, BasicProduct> = { ...productMap };
        products.forEach((p) => {
          newMap[p.id] = p;
        });
        setProductMap(newMap);
      }
      setHydrated(true);
    })();
  }, [cartItems]);

  const subtotal = cartItems.reduce((total, item) => {
    const product = productMap[item.productId];
    if (!product) return total;
    return total + product.price * item.qty;
  }, 0);

  const taxes = 0 as number;
  const pickupFee = 0 as number;
  const total = Math.max(0, subtotal + taxes + pickupFee - discount);

  const handleCouponApply = (d: number, code: string | null) => {
    setDiscount(d);
    setDiscountCode(code);
  };

  if (!hydrated) return <PageTransitionLoader text="Loading your cart..." />;

  const detailedItems = cartItems.map((ci) => {
    const product = productMap[ci.productId];
    return {
      productId: ci.productId,
      qty: ci.qty,
      name: product?.name || "Unknown",
      slug: product?.slug || "#",
      price: product?.price || 0,
      inventory: product?.inventory || 0,
      image: product?.image || null,
      vendorName: product?.vendorName || null,
    } as const;
  });

  const itemCount = cartItems.reduce((c, i) => c + i.qty, 0);

  return (
    <div className="bg-zervia-50 py-8 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-zervia-900 mb-8">Shopping Cart</h1>

        {detailedItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-zervia-900">Cart Items ({itemCount})</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zervia-600 hover:text-red-600 disabled:opacity-50"
                    disabled={isClearing || detailedItems.length === 0}
                    onClick={() =>
                      startClear(async () => {
                        clear();
                        toast.success("Cart cleared");
                      })
                    }
                  >
                    {isClearing ? "Clearing..." : "Clear All"}
                  </Button>
                </div>
                <div className="divide-y divide-gray-200">
                  {detailedItems.map((item) => (
                    <CartItemUnified
                      key={item.productId}
                      item={item}
                      onUpdateQty={async (pid, qty) => {
                        updateQty(pid, qty);
                      }}
                      onRemove={async (pid) => {
                        remove(pid);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-zervia-900">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-zervia-700">
                      <span>
                        Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                      </span>
                      <span>₦{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zervia-700">
                      <span>Taxes</span>
                      <span>{taxes === 0 ? "Calculated at checkout" : `₦${taxes.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-zervia-700">
                      <span>Campus Pickup Fee</span>
                      <span>{pickupFee === 0 ? "Free" : `₦${pickupFee.toFixed(2)}`}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-zervia-600 font-medium bg-green-50 p-2 rounded">
                        <span>Discount {discountCode ? `(${discountCode})` : ""}</span>
                        <span className="text-green-700">-₦{discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <CouponInputForm cartSubtotal={subtotal} onCouponApply={handleCouponApply} />
                  <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-zervia-900 text-lg">
                    <span>Estimated Total</span>
                    <span>₦{total.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-6 border-t border-gray-100">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/checkout">
                      Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center bg-white p-12 rounded-xl shadow-sm">
            <ShoppingBag className="mx-auto h-16 w-16 text-zervia-300" />
            <h2 className="mt-6 text-xl font-semibold text-zervia-900">Your cart is empty</h2>
            <p className="mt-2 text-zervia-600">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="mt-6">
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 