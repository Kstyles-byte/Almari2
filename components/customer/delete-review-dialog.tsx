"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

interface DeleteReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reviewId: string;
  productName: string;
}

export function DeleteReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  reviewId,
  productName,
}: DeleteReviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Review</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your review for {productName}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 bg-red-50 rounded-md border border-red-200 flex items-start">
          <Trash2 className="mr-3 h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">
            Deleting this review will permanently remove it from our system. You will be able to submit a new review for this product in the future.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 