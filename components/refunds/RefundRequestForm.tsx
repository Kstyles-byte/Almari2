'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderItem } from '@/types';

interface RefundRequestFormProps {
  orderItem: OrderItem;
  orderId: string;
}

const REFUND_REASONS = [
  { value: 'damaged', label: 'Item damaged' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'size_issue', label: 'Size/fit issue' },
  { value: 'other', label: 'Other' }
];

export default function RefundRequestForm({ orderItem, orderId }: RefundRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    refund_amount: orderItem.price_at_purchase * orderItem.quantity,
    photos: [] as string[]
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploadedPhotos: string[] = [];
    
    for (let i = 0; i < files.length && i < 3; i++) {
      const file = files[i];
      // In a real implementation, upload to cloud storage
      // For now, we'll use base64
      const reader = new FileReader();
      reader.onloadend = () => {
        uploadedPhotos.push(reader.result as string);
        if (uploadedPhotos.length === Math.min(files.length, 3)) {
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, ...uploadedPhotos].slice(0, 3)
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          order_item_id: orderItem.id,
          ...formData
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit refund request');
      }

      router.push(`/customer/orders/${orderId}?refund=requested`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Refund - {orderItem.product?.name}</CardTitle>
        <CardDescription>
          {orderItem.quantity} x ₦{orderItem.price_at_purchase} = ₦{orderItem.price_at_purchase * orderItem.quantity}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for refund *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map(reason => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide more details about the issue..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund_amount">Refund amount</Label>
            <div className="flex items-center space-x-2">
              <span className="text-xl">₦</span>
              <Input
                id="refund_amount"
                type="number"
                value={formData.refund_amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  refund_amount: parseFloat(e.target.value) || 0 
                }))}
                max={orderItem.price_at_purchase * orderItem.quantity}
                min={0}
                step={0.01}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum refund amount: ₦{orderItem.price_at_purchase * orderItem.quantity}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">Photos (optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="photos"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload photos (max 3)
                </span>
              </label>
            </div>
            {formData.photos.length > 0 && (
              <div className="flex gap-2 mt-2">
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={photo}
                      alt={`Upload ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== idx)
                      }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.reason}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
