import { getActiveSpecialOffer } from '@/lib/services/content';
import { AdminSpecialOfferForm } from '@/components/admin/content/AdminSpecialOfferForm';
import { DeleteOfferForm } from '@/components/admin/content/DeleteOfferForm';
import { createServerActionClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function checkAdminAuth() {
  const supabase = await createServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: userProfile } = await supabase.from('User').select('role').eq('id', user.id).single();
  return userProfile?.role === 'ADMIN';
}

export default async function AdminSpecialOffersPage() {
  // auth
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8">
        <Card className="max-w-md mx-auto border-red-100">
          <CardHeader className="bg-red-50 border-b border-red-100">
            <CardTitle className="text-red-700 font-heading flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" /> Unauthorized Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-red-700">You do not have permission to access this admin page.</p>
          </CardContent>
          <CardFooter className="bg-red-50 border-t border-red-100 p-4">
            <Button className="bg-zervia-500 hover:bg-zervia-600 text-white w-full" asChild>
              <a href="/">
                Return to Homepage <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const offer = await getActiveSpecialOffer();

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-zervia-900 mb-1">Manage Special Offers</h1>
          <p className="text-zervia-600">Update or create promotional offers for your storefront.</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-white text-zervia-700 border border-zervia-200 hover:bg-zervia-50">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button className="bg-zervia-500 hover:bg-zervia-600 text-white" asChild>
            <a href="/admin/content/offers/new">
              <Plus className="mr-2 h-4 w-4" /> New Offer
            </a>
          </Button>
        </div>
      </div>

      {offer ? (
        <div className="space-y-6">
          <div className="bg-zervia-50 border border-zervia-100 rounded-lg p-4 text-zervia-700">
            <p className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 text-zervia-500" /> Currently managing: <span className="font-medium ml-1">"{offer.title}"</span>
            </p>
          </div>
          <AdminSpecialOfferForm offer={offer} />
          <DeleteOfferForm offerId={offer.id} />
        </div>
      ) : (
        <Card className="shadow-md border-zervia-100">
          <CardHeader className="bg-gradient-to-r from-zervia-50 to-zervia-100 border-b border-zervia-100">
            <CardTitle className="text-zervia-800 font-heading">No Offers Found</CardTitle>
            <CardDescription className="text-zervia-600">Create your first promotional offer for the homepage.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <Button className="bg-zervia-500 hover:bg-zervia-600 text-white" asChild>
              <a href="/admin/content/offers/new">
                <Plus className="mr-2 h-4 w-4" /> Create First Offer
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 