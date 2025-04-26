import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CheckoutInformationFormProps {
  onSubmit: (data: FormData) => void;
  onNext: () => void;
}

export function CheckoutInformationForm({ 
  onSubmit, 
  onNext 
}: CheckoutInformationFormProps) {
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
    onNext();
  };
  
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
        <p className="text-sm text-gray-500">Please provide your contact details for this order</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                placeholder="John" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                placeholder="Doe" 
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="john@example.com" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              placeholder="+1 (555) 000-0000" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              placeholder="Special instructions for your order" 
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-4 bg-zervia-600 hover:bg-zervia-700 text-white"
          >
            Continue to Pickup Location
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 