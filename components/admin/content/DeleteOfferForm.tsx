'use client';

import { deleteSpecialOffer } from '@/actions/content';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteOfferFormProps {
  offerId: string;
}

export const DeleteOfferForm: React.FC<DeleteOfferFormProps> = ({ offerId }) => {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const success = await deleteSpecialOffer(offerId);
      if (success) {
        toast.success('Offer deleted');
      } else {
        toast.error('Failed to delete offer');
      }
    });
  };

  return (
    <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending} aria-disabled={pending}>
      {pending ? (
        <div className="h-4 w-4 animate-spin mr-2 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      Delete Offer
    </Button>
  );
}; 