import { AdminSpecialOfferForm } from '@/components/admin/content/AdminSpecialOfferForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function NewOfferPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="text-zervia-600 hover:text-zervia-800">
          <a href="/admin/content/offers"><ArrowLeft className="h-4 w-4 mr-2" /> Back</a>
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading ml-4">Create New Special Offer</h1>
      </div>
      <AdminSpecialOfferForm offer={null} />
    </div>
  );
} 