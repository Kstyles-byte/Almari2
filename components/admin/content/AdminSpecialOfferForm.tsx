'use client';

import React, { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { SpecialOffer } from '@/types/content';
import { createSpecialOffer, updateSpecialOffer } from '@/actions/content';
import { createCoupon } from '@/actions/admin-coupons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AdminSpecialOfferFormProps {
  offer?: SpecialOffer | null; // undefined/null means new offer
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} className="bg-zervia-500 hover:bg-zervia-600 text-white">
      {pending ? (
        <>
          <div className="h-4 w-4 animate-spin mr-2 border-2 border-zervia-200 border-t-white rounded-full" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  );
}

const formatDateInput = (date: string | null | undefined) => {
  if (!date) return '';
  try {
    return format(parseISO(date), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

export const AdminSpecialOfferForm: React.FC<AdminSpecialOfferFormProps> = ({ offer }) => {
  const formReducer = async (prev: any, formData: FormData) => {
      const id = formData.get('offerId')?.toString();

      // Extract coupon fields separately (needed for both coupon creation and offer persistence)
      const couponType = formData.get('discountType')?.toString() || 'PERCENTAGE';
      const couponValue = Number(formData.get('discountValue') || 0);

      const specialOfferPayload = {
        title: formData.get('title')?.toString() || '',
        subtitle: formData.get('subtitle')?.toString() || undefined,
        discountCode: formData.get('discountCode')?.toString().trim().toUpperCase() || undefined,
        discountDescription: formData.get('discountDescription')?.toString() || undefined,
        buttonText: formData.get('buttonText')?.toString() || undefined,
        buttonLink: formData.get('buttonLink')?.toString() || undefined,
        isActive: formData.get('isActive') === 'on',
        priority: Number(formData.get('priority') || 0),
        discountType: couponType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
        discountValue: couponValue,
        startDate: formData.get('startDate') ? new Date(formData.get('startDate')!.toString()).toISOString() : undefined,
        endDate: formData.get('endDate') ? new Date(formData.get('endDate')!.toString()).toISOString() : undefined,
      };

      if (id && id !== 'new') {
        // @ts-ignore
        await updateSpecialOffer(id, specialOfferPayload);
      } else {
        // @ts-ignore
        await createSpecialOffer(specialOfferPayload);
      }

      // If a discount code and value are provided, attempt to create a matching coupon (admin-level)
      if (specialOfferPayload.discountCode && couponValue > 0) {
        try {
          const couponPayload: any = {
            code: specialOfferPayload.discountCode?.trim().toUpperCase(),
            discount_type: couponType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
            discount_value: couponValue,
            usage_limit: null,
            min_purchase_amount: null,
            is_active: true,
          };

          if (specialOfferPayload.discountDescription) {
            couponPayload.description = specialOfferPayload.discountDescription;
          }
          if (specialOfferPayload.startDate) {
            couponPayload.starts_at = specialOfferPayload.startDate;
          }
          if (specialOfferPayload.endDate) {
            couponPayload.expiry_date = specialOfferPayload.endDate;
          }

          const result = await createCoupon(couponPayload, true);
          if (!result?.success) {
            console.error('Coupon creation failed:', result?.error, result?.fieldErrors);
          }
        } catch (e) {
          console.error('Coupon creation skipped or failed:', e);
        }
      }
      return {};
  };

  // React 18+ recommends using React.useActionState instead of useFormState
  // @ts-ignore
  const [state, formAction] = (React as any).useActionState ? (React as any).useActionState(formReducer, {}) : (require('react-dom') as any).useFormState(formReducer, {});

  useEffect(() => {
    if (state) {
      toast.success('Special offer saved');
    }
  }, [state]);

  return (
    <Card className="shadow-md border-zervia-100 mt-4">
      <CardHeader>
        <CardTitle className="text-zervia-800 font-heading">
          {offer ? 'Edit Special Offer' : 'Create Special Offer'}
        </CardTitle>
        <CardDescription>Configure promotional offers shown on homepage</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {offer && <input type="hidden" name="offerId" value={offer.id} />}
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={offer?.title || ''} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea id="subtitle" name="subtitle" defaultValue={offer?.subtitle || ''} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="discountCode">Discount Code</Label>
              <Input id="discountCode" name="discountCode" defaultValue={offer?.discountCode || ''} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="discountDescription">Discount Description</Label>
              <Input id="discountDescription" name="discountDescription" defaultValue={offer?.discountDescription || ''} />
            </div>
          </div>

          {/* Coupon Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="discountType">Discount Type</Label>
              <select id="discountType" name="discountType" defaultValue={offer?.discountType ?? 'PERCENTAGE'} className="border p-2 rounded w-full">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="discountValue">Discount Value</Label>
              <Input id="discountValue" name="discountValue" type="number" step="0.01" defaultValue={offer?.discountValue ?? 0} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input id="buttonText" name="buttonText" defaultValue={offer?.buttonText || ''} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="buttonLink">Button Link</Label>
              <Input id="buttonLink" name="buttonLink" placeholder="/products" defaultValue={offer?.buttonLink || ''} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" type="number" defaultValue={offer?.priority || 0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={formatDateInput(offer?.startDate ?? offer?.startdate ?? null)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={formatDateInput(offer?.endDate ?? offer?.enddate ?? null)} />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="isActive" name="isActive" defaultChecked={offer?.isActive ?? true} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton>Save Offer</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}; 