'use client';


import { getActiveHeroBanner } from '@/lib/services/content';
import { AdminHeroImageForm } from '@/components/admin/content/AdminHeroImageForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteHeroBannerAction } from '@/actions/content';
import { Trash2, AlertCircle, Plus, RefreshCw, ArrowRight } from 'lucide-react';
import { useFormStatus, useFormState } from 'react-dom';

// Helper function for authorization
async function checkAdminAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: userProfile } = await supabase.from('User').select('role').eq('id', user.id).single();
    return userProfile?.role === 'ADMIN';
}

// Simple Submit Button for Delete Form - Needs 'use client'
 
function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      variant="destructive" 
      size="sm" 
      type="submit" 
      disabled={pending} 
      aria-disabled={pending} 
      className="bg-red-600 hover:bg-red-700 text-white mt-2"
    >
      {pending ? (
        <>
          <div className="h-4 w-4 animate-spin mr-2 border-2 border-white/30 border-t-white rounded-full" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" /> Delete This Banner
        </>
      )}
    </Button>
  );
}


function DeleteBannerForm({ bannerId }: { bannerId: string }) {
  const deleteActionWithId = deleteHeroBannerAction.bind(null, bannerId);
  // Define a type-safe wrapper function for return type
  const formAction = async () => {
    await deleteActionWithId();
    return { success: true, message: 'Banner deleted successfully', error: null };
  };
  const [state, dispatch] = useFormState(formAction, { success: false, message: '', error: null });

  return (
    <Card className="border-red-100 bg-red-50 mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-red-700 text-lg font-heading flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-red-600">
          This action cannot be undone. Please be certain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-3">
          Deleting this banner will remove it permanently from your site. Any associated images will also be deleted from storage.
        </p>
        <form action={dispatch}>
          <DeleteSubmitButton />
          {state?.error && (
            <div className="mt-3 text-sm text-red-700 bg-red-100 p-2 rounded border border-red-200">
              Error: {state.error}
            </div>
          )}
          {state?.success && (
            <div className="mt-3 text-sm text-green-700 bg-green-100 p-2 rounded border border-green-200">
              {state.message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// --- Server Component Logic starts here ---
export default async function AdminHeroContentPage() {
    // --- Authorization ---
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
         return (
            <div className="p-6 md:p-8">
                <Card className="max-w-md mx-auto border-red-100">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                      <CardTitle className="text-red-700 font-heading flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Unauthorized Access
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
    // --- End Authorization ---

    // Fetch the *highest priority* active banner to manage initially
    const bannerToManage = await getActiveHeroBanner();

    return (
        <div className="p-6 md:p-8 space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
             <div>
               <h1 className="text-2xl md:text-3xl font-heading text-zervia-900 mb-1">Manage Hero Banners</h1>
               <p className="text-zervia-600">Update, control and create hero banners for your storefront.</p>
             </div>
             
             <div className="flex gap-3">
               <Button 
                 className="bg-white text-zervia-700 border border-zervia-200 hover:bg-zervia-50 hover:text-zervia-800 transition-all"
               >
                 <RefreshCw className="mr-2 h-4 w-4" /> Refresh
               </Button>
               <Button 
                 className="bg-zervia-500 hover:bg-zervia-600 text-white transition-all"
                 asChild
               >
                 <a href="/admin/content/hero/new">
                   <Plus className="mr-2 h-4 w-4" /> New Banner
                 </a>
               </Button>
             </div>
           </div>
            
            {bannerToManage ? (
              <div className="space-y-6">
                <div className="bg-zervia-50 border border-zervia-100 rounded-lg p-4 text-zervia-700">
                  <p className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2 text-zervia-500" />
                    Currently managing: <span className="font-medium ml-1">"{bannerToManage.title}"</span>
                  </p>
                </div>
                
                <AdminHeroImageForm banner={bannerToManage} /> 
                <DeleteBannerForm bannerId={bannerToManage.id} />
              </div>
            ) : (
              <Card className="shadow-md border-zervia-100">
                <CardHeader className="bg-gradient-to-r from-zervia-50 to-zervia-100 border-b border-zervia-100">
                  <CardTitle className="text-zervia-800 font-heading">No Banners Found</CardTitle>
                  <CardDescription className="text-zervia-600">
                    Create your first hero banner to showcase on your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center p-8 bg-zervia-50 rounded-lg">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-zervia-100">
                      <Plus className="h-8 w-8 text-zervia-600" />
                    </div>
                    <p className="text-lg text-zervia-700 font-medium mb-2">No Hero Banners Available</p>
                    <p className="text-zervia-500 text-center max-w-md mb-6">
                      Get started by creating your first hero banner to showcase on your website's homepage.
                    </p>
                    <Button 
                      className="bg-zervia-500 hover:bg-zervia-600 text-white transition-all"
                      asChild
                    >
                      <a href="/admin/content/hero/new">
                        <Plus className="mr-2 h-4 w-4" /> Create First Banner
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TODO: Add list of all banners (active and inactive) for management */}
        </div>
    );
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Admin: Hero Banners | Almari',
  description: 'Manage your storefront hero banners',
}; 