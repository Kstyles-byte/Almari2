import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
}

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export function CheckoutSummary({ items, subtotal, discount, shipping, tax, total }: CheckoutSummaryProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 pb-3 border-b">
              <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                <img 
                  src={item.image || 'https://images.unsplash.com/photo-1619033557555-af5da9a5e7a3?q=80&w=150'} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{item.name}</h3>
                <div className="flex justify-between mt-1">
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium">₦{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500">Sold by: {item.vendor}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Price Breakdown */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₦{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Discount</span>
            <span>₦{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping > 0 ? `₦${shipping.toFixed(2)}` : 'Free'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>₦{tax.toFixed(2)}</span>
          </div>
          
          {/* Total */}
          <div className="flex justify-between text-base font-semibold pt-2 mt-2 border-t">
            <span>Total</span>
            <span>₦{total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}